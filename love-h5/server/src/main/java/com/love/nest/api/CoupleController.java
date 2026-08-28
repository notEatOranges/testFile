package com.love.nest.api;

import com.love.nest.core.ApiException;
import com.love.nest.repo.Couples;
import com.love.nest.repo.Kv;
import com.love.nest.repo.Users;
import com.love.nest.ws.Hub;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Map;

/** 情侣空间：创建（占自己角色槽）/ 加入（校验角色与槽位匹配）/ 退出 */
@RestController
@RequestMapping("/api/couple")
public class CoupleController {
    /** 与原小程序一致的邀请码字符集（去掉易混 I/O/0/1） */
    static final String CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RND = new SecureRandom();

    private final Users users;
    private final Couples couples;
    private final Kv kv;
    private final Hub hub;
    private final ObjectMapper om;

    public CoupleController(Users users, Couples couples, Kv kv, Hub hub, ObjectMapper om) {
        this.users = users;
        this.couples = couples;
        this.kv = kv;
        this.hub = hub;
        this.om = om;
    }

    @PostMapping("/create")
    public Map<String, Object> create(HttpServletRequest req) {
        Map<String, Object> u = AuthController.user(req);
        if (!isBlank(str(u.get("couple_id")))) throw new ApiException("你已经在空间里了");
        long uid = ((Number) u.get("id")).longValue();
        String role = str(u.get("role"));

        String coupleId = "c_" + code(10);
        String invite = code(6);
        while (couples.findByInvite(invite) != null) invite = code(6);
        couples.create(coupleId, invite, uid);
        users.bindCouple(uid, coupleId);

        // presence 占位（与原 createCouple 云函数一致）
        ObjectNode presence = om.createObjectNode()
                .put("online", false).put("lastSeen", 0)
                .put("uid", uid).put("joinedAt", System.currentTimeMillis());
        long ts = kv.set(coupleId, "members/" + role, presence);
        hub.broadcastKv(coupleId, "members/" + role, presence, ts);

        return Map.of("ok", true, "coupleId", coupleId, "inviteCode", invite, "role", role);
    }

    @PostMapping("/join")
    public Map<String, Object> join(HttpServletRequest req, @RequestBody Map<String, Object> body) {
        Map<String, Object> u = AuthController.user(req);
        if (!isBlank(str(u.get("couple_id")))) throw new ApiException("你已经在空间里了");
        String code = str(body.get("inviteCode"));
        if (code == null || code.trim().isEmpty()) throw new ApiException("请输入邀请码");
        code = code.trim().toUpperCase();

        Map<String, Object> couple = couples.findByInvite(code);
        if (couple == null) throw new ApiException("邀请码无效");
        String coupleId = str(couple.get("id"));
        String role = str(u.get("role"));
        long uid = ((Number) u.get("id")).longValue();
        // 角色与槽位匹配：boy 只能占 boy 槽，girl 只能占 girl 槽
        if (users.roleTaken(coupleId, role))
            throw new ApiException("这个空间里" + ("boy".equals(role) ? "男生" : "女生") + "的位置已经有人啦");
        users.bindCouple(uid, coupleId);

        ObjectNode presence = om.createObjectNode()
                .put("online", false).put("lastSeen", 0)
                .put("uid", uid).put("joinedAt", System.currentTimeMillis());
        long ts = kv.set(coupleId, "members/" + role, presence);
        hub.broadcastKv(coupleId, "members/" + role, presence, ts);

        return Map.of("ok", true, "coupleId", coupleId, "role", role);
    }

    @PostMapping("/leave")
    public Map<String, Object> leave(HttpServletRequest req) {
        Map<String, Object> u = AuthController.user(req);
        String room = str(u.get("couple_id"));
        if (isBlank(room)) throw new ApiException("你还没有加入空间");
        users.bindCouple(((Number) u.get("id")).longValue(), null);
        // 在线标记置离线（历史数据保留在空间里）
        ObjectNode presence = om.createObjectNode()
                .put("online", false).put("lastSeen", System.currentTimeMillis());
        long ts = kv.set(room, "members/" + str(u.get("role")), presence);
        hub.broadcastKv(room, "members/" + str(u.get("role")), presence, ts);
        return Map.of("ok", true);
    }

    @GetMapping("/invite")
    public Map<String, Object> invite(HttpServletRequest req) {
        Map<String, Object> u = AuthController.user(req);
        String room = str(u.get("couple_id"));
        if (isBlank(room)) throw new ApiException("你还没有加入空间");
        Map<String, Object> couple = couples.findById(room);
        return Map.of("ok", true, "inviteCode", couple == null ? "" : couple.get("invite_code"));
    }

    public static String code(int n) {
        StringBuilder sb = new StringBuilder(n);
        for (int i = 0; i < n; i++) sb.append(CHARSET.charAt(RND.nextInt(CHARSET.length())));
        return sb.toString();
    }

    static boolean isBlank(String s) {
        return s == null || s.isEmpty();
    }

    static String str(Object o) {
        return o == null ? null : o.toString();
    }
}
