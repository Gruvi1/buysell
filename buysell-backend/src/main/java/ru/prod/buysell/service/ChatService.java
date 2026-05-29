package ru.prod.buysell.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.prod.buysell.dto.DialogResponse;
import ru.prod.buysell.dto.MessageResponse;
import ru.prod.buysell.exception.BusinessException;
import ru.prod.buysell.entity.Dialog;
import ru.prod.buysell.entity.Message;
import ru.prod.buysell.entity.Product;
import ru.prod.buysell.entity.User;
import ru.prod.buysell.repository.DialogRepository;
import ru.prod.buysell.repository.MessageRepository;
import ru.prod.buysell.repository.ProductRepository;
import ru.prod.buysell.repository.UserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final DialogRepository dialogRepository;
    private final MessageRepository messageRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public DialogResponse getOrCreateDialog(Long productId, Long buyerId) {
        log.info("Getting or creating dialog. Product ID: {}, Buyer ID: {}", productId, buyerId);

        Dialog dialog = dialogRepository.findByProductIdAndBuyerId(productId, buyerId)
                .orElseGet(() -> {
                    Product product = productRepository.findById(productId)
                            .orElseThrow(() -> new BusinessException("Товар с ID " + productId + " не найден"));
                    User buyer = userRepository.findById(buyerId)
                            .orElseThrow(() -> new BusinessException("Покупатель с ID " + buyerId + " не найден"));

                    log.info("Creating new dialog for product {} and buyer {}", productId, buyerId);

                    return Dialog.builder()
                            .productId(productId)
                            .buyerId(buyerId)
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();
                });

        Dialog saved = dialogRepository.save(dialog);
        log.info("Dialog found/created with ID: {}", saved.getId());
        return mapToDialogResponse(saved, buyerId);
    }

    @Transactional(readOnly = true)
    public List<DialogResponse> getDialogsForCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assert authentication != null;
        String currentEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new BusinessException("Пользователь не найден"));

        log.info("Loading dialogs for user: {} (ID: {})", currentEmail, currentUser.getId());

        List<Dialog> asBuyer = dialogRepository.findByBuyerIdOrderByUpdatedAtDesc(currentUser.getId());
        List<Dialog> asSeller = dialogRepository.findByProductSellerIdOrderByUpdatedAtDesc(currentUser.getId());

        List<Dialog> allDialogs = new ArrayList<>(asBuyer);
        for (Dialog d : asSeller) {
            if (!allDialogs.contains(d)) {
                allDialogs.add(d);
            }
        }
        allDialogs.sort((d1, d2) -> {
            Instant t1 = d1.getUpdatedAt() != null ? d1.getUpdatedAt() : d1.getCreatedAt();
            Instant t2 = d2.getUpdatedAt() != null ? d2.getUpdatedAt() : d2.getCreatedAt();
            return t2.compareTo(t1);
        });

        log.info("Found {} dialogs for user {}", allDialogs.size(), currentUser.getId());

        List<DialogResponse> responses = new ArrayList<>();
        for (Dialog dialog : allDialogs) {
            responses.add(mapToDialogResponse(dialog, currentUser.getId()));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessageHistory(Long dialogId) {
        log.info("Loading message history for dialog: {}", dialogId);

        Dialog dialog = dialogRepository.findById(dialogId)
                .orElseThrow(() -> new BusinessException("Диалог с ID " + dialogId + " не найден"));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assert authentication != null;
        String currentEmail = authentication.getName();
        User currentUser = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new BusinessException("Пользователь не найден"));

        if (!canAccessDialog(dialog, currentUser)) {
            log.warn("User {} denied access to dialog {}", currentEmail, dialogId);
            throw new BusinessException("Доступ к диалогу запрещён");
        }

        List<Message> messages = messageRepository.findByDialogIdOrderByCreatedAtAsc(dialogId);
        log.info("Loaded {} messages for dialog {}", messages.size(), dialogId);

        return messages.stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse sendMessage(Long dialogId, Long senderId, String content) {
        log.info("Sending message to dialog: {}. Sender ID: {}", dialogId, senderId);

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new BusinessException("Пользователь с ID " + senderId + " не найден"));

        Dialog dialog = dialogRepository.findById(dialogId)
                .orElseThrow(() -> new BusinessException("Диалог с ID " + dialogId + " не найден"));

        if (!canAccessDialog(dialog, sender)) {
            log.warn("User {} denied send access to dialog {}", sender.getEmail(), dialogId);
            throw new BusinessException("Отправка сообщения запрещена");
        }

        if (content == null || content.trim().isEmpty()) {
            throw new BusinessException("Сообщение не может быть пустым");
        }

        Message message = Message.builder()
                .dialogId(dialogId)
                .senderId(senderId)
                .content(content.trim())
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        Message saved = messageRepository.save(message);
        log.info("Message saved with ID: {}", saved.getId());

        // Обновляем updatedAt через конструктор (т.к. нет сеттеров)
        // Порядок полей в @AllArgsConstructor: id, productId, buyerId, createdAt, updatedAt
        Dialog updatedDialog = new Dialog(
                dialog.getId(),
                dialog.getProductId(),
                dialog.getBuyerId(),
                dialog.getCreatedAt(),
                Instant.now()
        );
        dialogRepository.save(updatedDialog);

        return mapToMessageResponse(saved);
    }

    @Transactional
    public void markMessagesAsRead(Long dialogId, Long currentUserId) {
        log.info("Marking messages as read in dialog {} by user {}", dialogId, currentUserId);

        Dialog dialog = dialogRepository.findById(dialogId)
                .orElseThrow(() -> new BusinessException("Диалог с ID " + dialogId + " не найден"));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BusinessException("Пользователь не найден"));

        if (!canAccessDialog(dialog, currentUser)) {
            log.warn("User {} denied read access to dialog {}", currentUserId, dialogId);
            throw new BusinessException("Доступ к диалогу запрещён");
        }

        int updated = messageRepository.markAsRead(dialogId, currentUserId);
        log.info("Marked {} messages as read in dialog {}", updated, dialogId);
    }

    private DialogResponse mapToDialogResponse(Dialog dialog, Long currentUserId) {
        Product product = productRepository.findById(dialog.getProductId())
                .orElseThrow(() -> new BusinessException("Товар не найден"));

        User buyer = userRepository.findById(dialog.getBuyerId())
                .orElseThrow(() -> new BusinessException("Покупатель не найден"));

        long unreadCount = messageRepository.countByDialogIdAndIsReadFalseAndSenderIdNot(
                dialog.getId(), currentUserId);

        return DialogResponse.builder()
                .id(dialog.getId())
                .productId(product.getId())
                .productTitle(product.getTitle())
                .buyerId(buyer.getId())
                .buyerName(buyer.getDisplayName())
                .sellerId(product.getSellerId())
                .sellerName(fetchSellerName(product.getSellerId()))
                .updatedAt(dialog.getUpdatedAt())
                .unreadCount(unreadCount)
                .build();
    }

    private MessageResponse mapToMessageResponse(Message message) {
        User sender = userRepository.findById(message.getSenderId())
                .orElseThrow(() -> new BusinessException("Отправитель не найден"));

        return MessageResponse.builder()
                .id(message.getId())
                .content(message.getContent())
                .senderId(sender.getId())
                .senderName(sender.getDisplayName())
                .isRead(message.isRead())
                .createdAt(message.getCreatedAt())
                .build();
    }

    private String fetchSellerName(Long sellerId) {
        if (sellerId == null) return null;
        return userRepository.findById(sellerId)
                .map(User::getDisplayName)
                .orElse(null);
    }

    private boolean canAccessDialog(Dialog dialog, User user) {
        if (Objects.equals(dialog.getBuyerId(), user.getId())) {
            return true;
        }

        return productRepository.findById(dialog.getProductId())
                .map(Product::getSellerId)
                .map(sellerId -> sellerId.equals(user.getId()))
                .orElse(false);
    }

}
