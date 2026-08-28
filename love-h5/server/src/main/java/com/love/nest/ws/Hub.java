package com.love.nest.ws;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WS 会话中枢：连接即在线（presence），kv 写操作按订阅前缀广播给空间内成员。
 * 订阅匹配规则与原 store.js 一致：a===b || a 前缀于 b || b 前缀于 a（按 / 分层）。
 */
@Component
public class Hub {
    private final ObjectMapper om;

    public Hub(ObjectMapper om) { this.om = om; }

    public static class Client {
        public final WebSocketSession session;
        public final long uid;
        public final String role;
        public final String coupleId;
        public final Set<String> subs = ConcurrentHashMap.newKeySet();

        Client(WebSocketSession s, long uid, String role, String coupleId) {
            this.session = s;
            this.uid = uid;
            this.role = role;
            this.coupleId = coupleId;
        }
    }

    /** coupleId -> 在线客户端 */
    private final Map<String, Set<Client>> rooms = new ConcurrentHashMap<>();

    public void join(Client c) {
        if (c.coupleId == null) return;
        rooms.computeIfAbsent(c.coupleId, k -> ConcurrentHashMap.newKeySet()).add(c);
        broadcastPresence(c.coupleId, c.role, true);
    }

    public void leave(Client c) {
        if (c.coupleId == null) return;
        Set<Client> set = rooms.get(c.coupleId);
        if (set == null) return;
        set.remove(c);
        if (set.isEmpty()) rooms.remove(c.coupleId, set);
        broadcastPresence(c.coupleId, c.role, false);
    }

    /** 某空间某角色当前是否在线（REST 快照用） */
    public boolean isOnline(String coupleId, String role) {
        Set<Client> set = rooms.get(coupleId);
        if (set == null) return false;
        return set.stream().anyMatch(c -> role.equals(c.role) && c.session.isOpen());
    }

    public void broadcastKv(String room, String path, JsonNode value, long ts) {
        Set<Client> set = rooms.get(room);
        if (set == null || set.isEmpty()) return;
        for (Client c : set) {
            boolean hit = c.subs.isEmpty() // 未声明订阅的客户端视为只关心 presence，不推 kv
                    ? false
                    : c.subs.stream().anyMatch(s -> related(s, path));
            if (!hit) continue;
            ObjectNode msg = om.createObjectNode();
            msg.put("event", "kv").put("path", path).put("ts", ts);
            msg.set("value", value);
            send(c, msg);
        }
    }

    public void broadcastPresence(String room, String role, boolean online) {
        Set<Client> set = rooms.get(room);
        if (set == null || set.isEmpty()) return;
        for (Client c : set) {
            ObjectNode msg = om.createObjectNode();
            msg.put("event", "presence").put("role", role).put("online", online);
            send(c, msg);
        }
    }

    /** 前缀相交判定（与 store.js emit 规则一致） */
    static boolean related(String a, String b) {
        return a.equals(b) || a.startsWith(b + "/") || b.startsWith(a + "/");
    }

    void send(Client c, ObjectNode msg) {
        try {
            if (c.session.isOpen()) c.session.sendMessage(new TextMessage(msg.toString()));
        } catch (IOException e) {
            // 发送失败即视为掉线，容器会触发 afterConnectionClosed 走 leave
        }
    }

    void sendPong(Client c) {
        ObjectNode msg = om.createObjectNode();
        msg.put("event", "pong");
        send(c, msg);
    }
}
