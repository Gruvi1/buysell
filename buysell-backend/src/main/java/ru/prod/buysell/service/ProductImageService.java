package ru.prod.buysell.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.prod.buysell.entity.ProductImage;
import ru.prod.buysell.exception.BusinessException;
import ru.prod.buysell.repository.ProductImageRepository;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductImageService {
    private final ProductImageRepository productImageRepository;
    private final FileStorageService fileStorageService;

    public List<ProductImage> saveAll(List<MultipartFile> files, Long productId, int mainIndex) {
        try {
            List<ProductImage> savedFiles = fileStorageService.saveProductImages(files, productId, mainIndex);
            return productImageRepository.saveAll(savedFiles);
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public List<ProductImage> getByProductId(Long productId) {
        return productImageRepository.findByProductId(productId);
    }

    @Transactional
    public List<ProductImage> replaceAll(List<MultipartFile> files, Long productId, Integer mainIndex) {
        productImageRepository.deleteByProductId(productId);
        return saveAll(files, productId, mainIndex != null ? mainIndex : 0);
    }

    public ProductImage getById(Long id) {
        return productImageRepository.findById(id).orElseThrow(
                () -> new BusinessException("Изображение не найдено")
        );
    }
}
