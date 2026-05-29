package ru.prod.buysell.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class UserResponse {
    private Long id;
    private String imagePath;
    private Instant createdAt;
    private String email;
    private String displayName;
    private String phoneNumber;
}