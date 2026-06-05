package com.movie.backend.controller;

import com.movie.backend.service.TmdbService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class MovieController {

    private final TmdbService tmdbService;

    public MovieController(TmdbService tmdbService) {
        this.tmdbService = tmdbService;
    }

    @GetMapping("/movies/popular")
    public ResponseEntity<Map> getPopularMovies() {
        return ResponseEntity.ok(tmdbService.getPopularMovies());
    }

    @GetMapping("/series/popular")
    public ResponseEntity<Map> getPopularSeries() {
        return ResponseEntity.ok(tmdbService.getPopularSeries());
    }

    @GetMapping("/search")
    public ResponseEntity<Map> search(@RequestParam String query) {
        return ResponseEntity.ok(tmdbService.search(query));
    }

    @GetMapping("/movies/{id}")
    public ResponseEntity<Map> getMovieDetails(@PathVariable Long id) {
        return ResponseEntity.ok(tmdbService.getMovieDetails(id));
    }

    @GetMapping("/series/{id}")
    public ResponseEntity<Map> getSeriesDetails(@PathVariable Long id) {
        return ResponseEntity.ok(tmdbService.getSeriesDetails(id));
    }

    @GetMapping("/movies/{id}/credits")
    public ResponseEntity<Map> getMovieCredits(@PathVariable Long id) {
        return ResponseEntity.ok(tmdbService.getMovieCredits(id));
    }

    @GetMapping("/series/{id}/credits")
    public ResponseEntity<Map> getSeriesCredits(@PathVariable Long id) {
        return ResponseEntity.ok(tmdbService.getSeriesCredits(id));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}