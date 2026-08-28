package com.love.nest.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

/** 启动时检测 data/import.json，存在则自动导入一次（成功后改名 .done 不再重复导入） */
@Component
public class ImportRunner {
    private static final Logger log = LoggerFactory.getLogger(ImportRunner.class);

    private final ImportService service;
    private final ObjectMapper om;
    private final String dataDir;

    public ImportRunner(ImportService service, ObjectMapper om,
                        @Value("${love.files-dir:./data/files}") String filesDir) {
        this.service = service;
        this.om = om;
        this.dataDir = Paths.get(filesDir).toAbsolutePath().normalize().getParent().toString();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        try {
            Path in = Paths.get(dataDir, "import.json");
            if (!Files.exists(in)) return;
            log.info("[import] 检测到 import.json，开始导入历史数据…");
            Map<String, Object> res = service.importAll(om.readTree(Files.readString(in)));
            Files.move(in, in.resolveSibling("import.done.json"),
                    java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            log.info("[import] 完成: {}", res);
        } catch (Exception e) {
            log.error("[import] 导入失败: {}", e.getMessage(), e);
        }
    }
}
