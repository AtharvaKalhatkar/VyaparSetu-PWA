package com.vyaparsetu.common;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends BaseException {

    public ResourceNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", message);
    }

    public ResourceNotFoundException(String resourceType, Object resourceId) {
        super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND",
            resourceType + " not found with id: " + resourceId);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", message, cause);
    }

}
