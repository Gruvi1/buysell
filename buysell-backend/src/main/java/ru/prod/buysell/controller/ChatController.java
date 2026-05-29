package ru.prod.buysell.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import ru.prod.buysell.dto.DialogResponse;
import ru.prod.buysell.dto.MessageRequest;
import ru.prod.buysell.dto.MessageResponse;
import ru.prod.buysell.entity.User;
import ru.prod.buysell.exception.BusinessException;
import ru.prod.buysell.repository.UserRepository;
import ru.prod.buysell.service.ChatService;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping(Path.CHAT)
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final ChatService chatService;
    private final UserRepository userRepository;

    @PostMapping(Path.DIALOGS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getOrCreateDialog(@RequestParam Long productId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentEmail = authentication.getName();
            Optional<User> currentUser = userRepository.findByEmail(currentEmail);

            if (currentUser.isEmpty()) {
                return ResponseEntity.badRequest().body("Пользователь не найден");
            }

            DialogResponse response = chatService.getOrCreateDialog(productId, currentUser.get().getId());
            return ResponseEntity.ok(response);
        } catch (BusinessException e) {
            log.error("Business error creating dialog: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error creating dialog for product {}", productId, e);
            return ResponseEntity.badRequest().body("Ошибка при создании диалога");
        }
    }

    @GetMapping(Path.DIALOGS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<DialogResponse>> getUserDialogs() {
        try {
            List<DialogResponse> dialogs = chatService.getDialogsForCurrentUser();
            return ResponseEntity.ok(dialogs);
        } catch (Exception e) {
            log.error("Error loading dialogs", e);
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping(Path.MESSAGES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMessages(@PathVariable Long dialogId) {
        try {
            List<MessageResponse> messages = chatService.getMessageHistory(dialogId);

            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String currentEmail = authentication.getName();
            Optional<User> currentUser = userRepository.findByEmail(currentEmail);

            currentUser.ifPresent(user -> chatService.markMessagesAsRead(dialogId, user.getId()));

            return ResponseEntity.ok(messages);
        } catch (BusinessException e) {
            log.error("Business error loading messages: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error loading messages for dialog {}", dialogId, e);
            return ResponseEntity.badRequest().body("Ошибка при загрузке сообщений");
        }
    }

    @PostMapping(Path.MESSAGES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable Long dialogId,
            @Valid @RequestBody MessageRequest request) {

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User sender = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new BusinessException("Пользователь не найден"));

        MessageResponse response = chatService.sendMessage(dialogId, sender.getId(), request.getContent());
        return ResponseEntity.ok(response);
    }
}