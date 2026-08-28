package com.love.nest.core;

import com.fasterxml.jackson.databind.JsonNode;
import com.love.nest.repo.Kv;
import com.love.nest.repo.Users;
import com.love.nest.ws.Hub;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * 纪念日提醒（替代原 anniversaryReminder 云函数）：每日 9:00 扫描，
 * 命中 advanceDays 就给双方生成站内通知 + WebSocket 实推。
 */
@Component
public class ReminderScheduler {
    private final JdbcTemplate jdbc;
    private final Kv kv;
    private final Users users;
    private final Hub hub;
    private final ObjectMapper om;

    public ReminderScheduler(JdbcTemplate jdbc, Kv kv, Users users, Hub hub, ObjectMapper om) {
        this.jdbc = jdbc;
        this.kv = kv;
        this.users = users;
        this.hub = hub;
        this.om = om;
    }

    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Shanghai")
    public void daily() {
        int pushed = runOnce();
        if (pushed > 0) System.out.println("[anniv] 今日推送 " + pushed + " 条纪念日提醒");
    }

    /** 手动触发入口（管理端验证用） */
    public int runOnce() {
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> couples = jdbc.queryForList("SELECT id FROM couples");
        int pushed = 0;
        for (Map<String, Object> c : couples) {
            String room = String.valueOf(c.get("id"));
            JsonNode events = kvValue(room, "anniversary/events");
            if (events == null || !events.isObject()) continue;
            var fields = events.fields();
            while (fields.hasNext()) {
                var e = fields.next();
                JsonNode ev = e.getValue();
                String date = ev.path("date").asText("");
                if (date.isEmpty()) continue;
                String recurrence = ev.path("recurrence").asText("once");
                LocalDate next = nextOccur(LocalDate.parse(date), recurrence, today);
                long days = ChronoUnit.DAYS.between(today, next);
                int[] advances = advanceDays(ev);
                boolean hit = false;
                for (int a : advances) if (a == days) hit = true;
                if (!hit) continue;
                String label = days == 0 ? "就是今天" : (days == 1 ? "就在明天" : "还有 " + days + " 天");
                String title = ev.path("title").asText("纪念日");
                notify(room, "boy", title, label);
                notify(room, "girl", title, label);
                pushed += 2;
            }
        }
        return pushed;
    }

    private void notify(String room, String role, String title, String label) {
        jdbc.update("INSERT INTO notifications(room,target_role,type,title,body,created_at) VALUES(?,?,?,?,?,?)",
                room, role, "anniv", title, label, System.currentTimeMillis());
        ObjectNode msg = om.createObjectNode();
        msg.put("event", "notify").put("type", "anniv")
                .put("title", "纪念日提醒 · " + title).put("body", label);
        hub.broadcastNotify(room, msg);
    }

    private JsonNode kvValue(String room, String path) {
        Kv.Row row = kv.get(room, path);
        return row == null ? null : row.value();
    }

    private int[] advanceDays(JsonNode ev) {
        JsonNode arr = ev.path("advanceDays");
        if (arr.isArray() && arr.size() > 0) {
            int[] out = new int[arr.size()];
            for (int i = 0; i < arr.size(); i++) out[i] = arr.get(i).asInt();
            return out;
        }
        return new int[]{0, 1};
    }

    /** 与前端 anniv.js 同规则的下次发生日（2-29 兜底 / 月末截断） */
    static LocalDate nextOccur(LocalDate date, String recurrence, LocalDate today) {
        switch (recurrence) {
            case "yearly": {
                LocalDate cand = safe(date.withYear(today.getYear()));
                if (!cand.isBefore(today)) return cand;
                return safe(date.withYear(today.getYear() + 1));
            }
            case "monthly": {
                int day = Math.min(date.getDayOfMonth(), today.lengthOfMonth());
                LocalDate cand = today.withDayOfMonth(day);
                if (!cand.isBefore(today)) return cand;
                LocalDate nextM = today.plusMonths(1).withDayOfMonth(1);
                return nextM.withDayOfMonth(Math.min(date.getDayOfMonth(), nextM.lengthOfMonth()));
            }
            default:
                return date;
        }
    }

    private static LocalDate safe(LocalDate d) {
        // withYear 撞上 2-29 平年会自动落到 2-28（LocalDate 语义），无需额外处理
        return d;
    }
}
