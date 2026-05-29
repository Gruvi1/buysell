package ru.prod.buysell.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.prod.buysell.entity.Message;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByDialogIdOrderByCreatedAtAsc(Long dialogId);

    long countByDialogIdAndIsReadFalseAndSenderIdNot(Long dialogId, Long senderId);

    @Modifying
    @Query("UPDATE Message m SET m.isRead = true WHERE m.dialogId = :dialogId AND m.senderId != :userId")
    int markAsRead(@Param("dialogId") Long dialogId, @Param("userId") Long userId);
}