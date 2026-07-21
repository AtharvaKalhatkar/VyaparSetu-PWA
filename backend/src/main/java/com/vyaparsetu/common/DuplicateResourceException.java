package com.vyaparsetu.common;

import org.springframework.http.HttpStatus;

public class DuplicateResourceException extends BaseException {

    public DuplicateResourceException(String message) {
        super(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE", message);
    }

    public DuplicateResourceException(String resourceType, String field, Object value) {
        super(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE",
            resourceType + " already exists with " + field + ": " + value);
    }

    public DuplicateResourceException(String message, Throwable cause) {
        super(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE", message, cause);
    }

}
