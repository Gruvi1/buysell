package ru.prod.buysell.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.prod.buysell.dto.UserResponse;
import ru.prod.buysell.dto.UserUpdateRequest;
import ru.prod.buysell.entity.AvatarImage;
import ru.prod.buysell.entity.User;
import ru.prod.buysell.exception.BusinessException;
import ru.prod.buysell.mapper.UserMapper;
import ru.prod.buysell.service.AvatarImageService;
import ru.prod.buysell.service.UserService;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final AvatarImageService avatarImageService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> getCurrentUser() {
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    @GetMapping("/avatar/{id}")
    public ResponseEntity<Resource> getAvatar(@PathVariable Long id) {
        AvatarImage avatar = avatarImageService.getById(id);
        Path filePath = Paths.get(uploadDir, avatar.getFilePath()).normalize();

        if (!filePath.startsWith(Paths.get(uploadDir).normalize())) {
            log.warn("Path traversal attempt detected: {}", avatar.getFilePath());
            throw new BusinessException("Доступ запрещен");
        }

        if (!Files.exists(filePath)) {
            log.error("Avatar file not found on disk: {}", filePath);
            throw new BusinessException("Файл не найден на сервере");
        }

        String encodedFileName = URLEncoder.encode(
                avatar.getFileName() != null ? avatar.getFileName() : "avatar",
                StandardCharsets.UTF_8
        ).replace("+", "%20");

        try {
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + encodedFileName)
                    .contentType(MediaType.parseMediaType(Files.probeContentType(filePath)))
                    .contentLength(Files.size(filePath))
                    .body(new FileSystemResource(filePath));
        } catch (IOException e) {
            log.error("Error reading avatar file: {}", filePath, e);
            throw new BusinessException("Ошибка при чтении файла");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(userMapper.toResponseList(users));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.softDeleteUser(id);
        return ResponseEntity.noContent().build();
    }

//    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
//    @PreAuthorize("isAuthenticated()")
//    public ResponseEntity<?> updateUserJson(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request) {
//        userService.updateUser(id, request);
//        return ResponseEntity.ok("Пользователь обновлён");
//    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateUserMultipart(@PathVariable Long id, @Valid @ModelAttribute UserUpdateRequest request) {
        userService.updateUser(id, request);
        return ResponseEntity.ok("Пользователь обновлён");
    }

    @PutMapping(value = "/me", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> updateCurrentUserJson(@Valid @RequestBody UserUpdateRequest request) {
        userService.updateCurrentUser(request);
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    @PutMapping(value = "/me", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserResponse> updateCurrentUserMultipart(@Valid @ModelAttribute UserUpdateRequest request) {
        userService.updateCurrentUser(request);
        User user = userService.getCurrentUser();
        return ResponseEntity.ok(userMapper.toResponse(user));
    }
}
