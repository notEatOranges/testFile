package com.love.nest.repo;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class Users {
    private final JdbcTemplate jdbc;

    public Users(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Map<String, Object> findById(long id) {
        try {
            return jdbc.queryForMap("SELECT * FROM users WHERE id=?", id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public Map<String, Object> findByUsername(String username) {
        try {
            return jdbc.queryForMap("SELECT * FROM users WHERE username=?", username);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public long create(String username, String hash, String role, String nick, String avatar) {
        long now = System.currentTimeMillis();
        jdbc.update("INSERT INTO users(username,password_hash,role,nick,avatar,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",
                username, hash, role, nick == null ? "" : nick, avatar == null ? "" : avatar, now, now);
        return jdbc.queryForObject("SELECT last_insert_rowid()", Long.class);
    }

    public void updateProfile(long id, String nick, String avatar) {
        jdbc.update("UPDATE users SET nick=?, avatar=?, updated_at=? WHERE id=?",
                nick == null ? "" : nick, avatar == null ? "" : avatar, System.currentTimeMillis(), id);
    }

    public void setPassword(long id, String hash) {
        jdbc.update("UPDATE users SET password_hash=?, updated_at=? WHERE id=?", hash, System.currentTimeMillis(), id);
    }

    public void bindCouple(long id, String coupleId) {
        jdbc.update("UPDATE users SET couple_id=?, updated_at=? WHERE id=?", coupleId, System.currentTimeMillis(), id);
    }

    public List<Map<String, Object>> membersOf(String coupleId) {
        return jdbc.queryForList(
                "SELECT id, username, role, nick, avatar FROM users WHERE couple_id=? ORDER BY id", coupleId);
    }

    /** 该空间的某个角色槽是否已被占 */
    public boolean roleTaken(String coupleId, String role) {
        Integer n = jdbc.queryForObject(
                "SELECT COUNT(*) FROM users WHERE couple_id=? AND role=?", Integer.class, coupleId, role);
        return n != null && n > 0;
    }
}
