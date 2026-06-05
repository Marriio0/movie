package com.movie.backend.service;

import com.movie.backend.model.Movie;
import com.movie.backend.model.User;
import com.movie.backend.repository.MovieRepository;
import com.movie.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class WatchlistService {

    private final UserRepository userRepository;
    private final MovieRepository movieRepository;

    public WatchlistService(UserRepository userRepository,
                            MovieRepository movieRepository) {
        this.userRepository = userRepository;
        this.movieRepository = movieRepository;
    }

    public void addToWatched(String userId, Long tmdbId, String title, String posterPath) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        boolean alreadyWatched = user.getWatchedMovies().stream()
            .anyMatch(m -> m.getTmdbId().equals(tmdbId));
        if (alreadyWatched) return;

        Movie movie = movieRepository.findByTmdbId(tmdbId)
            .orElseGet(() -> {
                Movie newMovie = new Movie();
                newMovie.setTmdbId(tmdbId);
                newMovie.setTitle(title);
                newMovie.setPosterPath(posterPath);
                return movieRepository.save(newMovie);
            });

        user.getWatchedMovies().add(movie);
        userRepository.save(user);
    }

    public void removeFromWatched(String userId, Long tmdbId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        user.getWatchedMovies().removeIf(m -> m.getTmdbId().equals(tmdbId));
        userRepository.save(user);
    }

    public void addToLiked(String userId, Long tmdbId, String title, String posterPath) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        boolean alreadyLiked = user.getLikedMovies().stream()
            .anyMatch(m -> m.getTmdbId().equals(tmdbId));
        if (alreadyLiked) return;

        Movie movie = movieRepository.findByTmdbId(tmdbId)
            .orElseGet(() -> {
                Movie newMovie = new Movie();
                newMovie.setTmdbId(tmdbId);
                newMovie.setTitle(title);
                newMovie.setPosterPath(posterPath);
                return movieRepository.save(newMovie);
            });

        user.getLikedMovies().add(movie);
        userRepository.save(user);
    }

    public void removeFromLiked(String userId, Long tmdbId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        user.getLikedMovies().removeIf(m -> m.getTmdbId().equals(tmdbId));
        userRepository.save(user);
    }

    public User getWatchlist(String userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}