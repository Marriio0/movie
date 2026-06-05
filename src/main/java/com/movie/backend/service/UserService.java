package com.movie.backend.service;

import com.movie.backend.model.User;
import com.movie.backend.repository.UserRepository;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getOrCreateUser(Jwt jwt) {
        String userId = jwt.getSubject();
        String email = jwt.getClaimAsString("email") != null ? jwt.getClaimAsString("email") : "";
        String preferredUsername = jwt.getClaimAsString("preferred_username");
        String givenName = jwt.getClaimAsString("given_name");

        String username;
        if (preferredUsername != null && !preferredUsername.isEmpty()) {
            username = preferredUsername;
        } else if (givenName != null && !givenName.isEmpty()) {
            username = givenName;
        } else {
            username = "User-" + userId.substring(0, 8);
        }

        final String finalUsername = username;
        final String finalEmail = email;

        return userRepository.findById(userId)
            .map(existingUser -> {
                // Update email/username if they changed
                existingUser.setEmail(finalEmail);
                existingUser.setUsername(finalUsername);
                return userRepository.save(existingUser);
            })
            .orElseGet(() -> {
                User newUser = new User();
                newUser.setId(userId);
                newUser.setEmail(finalEmail);
                newUser.setUsername(finalUsername);
                return userRepository.save(newUser);
            });
    }

    public User getUserById(String userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}