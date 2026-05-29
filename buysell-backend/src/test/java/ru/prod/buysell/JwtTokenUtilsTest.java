package ru.prod.buysell;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;
import ru.prod.buysell.security.JwtTokenUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@ExtendWith(MockitoExtension.class)
class JwtTokenUtilsTest {

    private JwtTokenUtils jwtTokenUtils;

    @BeforeEach
    void setUp() {
        jwtTokenUtils = new JwtTokenUtils();
        ReflectionTestUtils.setField(jwtTokenUtils, "secret", "98455581-6785-4ae6-be76-70a6601f52a2");
        ReflectionTestUtils.setField(jwtTokenUtils, "jwtLifetime", 3600000L);
    }

    @Test
    void generateToken_ShouldReturnValidJwt() {
        UserDetails userDetails = new User("test@mail.com", "password",
                List.of(new SimpleGrantedAuthority("ROLE_USER")));

        String token = jwtTokenUtils.generateToken(userDetails);

        assertNotNull(token, "Токен не должен быть null");
        assertEquals("test@mail.com", jwtTokenUtils.getUsername(token),
                "Username из токена должен совпадать с email пользователя");
    }
}