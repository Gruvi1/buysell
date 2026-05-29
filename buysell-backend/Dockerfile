# syntax=docker/dockerfile:1

# Build stage
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /buysell

ENV GRADLE_USER_HOME=/cache/gradle

COPY gradlew .
COPY gradle ./gradle
RUN chmod +x gradlew

RUN ./gradlew --version

COPY build.gradle settings.gradle gradle.properties ./
RUN ./gradlew dependencies --no-daemon

COPY src ./src

RUN ./gradlew clean build --no-daemon

# Run stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

RUN addgroup -S spring && adduser -S spring -G spring \
    && mkdir -p /tmp/uploads \
    && chown -R spring:spring /tmp/uploads

USER spring

COPY --from=build /buysell/build/libs/buysell.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
