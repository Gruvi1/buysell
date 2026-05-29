package ru.prod.buysell.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class MessageRequest {

    public static final int MAX_CONTENT_LENGTH = 1000;

    @NotBlank(message = "Сообщение не может быть пустым")
    @Size(max = MAX_CONTENT_LENGTH, message = "Сообщение не должно превышать " + MAX_CONTENT_LENGTH + " символов")
    private String content;
}