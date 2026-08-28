package com.love.nest.ws;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.nio.charset.StandardCharsets;

/** WS 消息处理：客户端 {op:'sub'|'unsub'|'ping'}，服务端 {event:'kv'|'presence'|'pong'} */
@Component
public class Handler extends TextWebSocketHandler {
    private final Hub hub;
    private final ObjectMapper om;

    public Handler(Hub hub, ObjectMapper om) {
        this.hub = hub;
        this.om = om;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        hub.join(client(session));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        Hub.Client c = client(session);
        try {
            JsonNode n = om.readTree(message.getPayload());
            String op = n.path("op").asText("");
            switch (op) {
                case "sub" -> c.subs.add(n.path("path").asText());
                case "unsub" -> c.subs.remove(n.path("path").asText());
                case "ping" -> hub.sendPong(c);
                default -> {}
            }
        } catch (Exception ignore) {
            // 忽略无法解析的消息
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        hub.leave(client(session));
    }

    private Hub.Client client(WebSocketSession session) {
        Hub.Client c = (Hub.Client) session.getAttributes().get("client");
        if (c == null) {
            Object uid = session.getAttributes().get("uid");
            Object role = session.getAttributes().get("role");
            Object coupleId = session.getAttributes().get("coupleId");
            // 并发写保护：presence 广播与连接建立可能撞车，装饰器内部串行化发送
            WebSocketSession safe = new org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator(
                    session, 5000, 512 * 1024);
            c = new Hub.Client(safe, uid instanceof Long u ? u : -1,
                    role == null ? null : role.toString(),
                    coupleId == null ? null : coupleId.toString());
            session.getAttributes().put("client", c);
        }
        return c;
    }
}
