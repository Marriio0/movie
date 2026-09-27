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

    @GetMapping("/trending/today")
    public ResponseEntity<Map> getTrendingToday() {
        return ResponseEntity.ok(tmdbService.getTrendingToday());
    }

    @GetMapping("/trending/movies")
    public ResponseEntity<Map> getTrendingMovies() {
        return ResponseEntity.ok(tmdbService.getTrendingMovies());
    }

    @GetMapping("/trending/series")
    public ResponseEntity<Map> getTrendingSeries() {
        return ResponseEntity.ok(tmdbService.getTrendingSeries());
    }

    @GetMapping("/movies/top-rated")
    public ResponseEntity<Map> getTopRatedMovies() {
        return ResponseEntity.ok(tmdbService.getTopRatedMovies());
    }

    @GetMapping("/series/top-rated")
    public ResponseEntity<Map> getTopRatedSeries() {
        return ResponseEntity.ok(tmdbService.getTopRatedSeries());
    }

    @GetMapping("/movies/now-playing")
    public ResponseEntity<Map> getNowPlayingMovies() {
        return ResponseEntity.ok(tmdbService.getNowPlayingMovies());
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

    @GetMapping("/movies/{id}/videos")
    public ResponseEntity<Map> getMovieVideos(@PathVariable Long id) {
        return ResponseEntity.ok(tmdbService.getMovieVideos(id));
    }

    @GetMapping("/series/{id}/videos")
    public ResponseEntity<Map> getSeriesVideos(@PathVariable Long id) {
        return ResponseEntity.ok(tmdbService.getSeriesVideos(id));
    }

    @GetMapping("/movies/{id}/watch-providers")
    public ResponseEntity<Map> getMovieWatchProviders(@PathVariable Long id) {
        return ResponseEntity.ok(tmdbService.getMovieWatchProviders(id));
    }

    @GetMapping("/series/{id}/watch-providers")
    public ResponseEntity<Map> getSeriesWatchProviders(@PathVariable Long id) {
        return ResponseEntity.ok(tmdbService.getSeriesWatchProviders(id));
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}