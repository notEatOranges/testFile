package com.love.nest.core;

import com.love.nest.api.CoupleController;
import com.love.nest.repo.Couples;
import com.love.nest.repo.Kv;
import com.love.nest.repo.Users;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/** 云开发历史数据导入（账号创建 + 空间绑定 + kv 全量 + cloud:// 文件 URL 改写） */
@Component
public class ImportService {
    private final Users users;
    private final Couples couples;
    private final Kv kv;
    private final BCryptPasswordEncoder enc;
    private final ObjectMapper om;

    public ImportService(Users users, Couples couples, Kv kv, BCryptPasswordEncoder enc, ObjectMapper om) {
        this.users = users;
        this.couples = couples;
        this.kv = kv;
        this.enc = enc;
        this.om = om;
    }

    public Map<String, Object> importAll(JsonNode body) {
        // 1) 两个角色账号（已存在则更新密码/昵称/头像）
        JsonNode accounts = body.path("accounts");
        Map<String, Long> uids = new HashMap<>();
        for (String role : new String[]{"boy", "girl"}) {
            JsonNode acc = accounts.path(role);
            String username = acc.path("username").asText("");
            String password = acc.path("password").asText("");
            if (username.isEmpty() || password.length() < 6)
                throw new ApiException("accounts." + role + " 需要 username 和至少 6 位 password");
            String hash = enc.encode(password);
            String nick = acc.path("nick").asText("");
            String avatar = acc.path("avatar").asText("");
            Map<String, Object> exist = users.findByUsername(username);
            long uid;
            if (exist == null) {
                uid = users.create(username, hash, role, nick, avatar);
            } else {
                uid = ((Number) exist.get("id")).longValue();
                users.setPassword(uid, hash);
                users.updateProfile(uid, nick, avatar);
            }
            uids.put(role, uid);
        }

        // 2) 情侣空间（可指定历史 coupleId，保证 kv 数据原样继承）
        JsonNode couple = body.path("couple");
        String coupleId = couple.path("id").asText("");
        String invite = couple.path("inviteCode").asText(CoupleController.code(6));
        if (coupleId.isEmpty()) {
            coupleId = "c_" + CoupleController.code(10);
            while (couples.findById(coupleId) != null) coupleId = "c_" + CoupleController.code(10);
        }
        if (couples.findById(coupleId) == null) {
            couples.create(coupleId, invite, uids.get("boy"));
        }
        users.bindCouple(uids.get("boy"), coupleId);
        users.bindCouple(uids.get("girl"), coupleId);

        // 3) kv 全量导入：cloud:// fileID 按 fileMap 批量改写为本地 /files/ URL
        JsonNode fileMap = body.path("fileMap");
        int count = 0;
        for (JsonNode row : body.path("kv")) {
            String room = row.path("room").asText(coupleId);
            String path = row.path("path").asText("");
            if (path.isEmpty()) continue;
            JsonNode value = row.path("value");
            String valueJson = value.isMissingNode() || value.isNull() ? null : rewriteFiles(value.toString(), fileMap);
            long ts = row.path("ts").asLong(System.currentTimeMillis());
            kv.importRow(room, path, valueJson, ts);
            count++;
        }
        Map<String, Object> out = new HashMap<>();
        out.put("ok", true);
        out.put("coupleId", coupleId);
        out.put("kvImported", count);
        return out;
    }

    private String rewriteFiles(String json, JsonNode fileMap) {
        if (!fileMap.isObject() || fileMap.isEmpty()) return json;
        String out = json;
        Iterator<Map.Entry<String, JsonNode>> it = fileMap.fields();
        while (it.hasNext()) {
            Map.Entry<String, JsonNode> e = it.next();
            out = out.replace(e.getKey(), e.getValue().asText());
        }
        return out;
    }
}
