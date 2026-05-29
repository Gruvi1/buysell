package ru.prod.buysell.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "message")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "dialog_id")
    private long dialogId;

    @Column(name = "sender_id")
    private long senderId;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "content")
    private String content;

    @Column(name = "is_read")
    private boolean isRead;
}
