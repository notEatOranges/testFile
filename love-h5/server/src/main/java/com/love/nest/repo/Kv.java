package com.love.nest.repo;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * kv 实时数据层 —— 1:1 复刻微信云开发 kvWrite 云函数语义：
 * set=整路径覆盖 / update=顶层浅合并(null=置空) / push=塞一条{key:val} / remove=删行
 * 每次写 ts=服务器当前毫秒。行结构 (room, path, value JSON, ts)，唯一键 (room,path)。
 */
@Repository
public class Kv {
    private final JdbcTemplate jdbc;
    private final ObjectMapper om;

    public Kv(JdbcTemplate jdbc, ObjectMapper om) {
        this.jdbc = jdbc;
        this.om = om;
    }

    public record Row(String room, String path, JsonNode value, Long ts) {}

    private static final String UPSERT =
            "INSERT INTO kv(room,path,value,ts) VALUES(?,?,?,?) " +
            "ON CONFLICT(room,path) DO UPDATE SET value=excluded.value, ts=excluded.ts";

    public Row get(String room, String path) {
        try {
            return jdbc.queryForObject(
                    "SELECT room,path,value,ts FROM kv WHERE room=? AND path=?",
                    (rs, i) -> new Row(rs.getString(1), rs.getString(2), parse(rs.getString(3)),
                            rs.getObject(4, Long.class)),
                    room, path);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    /** set：整路径覆盖（value 可为 null，表示"清空但保留行"） */
    public long set(String room, String path, JsonNode value) {
        long ts = System.currentTimeMillis();
        jdbc.update(UPSERT, room, path, toJson(value), ts);
        return ts;
    }

    /** update：value 顶层键浅合并；partial=null 表示整路径置 null */
    public long update(String room, String path, JsonNode partial) {
        Row cur = get(room, path);
        long ts = System.currentTimeMillis();
        if (partial == null || partial.isNull()) {
            jdbc.update(UPSERT, room, path, null, ts);
            return ts;
        }
        ObjectNode base;
        if (cur != null && cur.value() != null && cur.value().isObject()) {
            base = (ObjectNode) cur.value();
        } else {
            base = om.createObjectNode();
        }
        partial.fields().forEachRemaining(e -> base.set(e.getKey(), e.getValue()));
        jdbc.update(UPSERT, room, path, base.toString(), ts);
        return ts;
    }

    /** push：往 value 对象里塞 {key: val} */
    public long push(String room, String path, String key, JsonNode val) {
        Row cur = get(room, path);
        ObjectNode base;
        if (cur != null && cur.value() != null && cur.value().isObject()) {
            base = (ObjectNode) cur.value();
        } else {
            base = om.createObjectNode();
        }
        base.set(key, val);
        long ts = System.currentTimeMillis();
        jdbc.update(UPSERT, room, path, base.toString(), ts);
        return ts;
    }

    /** remove：删整行 */
    public void remove(String room, String path) {
        jdbc.update("DELETE FROM kv WHERE room=? AND path=?", room, path);
    }

    /** 导入专用：保留迁移数据原始 ts（value 为 JSON 字符串原样入库） */
    public void importRow(String room, String path, String valueJson, long ts) {
        jdbc.update(UPSERT, room, path, valueJson, ts);
    }

    /** 前缀批量拉取：返回 {去前缀后缀: value}（心情历史用） */
    public Map<String, JsonNode> prefix(String room, String prefix) {
        Map<String, JsonNode> out = new LinkedHashMap<>();
        jdbc.query("SELECT path,value FROM kv WHERE room=? AND substr(path,1,?)=? ORDER BY path",
                rs -> {
                    out.put(rs.getString(1).substring(prefix.length()), parse(rs.getString(2)));
                }, room, prefix.length(), prefix);
        return out;
    }

    private JsonNode parse(String s) {
        try {
            return s == null ? null : om.readTree(s);
        } catch (Exception e) {
            return null;
        }
    }

    private String toJson(JsonNode n) {
        return n == null ? null : n.toString();
    }
}
