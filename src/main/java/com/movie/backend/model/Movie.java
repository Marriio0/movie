package com.movie.backend.model;

import org.springframework.data.neo4j.core.schema.*;

@Node
public class Movie {

    @Id
    @GeneratedValue
    private String id;
    private Long tmdbId;
    private String title;
    private String overview;
    private String posterPath;
    private Double rating;
    private String releaseDate;
    private String mediaType;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getTmdbId() { return tmdbId; }
    public void setTmdbId(Long tmdbId) { this.tmdbId = tmdbId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getOverview() { return overview; }
    public void setOverview(String overview) { this.overview = overview; }

    public String getPosterPath() { return posterPath; }
    public void setPosterPath(String posterPath) { this.posterPath = posterPath; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public String getReleaseDate() { return releaseDate; }
    public void setReleaseDate(String releaseDate) { this.releaseDate = releaseDate; }

    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
}