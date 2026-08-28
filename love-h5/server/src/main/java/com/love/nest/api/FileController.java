package com.love.nest.api;

import com.love.nest.core.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** 文件上传：存本地磁盘 ./data/files，返回 /files/... 静态 URL */
@RestController
public class FileController {
    private static final Set<String> EXT_OK = Set.of(
            "jpg", "jpeg", "png", "gif", "webp", "mp3", "m4a", "aac", "wav", "mp4",
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt");

    @Value("${love.files-dir}")
    private String filesDir;

    @PostMapping("/api/files")
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) throw new ApiException("文件为空");
        String name = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        int dot = name.lastIndexOf('.');
        String ext = dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
        if (!EXT_OK.contains(ext)) throw new ApiException("不支持的文件类型: " + ext);

        String month = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        Path dir = Paths.get(filesDir, month).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        String fname = UUID.randomUUID().toString().replace("-", "") + "." + ext;
        file.transferTo(dir.resolve(fname).toFile());
        return Map.of("ok", true, "url", "/files/" + month + "/" + fname);
    }
}
