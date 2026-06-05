package com.movie.backend.model;

import org.springframework.data.neo4j.core.schema.*;
import java.util.ArrayList;
import java.util.List;

@Node
public class User {

    @Id
    private String id;
    private String email;
    private String username;

    @Relationship(type = "WATCHED", direction = Relationship.Direction.OUTGOING)
    private List<Movie> watchedMovies = new ArrayList<>();

    @Relationship(type = "LIKED", direction = Relationship.Direction.OUTGOING)
    private List<Movie> likedMovies = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public List<Movie> getWatchedMovies() { return watchedMovies; }
    public void setWatchedMovies(List<Movie> watchedMovies) { this.watchedMovies = watchedMovies; }

    public List<Movie> getLikedMovies() { return likedMovies; }
    public void setLikedMovies(List<Movie> likedMovies) { this.likedMovies = likedMovies; }
}