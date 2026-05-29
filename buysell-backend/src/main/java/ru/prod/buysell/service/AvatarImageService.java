package ru.prod.buysell.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.prod.buysell.entity.AvatarImage;
import ru.prod.buysell.exception.BusinessException;
import ru.prod.buysell.repository.AvatarImageRepository;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class AvatarImageService {
    private final AvatarImageRepository avatarImageRepository;
    private final FileStorageService fileStorageService;

    public AvatarImage save(MultipartFile file) {
        try {
            AvatarImage savedFile = fileStorageService.saveAvatarImage(file);
            return avatarImageRepository.save(savedFile);
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public AvatarImage getById(Long id) {
        return avatarImageRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Аватар не найден"));
    }
}
