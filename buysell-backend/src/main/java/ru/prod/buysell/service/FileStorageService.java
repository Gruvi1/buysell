package ru.prod.buysell.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.prod.buysell.entity.AvatarImage;
import ru.prod.buysell.entity.ProductImage;
import ru.prod.buysell.exception.BusinessException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${file.max-size}")
    private long maxFileSize;

    @Value("${file.allowed-types}")
    private List<String> allowedTypes;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Value("${file.product-file-dir}")
    private String productFileDir;

    @Value("${file.avatar-file-dir}")
    private String avatarFileDir;


    public AvatarImage saveAvatarImage(MultipartFile file) throws IOException {
        validateImage(file);
        String filePath = saveFile(file, avatarFileDir);
        return AvatarImage.builder()
                .filePath(filePath)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .build();
    }

    public ProductImage saveProductImage(MultipartFile file, Long productId, boolean isMain) throws IOException {
        validateImage(file);
        String filePath = saveFile(file, productFileDir + "/" + productId);
        return ProductImage.builder()
                .productId(productId)
                .filePath(filePath)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .isMain(isMain)
                .build();
    }

    public List<ProductImage> saveProductImages(List<MultipartFile> files, Long productId, Integer mainIndex) throws IOException {
        if (files == null || files.isEmpty()) {
            return Collections.emptyList();
        }

        List<ProductImage> images = new ArrayList<>();
        int resolvedMainIndex = mainIndex != null ? mainIndex : 0;

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            if (file == null || file.isEmpty()) {
                continue;
            }
            images.add(saveProductImage(file, productId, i == resolvedMainIndex));
        }
        return images;
    }

    private void validateImage(MultipartFile file) {
        if (file.getSize() > maxFileSize) {
            throw new BusinessException("Файл превышает максимальный размер 10 МБ");
        }
        if (!allowedTypes.contains(file.getContentType())) {
            throw new BusinessException("Допустимые форматы: JPEG, PNG, WEBP");
        }
    }

    private String saveFile(MultipartFile file, String directory) throws IOException {
        Path targetDir = Paths.get(uploadDir, directory).toAbsolutePath().normalize();
        Files.createDirectories(targetDir);

        String ext = "";
        String originalName = file.getOriginalFilename();
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf("."));
        }

        String newFileName = UUID.randomUUID() + ext;
        Path targetPath = targetDir.resolve(newFileName);

        if (!targetPath.startsWith(targetDir)) {
            throw new SecurityException("Недопустимый путь к файлу");
        }

        file.transferTo(targetPath.toFile());
        return directory + "/" + newFileName;
    }
}