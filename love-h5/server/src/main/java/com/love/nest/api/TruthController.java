package com.love.nest.api;

import org.springframework.core.io.ClassPathResource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

/** 真心话抽题：题库存 resources/truth.json（62 题迁自原云函数），可免发版扩容 */
@RestController
@RequestMapping("/api/truth")
public class TruthController {
    private final Map<String, List<String>> bank;

    @SuppressWarnings("unchecked")
    public TruthController(com.fasterxml.jackson.databind.ObjectMapper om) throws Exception {
        bank = om.readValue(new ClassPathResource("truth.json").getInputStream(), Map.class);
    }

    @GetMapping("/draw")
    public Map<String, Object> draw(@RequestParam(required = false) String category,
                                    @RequestParam(defaultValue = "1") int count) {
        List<String> pool = new ArrayList<>();
        if (category != null && !category.isEmpty() && !"random".equals(category) && bank.containsKey(category)) {
            pool.addAll(bank.get(category));
        } else {
            bank.values().forEach(pool::addAll);
        }
        Collections.shuffle(pool, ThreadLocalRandom.current());
        List<String> picked = pool.subList(0, Math.min(Math.max(count, 1), pool.size()));
        return Map.of("ok", true, "questions", new ArrayList<>(picked));
    }
}
