package ru.prod.buysell.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.prod.buysell.dto.LoginRequest;
import ru.prod.buysell.dto.UserRegistrationRequest;
import ru.prod.buysell.dto.UserResponse;
import ru.prod.buysell.entity.User;
import ru.prod.buysell.dto.JwtResponse;
import ru.prod.buysell.mapper.UserMapper;
import ru.prod.buysell.security.JwtTokenUtils;
import ru.prod.buysell.service.UserService;

@RestController
@RequestMapping(Path.AUTH)
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtTokenUtils jwtTokenUtils;
    private final UserMapper userMapper;

    @PostMapping(Path.LOGIN)
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));
        }
        catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Неверный email или пароль");
        }
        UserDetails userDetails = (UserDetails) auth.getPrincipal();
        String token = jwtTokenUtils.generateToken(userDetails);

        return ResponseEntity.ok(new JwtResponse(token));
    }

    @PostMapping(Path.REGISTER)
    public ResponseEntity<UserResponse> register(@Valid @RequestBody UserRegistrationRequest request) {
        User user = userService.createUser(request);
        return ResponseEntity.ok(userMapper.toResponse(user));
    }
}