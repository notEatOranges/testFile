package com.love.nest.repo;

import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Map;

@Repository
public class Couples {
    private final JdbcTemplate jdbc;

    public Couples(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public Map<String, Object> findById(String id) {
        try {
            return jdbc.queryForMap("SELECT * FROM couples WHERE id=?", id);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public Map<String, Object> findByInvite(String code) {
        try {
            return jdbc.queryForMap("SELECT * FROM couples WHERE invite_code=?", code);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    public void create(String id, String inviteCode, long createdBy) {
        jdbc.update("INSERT INTO couples(id,invite_code,created_by,created_at) VALUES(?,?,?,?)",
                id, inviteCode, createdBy, System.currentTimeMillis());
    }
}
