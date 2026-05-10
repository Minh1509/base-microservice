-- Runs once on first container boot (only when pgdata volume is empty).
-- Creates the per-service databases. Extensions can be added here later.
CREATE DATABASE auth_db;
CREATE DATABASE user_db;
