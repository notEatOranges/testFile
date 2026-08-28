package com.love.nest.api;

import com.love.nest.core.ApiException;
import com.love.nest.core.Jwt;
import com.love.nest.repo.Couples;
import com.love.nest.repo.Kv;
import com.love.nest.repo.Users;
import com.love.nest.ws.Hub;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
public class AuthController {
    private final Users users;
    private final Couples couples;
    private final Jwt jwt;
    private final BCryptPasswordEncoder enc;
    private final Kv kv;
    private final Hub hub;
    private final ObjectMapper om;

    public AuthController(Users users, Couples couples, Jwt jwt, BCryptPasswordEncoder enc,
                          Kv kv, Hub hub, ObjectMapper om) {
        this.users = users;
        this.couples = couples;
        this.jwt = jwt;
        this.enc = enc;
        this.kv = kv;
        this.hub = hub;
        this.om = om;
    }

    @PostMapping("/api/auth/register")
    public Map<String, Object> register(@RequestBody Map<String, Object> body) {
        String username = str(body.get("username"));
        String password = str(body.get("password"));
        String role = str(body.get("role"));
        if (!username.matches("[A-Za-z0-9_]{3,20}"))
            throw new ApiException("账号需为 3~20 位字母/数字/下划线");
        if (password == null || password.length() < 6) throw new ApiException("密码至少 6 位");
        if (!"boy".equals(role) && !"girl".equals(role)) throw new ApiException("请选择角色（男生/女生）");
        if (users.findByUsername(username) != null) throw new ApiException("账号已被注册");
        long uid = users.create(username, enc.encode(password), role,
                str(body.get("nick")), str(body.get("avatar")));
        Map<String, Object> user = users.findById(uid);
        return Map.of("ok", true, "token", jwt.sign(uid), "user", pub(user));
    }

    @PostMapping("/api/auth/login")
    public Map<String, Object> login(@RequestBody Map<String, Object> body) {
        Map<String, Object> user = users.findByUsername(str(body.get("username")));
        if (user == null || !enc.matches(str(body.get("password")), str(user.get("password_hash"))))
            throw new ApiException(401, "账号或密码不对");
        return Map.of("ok", true, "token", jwt.sign(((Number) user.get("id")).longValue()), "user", pub(user));
    }

    @GetMapping("/api/me")
    public Map<String, Object> me(HttpServletRequest req) {
        return mePayload(user(req));
    }

    @PutMapping("/api/me/profile")
    public Map<String, Object> profile(HttpServletRequest req, @RequestBody Map<String, Object> body) {
        Map<String, Object> u = user(req);
        long uid = ((Number) u.get("id")).longValue();
        String nick = str(body.get("nick"));
        String avatar = str(body.get("avatar"));
        users.updateProfile(uid, nick, avatar);
        Map<String, Object> fresh = users.findById(uid);
        // 同步写 kv profile/{role}，对方实时看到
        String room = str(fresh.get("couple_id"));
        String role = str(fresh.get("role"));
        if (room != null && !room.isEmpty()) {
            ObjectNode partial = om.createObjectNode().put("nick", nick == null ? "" : nick)
                    .put("avatar", avatar == null ? "" : avatar);
            long ts = kv.update(room, "profile/" + role, partial);
            hub.broadcastKv(room, "profile/" + role, partial, ts);
        }
        return mePayload(fresh);
    }

    // ---------- helpers ----------

    Map<String, Object> mePayload(Map<String, Object> u) {
        Map<String, Object> out = new java.util.HashMap<>();
        out.put("ok", true);
        out.put("user", pub(u));
        String room = str(u.get("couple_id"));
        if (room != null && !room.isEmpty()) {
            Map<String, Object> couple = couples.findById(room);
            List<Map<String, Object>> members = new ArrayList<>();
            for (Map<String, Object> m : users.membersOf(room)) {
                Map<String, Object> mm = new java.util.HashMap<>(m);
                mm.put("online", hub.isOnline(room, str(m.get("role"))));
                members.add(mm);
            }
            Map<String, Object> c = new java.util.HashMap<>();
            if (couple != null) {
                c.put("id", couple.get("id"));
                c.put("inviteCode", couple.get("invite_code"));
                c.put("createdBy", couple.get("created_by"));
            }
            c.put("members", members);
            out.put("couple", c);
        } else {
            out.put("couple", null);
        }
        return out;
    }

    static Map<String, Object> pub(Map<String, Object> u) {
        return Map.of(
                "id", u.get("id"),
                "username", u.get("username"),
                "role", u.get("role"),
                "nick", u.get("nick") == null ? "" : u.get("nick"),
                "avatar", u.get("avatar") == null ? "" : u.get("avatar"),
                "coupleId", u.get("couple_id") == null ? "" : u.get("couple_id"));
    }

    static Map<String, Object> user(HttpServletRequest req) {
        @SuppressWarnings("unchecked")
        Map<String, Object> u = (Map<String, Object>) req.getAttribute("user");
        if (u == null) throw new ApiException(401, "请先登录");
        return u;
    }

    static String str(Object o) {
        return o == null ? null : o.toString();
    }
}
