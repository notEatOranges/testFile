package com.love.nest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
@EnableScheduling
public class LoveNestApplication {
    public static void main(String[] args) throws Exception {
        // SQLite 数据库和上传文件都放 ./data 下，目录必须先建好
        java.nio.file.Files.createDirectories(java.nio.file.Paths.get("./data/files"));
        SpringApplication.run(LoveNestApplication.class, args);
    }

    @Bean
    BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
