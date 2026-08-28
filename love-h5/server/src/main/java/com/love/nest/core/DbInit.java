package com.love.nest.core;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** 启动建表（全部 IF NOT EXISTS，可重复启动） */
@Component
public class DbInit {
    public DbInit(JdbcTemplate jdbc) {
        jdbc.execute("PRAGMA journal_mode=WAL");
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS users(
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE NOT NULL,
                  password_hash TEXT NOT NULL,
                  role TEXT NOT NULL CHECK(role IN ('boy','girl')),
                  nick TEXT DEFAULT '',
                  avatar TEXT DEFAULT '',
                  couple_id TEXT,
                  created_at INTEGER,
                  updated_at INTEGER
                )""");
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS couples(
                  id TEXT PRIMARY KEY,
                  invite_code TEXT UNIQUE NOT NULL,
                  created_by INTEGER,
                  created_at INTEGER
                )""");
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS kv(
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  room TEXT NOT NULL,
                  path TEXT NOT NULL,
                  value TEXT,
                  ts INTEGER,
                  UNIQUE(room, path)
                )""");
        jdbc.execute("CREATE INDEX IF NOT EXISTS idx_kv_room ON kv(room)");
        jdbc.execute("""
                CREATE TABLE IF NOT EXISTS notifications(
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  room TEXT NOT NULL,
                  target_role TEXT NOT NULL,
                  type TEXT NOT NULL,
                  title TEXT,
                  body TEXT,
                  created_at INTEGER,
                  read_at INTEGER
                )""");
    }
}
