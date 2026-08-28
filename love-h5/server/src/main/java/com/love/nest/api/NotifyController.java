package com.love.nest.api;

import com.love.nest.core.ApiException;
import com.love.nest.core.ReminderScheduler;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** 站内通知：列表 / 全部已读 / 管理端手动触发纪念日扫描 */
@RestController
@RequestMapping("/api")
public class NotifyController {
    private final JdbcTemplate jdbc;
    private final ReminderScheduler scheduler;

    @Value("${love.jwt-secret}")
    private String adminKey;

    public NotifyController(JdbcTemplate jdbc, ReminderScheduler scheduler) {
        this.jdbc = jdbc;
        this.scheduler = scheduler;
    }

    @GetMapping("/notifications")
    public Map<String, Object> list(HttpServletRequest req) {
        Map<String, Object> u = AuthController.user(req);
        String room = String.valueOf(u.get("couple_id"));
        String role = String.valueOf(u.get("role"));
        List<Map<String, Object>> items = jdbc.queryForList(
                "SELECT id,type,title,body,created_at,read_at FROM notifications WHERE room=? AND target_role=? ORDER BY created_at DESC LIMIT 50",
                room, role);
        Integer unread = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE room=? AND target_role=? AND read_at IS NULL",
                Integer.class, room, role);
        return Map.of("ok", true, "items", items, "unread", unread == null ? 0 : unread);
    }

    @PutMapping("/notifications/read")
    public Map<String, Object> readAll(HttpServletRequest req) {
        Map<String, Object> u = AuthController.user(req);
        jdbc.update("UPDATE notifications SET read_at=? WHERE room=? AND target_role=? AND read_at IS NULL",
                System.currentTimeMillis(), String.valueOf(u.get("couple_id")), String.valueOf(u.get("role")));
        return Map.of("ok", true);
    }

    @PostMapping("/admin/remind-run")
    public Map<String, Object> remindRun(@RequestHeader(value = "X-Admin-Key", required = false) String key) {
        if (adminKey == null || !adminKey.equals(key)) throw new ApiException(403, "X-Admin-Key 不对");
        return Map.of("ok", true, "pushed", scheduler.runOnce());
    }
}
