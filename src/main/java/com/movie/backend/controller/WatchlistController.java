package com.movie.backend.controller;

import com.movie.backend.model.User;
import com.movie.backend.service.WatchlistService;
import com.movie.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/watchlist")
public class WatchlistController {

    private final WatchlistService watchlistService;
    private final UserService userService;

    public WatchlistController(WatchlistService watchlistService,
                               UserService userService) {
        this.watchlistService = watchlistService;
        this.userService = userService;
    }

    @PostMapping("/watched")
    public ResponseEntity<?> addToWatched(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getSubject();

        Long tmdbId = Long.valueOf(body.get("tmdbId").toString());
        String title = body.get("title").toString();
        String posterPath = body.get("posterPath").toString();

        watchlistService.addToWatched(userId, tmdbId, title, posterPath);
        return ResponseEntity.ok(Map.of("message", "Added to watched!"));
    }

    @DeleteMapping("/watched/{tmdbId}")
    public ResponseEntity<?> removeFromWatched(
            Authentication authentication,
            @PathVariable Long tmdbId) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getSubject();

        watchlistService.removeFromWatched(userId, tmdbId);
        return ResponseEntity.ok(Map.of("message", "Removed from watched!"));
    }

    @PostMapping("/liked")
    public ResponseEntity<?> addToLiked(
            Authentication authentication,
            @RequestBody Map<String, Object> body) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getSubject();

        Long tmdbId = Long.valueOf(body.get("tmdbId").toString());
        String title = body.get("title").toString();
        String posterPath = body.get("posterPath").toString();

        watchlistService.addToLiked(userId, tmdbId, title, posterPath);
        return ResponseEntity.ok(Map.of("message", "Added to liked!"));
    }

    @DeleteMapping("/liked/{tmdbId}")
    public ResponseEntity<?> removeFromLiked(
            Authentication authentication,
            @PathVariable Long tmdbId) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getSubject();

        watchlistService.removeFromLiked(userId, tmdbId);
        return ResponseEntity.ok(Map.of("message", "Removed from liked!"));
    }

    @GetMapping
    public ResponseEntity<User> getWatchlist(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String userId = jwt.getSubject();
        return ResponseEntity.ok(watchlistService.getWatchlist(userId));
    }
}