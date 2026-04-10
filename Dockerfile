# Multi-stage Docker build for Spring Boot application
# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY backend/src ./src

# Build the application
RUN mvn clean package -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy JAR from builder stage
COPY --from=builder /app/target/jobportalsystem-0.0.1-SNAPSHOT.jar .

# Create a non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

# Set environment
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0"
ENV SERVER_PORT=${PORT:-8080}

# Expose port
EXPOSE ${PORT:-8080}

# Start application
ENTRYPOINT ["java", "-jar", "jobportalsystem-0.0.1-SNAPSHOT.jar"]
