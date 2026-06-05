package com.movie.backend.controller;

import com.movie.backend.model.User;
import com.movie.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getProfile(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        User user = userService.getOrCreateUser(jwt);
        return ResponseEntity.ok(user);
    }
}