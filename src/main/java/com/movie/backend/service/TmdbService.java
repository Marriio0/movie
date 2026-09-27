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
            .uri("/movie/" + movieId + "?language=fr-FR&append_to_response=external_ids")
            .retrieve()
            .body(Map.class);
    }

    public Map getSeriesDetails(Long seriesId) {
        return restClient.get()
            .uri("/tv/" + seriesId + "?language=fr-FR&append_to_response=external_ids")
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

    // Trailers and teasers: French videos first, plus English and language-less ones,
    // because many titles have no French trailer.
    public Map getMovieVideos(Long movieId) {
        return restClient.get()
            .uri("/movie/" + movieId + "/videos?language=fr-FR&include_video_language=fr,en,null")
            .retrieve()
            .body(Map.class);
    }

    public Map getSeriesVideos(Long seriesId) {
        return restClient.get()
            .uri("/tv/" + seriesId + "/videos?language=fr-FR&include_video_language=fr,en,null")
            .retrieve()
            .body(Map.class);
    }

    // Legal streaming/rent/buy providers per country (data by JustWatch, via TMDB).
    public Map getMovieWatchProviders(Long movieId) {
        return restClient.get()
            .uri("/movie/" + movieId + "/watch/providers")
            .retrieve()
            .body(Map.class);
    }

    public Map getSeriesWatchProviders(Long seriesId) {
        return restClient.get()
            .uri("/tv/" + seriesId + "/watch/providers")
            .retrieve()
            .body(Map.class);
    }
}