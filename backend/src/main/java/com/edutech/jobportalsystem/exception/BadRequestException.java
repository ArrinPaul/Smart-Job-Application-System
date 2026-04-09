package com.edutech.jobportalsystem.exception;

// File: ./backend/src/main/java/com/edutech/jobportalsystem/exception/BadRequestException.java

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.BAD_REQUEST)
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
