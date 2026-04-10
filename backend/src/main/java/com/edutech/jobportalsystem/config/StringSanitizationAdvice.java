package com.edutech.jobportalsystem.config;

import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.InitBinder;

import java.beans.PropertyEditorSupport;
import java.text.Normalizer;

@ControllerAdvice
public class StringSanitizationAdvice {

    @InitBinder
    public void initBinder(WebDataBinder binder) {
        binder.registerCustomEditor(String.class, new PropertyEditorSupport() {
            @Override
            public void setAsText(String text) {
                setValue(sanitize(text));
            }
        });
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }

        String normalized = Normalizer.normalize(value, Normalizer.Form.NFKC).trim();
        normalized = normalized.replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "");
        return normalized.replace("<", "").replace(">", "");
    }
}
