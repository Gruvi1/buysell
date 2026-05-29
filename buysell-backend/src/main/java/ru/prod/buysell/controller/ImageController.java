package ru.prod.buysell.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.prod.buysell.entity.ProductImage;
import ru.prod.buysell.exception.BusinessException;
import ru.prod.buysell.service.ProductImageService;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping(ru.prod.buysell.controller.Path.IMAGE)
@RequiredArgsConstructor
@Slf4j
public class ImageController {

    private final ProductImageService productImageService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @GetMapping(ru.prod.buysell.controller.Path.IMAGE_DETAILS)
    public ResponseEntity<Resource> getImage(@PathVariable Long id) {
        ProductImage image = productImageService.getById(id);

        Path filePath = Paths.get(uploadDir, image.getFilePath()).normalize();

        if (!filePath.startsWith(Paths.get(uploadDir).normalize())) {
            log.warn("Path traversal attempt detected: {}", image.getFilePath());
            throw new BusinessException("Доступ запрещен");
        }

        if (!Files.exists(filePath)) {
            log.error("File not found on disk: {}", filePath);
            throw new BusinessException("Файл не найден на сервере");
        }

        String encodedFileName = URLEncoder.encode(
                image.getFileName() != null ? image.getFileName() : "image",
                StandardCharsets.UTF_8
        ).replace("+", "%20");

        try {
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encodedFileName)
                    .contentType(MediaType.parseMediaType(Files.probeContentType(filePath)))
                    .contentLength(Files.size(filePath))
                    .body(new FileSystemResource(filePath));
        } catch (IOException e) {
            log.error("Error reading file: {}", filePath, e);
            throw new BusinessException("Ошибка при чтении файла");
        }
    }
}