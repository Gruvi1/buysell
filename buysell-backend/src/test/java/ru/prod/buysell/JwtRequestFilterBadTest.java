package ru.prod.buysell;

import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import ru.prod.buysell.security.JwtRequestFilter;
import ru.prod.buysell.security.JwtTokenUtils;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
class JwtRequestFilterBadTest {

    @Mock
    private JwtTokenUtils jwtTokenUtils;
    @Mock
    private UserDetailsService userDetailsService;
    @InjectMocks
    private JwtRequestFilter filter;

    @BeforeEach
    void setUp() {
        jwtTokenUtils = mock(JwtTokenUtils.class);
        userDetailsService = mock(UserDetailsService.class);
        filter = new JwtRequestFilter(jwtTokenUtils, userDetailsService);
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_WithInvalidToken_ShouldNotSetAuthentication() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain filterChain = mock(FilterChain.class);

        String invalidToken = "invalid_or_expired_token";
        when(request.getHeader("Authorization")).thenReturn("Bearer " + invalidToken);

        when(jwtTokenUtils.getUsername(invalidToken)).thenThrow(new ExpiredJwtException(null, null, "Token expired"));

        filter.doFilterInternal(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication(),
                "Контекст должен быть пустым при невалидном токене");

        verify(filterChain, times(1)).doFilter(request, response);
    }
}
