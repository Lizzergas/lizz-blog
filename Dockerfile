# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM gradle:jdk21 AS build
WORKDIR /home/gradle/src

# Copy build scripts first to leverage Docker layer caching
COPY build.gradle.kts settings.gradle.kts gradle.properties ./
COPY gradle ./gradle

# Warm up Gradle configuration and dependency caches (tolerate failure if project not fully copied yet)
RUN gradle --no-daemon help || true

# Copy the rest of the project
COPY . .

# Build a runnable distribution (creates start scripts under build/install/<app>)
RUN gradle --no-daemon clean installDist

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy the app distribution
COPY --from=build /home/gradle/src/build/install/lizz-blog /app

# Container-friendly JVM flags; Cloud/containers read logs from stdout/stderr
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

# Default port (can be overridden at runtime with -e PORT=XXXX)
ENV PORT=8080
EXPOSE 8080

# Ensure Ktor uses the PORT env var and binds to all interfaces
# Gradle's start script honors JAVA_OPTS/JVM_OPTS env vars as JVM arguments
ENTRYPOINT ["sh", "-c", "JAVA_OPTS=\"-Dktor.deployment.port=${PORT} -Dktor.deployment.host=0.0.0.0 ${JAVA_OPTS}\" exec /app/bin/lizz-blog"]
