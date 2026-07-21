# Stage 1: Build
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

RUN addgroup --system --gid 1000 vyaparsetu && \
    adduser --system --uid 1000 --ingroup vyaparsetu vyaparsetu && \
    mkdir -p /app/uploads /app/logs && \
    chown -R vyaparsetu:vyaparsetu /app

COPY --from=build /app/target/vyaparsetu-backend-*.jar /app/vyaparsetu-backend.jar

USER vyaparsetu

EXPOSE 8080

ENV TZ=Asia/Kolkata \
    JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/app/logs/heapdump.hprof" \
    SPRING_PROFILES_ACTIVE=dev

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/vyaparsetu-backend.jar"]
