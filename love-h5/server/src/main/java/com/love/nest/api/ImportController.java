package com.love.nest.api;

import com.love.nest.core.ApiException;
import com.love.nest.core.ImportService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** 手动导入入口（也可以直接把 import.json 放进 data/ 目录重启自动导入） */
@RestController
@RequestMapping("/api/admin")
public class ImportController {
    private final ImportService service;

    @Value("${love.jwt-secret}")
    private String adminKey;

    public ImportController(ImportService service) {
        this.service = service;
    }

    @PostMapping("/import")
    public Map<String, Object> importData(@RequestHeader(value = "X-Admin-Key", required = false) String key,
                                          @RequestBody JsonNode body) {
        if (adminKey == null || !adminKey.equals(key)) throw new ApiException(403, "X-Admin-Key 不对");
        return service.importAll(body);
    }
}
