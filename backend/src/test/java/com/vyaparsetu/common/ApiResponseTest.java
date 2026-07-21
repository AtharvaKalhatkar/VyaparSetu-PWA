package com.vyaparsetu.common;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class ApiResponseTest {

    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Test
    @DisplayName("success factory method should create response with success=true")
    void success_shouldCreateSuccessResponse() {
        ApiResponse<String> response = ApiResponse.success("Test data");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Operation completed successfully");
        assertThat(response.getData()).isEqualTo("Test data");
        assertThat(response.getTimestamp()).isNotNull();
    }

    @Test
    @DisplayName("success with message should set custom message")
    void success_withMessage_shouldSetCustomMessage() {
        ApiResponse<String> response = ApiResponse.success("Custom message", "Test data");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Custom message");
        assertThat(response.getData()).isEqualTo("Test data");
    }

    @Test
    @DisplayName("success with null data should allow null data")
    void success_withNullData_shouldAllowNull() {
        ApiResponse<Void> response = ApiResponse.success("Message", null);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Message");
        assertThat(response.getData()).isNull();
    }

    @Test
    @DisplayName("error factory method should create response with success=false")
    void error_shouldCreateErrorResponse() {
        ApiResponse<Void> response = ApiResponse.error("Error occurred");

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Error occurred");
        assertThat(response.getTimestamp()).isNotNull();
    }

    @Test
    @DisplayName("error with errorCode should set error code")
    void error_withErrorCode_shouldSetErrorCode() {
        ApiResponse<Void> response = ApiResponse.error("NOT_FOUND", "Resource not found");

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode()).isEqualTo("NOT_FOUND");
        assertThat(response.getMessage()).isEqualTo("Resource not found");
    }

    @Test
    @DisplayName("error with path should include request path")
    void error_withPath_shouldIncludePath() {
        ApiResponse<Void> response = ApiResponse.error("BAD_REQUEST", "Invalid input", "/api/test");

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getErrorCode()).isEqualTo("BAD_REQUEST");
        assertThat(response.getPath()).isEqualTo("/api/test");
    }

    @Test
    @DisplayName("no args constructor should create empty response")
    void noArgsConstructor_shouldCreateEmptyResponse() {
        ApiResponse<String> response = new ApiResponse<>();

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).isNull();
        assertThat(response.getData()).isNull();
    }

    @Test
    @DisplayName("JSON serialization should include non-null fields")
    void jsonSerialization_shouldIncludeNonNull() throws JsonProcessingException {
        ApiResponse<String> response = ApiResponse.success("OK", "data");

        String json = objectMapper.writeValueAsString(response);

        assertThat(json).contains("\"success\":true");
        assertThat(json).contains("\"message\":\"OK\"");
        assertThat(json).contains("\"data\":\"data\"");
        assertThat(json).contains("\"timestamp\"");
    }

    @Test
    @DisplayName("JSON serialization should exclude null fields")
    void jsonSerialization_shouldExcludeNull() throws JsonProcessingException {
        ApiResponse<String> response = ApiResponse.success("OK", null);

        String json = objectMapper.writeValueAsString(response);

        assertThat(json).contains("\"success\":true");
        assertThat(json).contains("\"message\":\"OK\"");
        assertThat(json).doesNotContain("\"data\"");
    }

    @Test
    @DisplayName("JSON serialization of error should include errorCode and path")
    void jsonSerialization_error_shouldIncludeErrorCodeAndPath() throws JsonProcessingException {
        ApiResponse<Void> response = ApiResponse.error("NOT_FOUND", "Not found", "/api/resource");

        String json = objectMapper.writeValueAsString(response);

        assertThat(json).contains("\"success\":false");
        assertThat(json).contains("\"errorCode\":\"NOT_FOUND\"");
        assertThat(json).contains("\"path\":\"/api/resource\"");
    }

    @Test
    @DisplayName("builder should create response with all fields")
    void builder_shouldCreateResponse() {
        LocalDateTime now = LocalDateTime.now();
        ApiResponse<String> response = ApiResponse.<String>builder()
                .success(true)
                .message("Test")
                .data("value")
                .errorCode("ERR")
                .timestamp(now)
                .path("/test")
                .build();

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Test");
        assertThat(response.getData()).isEqualTo("value");
        assertThat(response.getErrorCode()).isEqualTo("ERR");
        assertThat(response.getTimestamp()).isEqualTo(now);
        assertThat(response.getPath()).isEqualTo("/test");
    }
}
