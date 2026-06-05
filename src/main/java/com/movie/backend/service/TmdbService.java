package com.movie.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class TmdbService {

    private final RestClient restClient;

    public TmdbService(@Value("${tmdb.api.key}") String apiKey,
                       @Value("${tmdb.base.url}") String baseUrl) {
        this.restClient = RestClient.builder()
            .baseUrl(baseUrl)
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .defaultHeader("accept", "application/json")
            .build();
    }

    public Map getPopularMovies() {
        return restClient.get()
            .uri("/movie/popular?language=fr-FR&page=1")
            .retrieve()
            .body(Map.class);
    }

    public Map getPopularSeries() {
        return restClient.get()
            .uri("/tv/popular?language=fr-FR&page=1")
            .retrieve()
            .body(Map.class);
    }

    public Map search(String query) {
        return restClient.get()
            .uri("/search/multi?query=" + query + "&language=fr-FR")
            .retrieve()
            .body(Map.class);
    }

    public Map getMovieDetails(Long movieId) {
        return restClient.get()
            .uri("/movie/" + movieId + "?language=fr-FR")
            .retrieve()
            .body(Map.class);
    }

    public Map getSeriesDetails(Long seriesId) {
        return restClient.get()
            .uri("/tv/" + seriesId + "?language=fr-FR")
            .retrieve()
            .body(Map.class);
    }

    public Map getMovieCredits(Long movieId) {
        return restClient.get()
            .uri("/movie/" + movieId + "/credits?language=fr-FR")
            .retrieve()
            .body(Map.class);
    }

    public Map getSeriesCredits(Long seriesId) {
        return restClient.get()
            .uri("/tv/" + seriesId + "/credits?language=fr-FR")
            .retrieve()
            .body(Map.class);
    }
}