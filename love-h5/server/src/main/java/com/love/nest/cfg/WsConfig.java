package com.love.nest.cfg;

import com.love.nest.core.Jwt;
import com.love.nest.repo.Users;
import com.love.nest.ws.Handler;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Configuration
@EnableWebSocket
public class WsConfig implements WebSocketConfigurer {
    private final Handler handler;
    private final Jwt jwt;
    private final Users users;

    public WsConfig(Handler handler, Jwt jwt, Users users) {
        this.handler = handler;
        this.jwt = jwt;
        this.users = users;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(new HandshakeInterceptor() {
                    @Override
                    public boolean beforeHandshake(ServerHttpRequest req, ServerHttpResponse resp,
                                                   WebSocketHandler wsHandler, Map<String, Object> attrs) {
                        String query = req instanceof ServletServerHttpRequest s
                                ? s.getServletRequest().getQueryString() : null;
                        String token = null;
                        if (query != null) {
                            for (String kv : query.split("&")) {
                                if (kv.startsWith("token=")) {
                                    token = kv.substring(6);
                                    break;
                                }
                            }
                        }
                        long uid = token == null ? -1 : jwt.verify(token);
                        if (uid <= 0) return false; // 未登录拒绝握手
                        var user = users.findById(uid);
                        if (user == null) return false;
                        attrs.put("uid", uid);
                        attrs.put("role", user.get("role"));
                        attrs.put("coupleId", user.get("couple_id")); // 可为 null（未配对也能连，收不到推送）
                        return true;
                    }

                    @Override
                    public void afterHandshake(ServerHttpRequest req, ServerHttpResponse resp,
                                               WebSocketHandler wsHandler, Exception ex) {}
                });
    }
}
