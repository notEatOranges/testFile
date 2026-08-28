package com.love.nest.api;

import com.love.nest.core.ApiException;
import com.love.nest.repo.Kv;
import com.love.nest.ws.Hub;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * kv REST：语义与原 kvWrite 云函数一致；写完即时通过 WebSocket 广播给空间内订阅者。
 * room = 当前登录用户的 coupleId（未配对禁止读写业务数据）。
 */
@RestController
@RequestMapping("/api/kv")
public class KvController {
    private final Kv kv;
    private final Hub hub;
    private final ObjectMapper om;

    public KvController(Kv kv, Hub hub, ObjectMapper om) {
        this.kv = kv;
        this.hub = hub;
        this.om = om;
    }

    private String room(HttpServletRequest req) {
        String room = AuthController.str(AuthController.user(req).get("couple_id"));
        if (room == null || room.isEmpty()) throw new ApiException(403, "请先创建或加入情侣空间");
        return room;
    }

    @GetMapping
    public Map<String, Object> get(HttpServletRequest req, @RequestParam String path) {
        String room = room(req);
        Kv.Row row = kv.get(room, path);
        Map<String, Object> out = new java.util.HashMap<>();
        out.put("ok", true);
        out.put("path", path);
        out.put("value", row == null ? null : row.value());
        out.put("ts", row == null || row.ts() == null ? 0L : row.ts());
        return out;
    }

    @GetMapping("/prefix")
    public Map<String, Object> prefix(HttpServletRequest req, @RequestParam String path) {
        String room = room(req);
        return Map.of("ok", true, "items", kv.prefix(room, path));
    }

    @PostMapping
    public Map<String, Object> write(HttpServletRequest req, @RequestBody Map<String, Object> body) {
        String room = room(req);
        String action = AuthController.str(body.get("action"));
        String path = AuthController.str(body.get("path"));
        if (path == null || path.isEmpty()) throw new ApiException("path 不能为空");
        switch (action == null ? "" : action) {
            case "set" -> {
                JsonNode v = body.containsKey("value") ? om.valueToTree(body.get("value")) : null;
                long ts = kv.set(room, path, v);
                return result(room, path, ts);
            }
            case "update" -> {
                JsonNode p = body.containsKey("partial") ? om.valueToTree(body.get("partial")) : null;
                long ts = kv.update(room, path, p);
                return result(room, path, ts);
            }
            case "push" -> {
                String key = AuthController.str(body.get("key"));
                if (key == null || key.isEmpty()) throw new ApiException("key 不能为空");
                JsonNode v = om.valueToTree(body.get("val"));
                long ts = kv.push(room, path, key, v);
                return result(room, path, ts);
            }
            case "remove" -> {
                kv.remove(room, path);
                return result(room, path, System.currentTimeMillis());
            }
            default -> throw new ApiException("unknown action: " + action);
        }
    }

    /** 写后广播最终落库的值（合并后的结果，与 watch 推送一致） */
    private Map<String, Object> result(String room, String path, long ts) {
        Kv.Row row = kv.get(room, path);
        hub.broadcastKv(room, path, row == null ? null : row.value(), ts);
        return Map.of("ok", true, "ts", ts);
    }
}
