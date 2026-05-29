package ru.prod.buysell.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.prod.buysell.dto.UserRegistrationRequest;
import ru.prod.buysell.dto.UserUpdateRequest;
import ru.prod.buysell.entity.AvatarImage;
import ru.prod.buysell.entity.User;
import ru.prod.buysell.entity.UserDetailsImpl;
import ru.prod.buysell.entity.UserRole;
import ru.prod.buysell.exception.BusinessException;
import ru.prod.buysell.mapper.UserMapper;
import ru.prod.buysell.repository.UserRepository;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final AvatarImageService avatarImageService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Transactional
    public User createUser(UserRegistrationRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BusinessException("Пользователь с email " + request.getEmail() + " уже существует");
        }

        User user = userMapper.toEntity(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(Instant.now());

        User saved = userRepository.save(user);
        log.info("User created successfully. Email: {}, ID: {}", request.getEmail(), saved.getId());
        return saved;
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Пользователь с ID " + id + " не найден"));
    }

    public User getCurrentUser() {
        return getUserById(getCurrentUserId());
    }

    public List<User> getAllUsers() {
        // TODO: добавить пагинацию
        return userRepository.findAll();
    }

    @Transactional
    public void softDeleteUser(Long id) {
        Long currentUserId = getCurrentUserId();
        boolean isAdmin = isAdmin();

        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Пользователь с ID " + id + " не найден"));

        if (!isAdmin && !userToDelete.getId().equals(currentUserId)) {
            throw new AccessDeniedException("У вас нет прав на удаление этого пользователя");
        }

        userRepository.softDeleteById(id);
        log.info("User {} soft-deleted by user {}", id, currentUserId);
    }

    @Transactional
    public void updateUser(Long id, UserUpdateRequest request) {
        Long currentUserId = getCurrentUserId();
        boolean isAdmin = isAdmin();

        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Пользователь с ID " + id + " не найден"));

        if (!user.getId().equals(currentUserId) && !isAdmin) {
            throw new AccessDeniedException("У вас нет прав на редактирование этого профиля");
        }

        if (request.getDisplayName() != null) {
            user.setDisplayName(request.getDisplayName());
        }

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(request.getPhoneNumber());
        }

        if (request.getAvatar() != null) {
            AvatarImage avatar = avatarImageService.save(request.getAvatar());
            user.setAvatarId(avatar.getId());
        }

        userRepository.save(user);
        log.info("User updated. ID: {}", id);
    }

    @Transactional
    public void updateCurrentUser(UserUpdateRequest request) {
        updateUser(getCurrentUserId(), request);
    }

    private Long getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserDetailsImpl)) {
            throw new BusinessException("Пользователь не аутентифицирован");
        }
        return ((UserDetailsImpl) auth.getPrincipal()).getId();
    }

    private boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(r -> Objects.equals(r.getAuthority(), UserRole.ADMIN.getValue()));
    }
}
