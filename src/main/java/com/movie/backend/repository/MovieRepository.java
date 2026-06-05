package com.movie.backend.repository;

import com.movie.backend.model.Movie;
import org.springframework.data.neo4j.repository.Neo4jRepository;

import java.util.Optional;

public interface MovieRepository extends Neo4jRepository<Movie, String>{
    Optional<Movie> findByTmdbId(Long tmdbId);
}