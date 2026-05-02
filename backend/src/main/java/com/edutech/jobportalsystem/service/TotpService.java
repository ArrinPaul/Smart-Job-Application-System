package com.edutech.jobportalsystem.service;

import org.apache.commons.codec.binary.Base32;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;

@Service
public class TotpService {

    private static final int SECRET_SIZE = 20;
    private static final int OTP_DIGITS = 6;
    private static final int TIME_STEP_SECONDS = 30;

    @Value("${app.security.mfa.issuer:Vecta}")
    private String issuer;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Base32 base32 = new Base32();

    public String generateSecret() {
        byte[] buffer = new byte[SECRET_SIZE];
        secureRandom.nextBytes(buffer);
        return base32.encodeToString(buffer).replace("=", "");
    }

    public boolean verifyCode(String secret, String code) {
        if (secret == null || secret.isBlank() || code == null || !code.matches("^[0-9]{6}$")) {
            return false;
        }

        long currentCounter = System.currentTimeMillis() / 1000L / TIME_STEP_SECONDS;
        for (int i = -1; i <= 1; i++) {
            String candidate = generateCode(secret, currentCounter + i);
            if (code.equals(candidate)) {
                return true;
            }
        }
        return false;
    }

    public String buildOtpAuthUri(String username, String secret) {
        String label = urlEncode(issuer + ":" + username);
        String encodedIssuer = urlEncode(issuer);
        return "otpauth://totp/" + label + "?secret=" + secret + "&issuer=" + encodedIssuer + "&digits=6&period=30";
    }

    private String generateCode(String secret, long counter) {
        try {
            byte[] key = base32.decode(secret);
            byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);

            int otp = binary % 1_000_000;
            return String.format("%0" + OTP_DIGITS + "d", otp);
        } catch (GeneralSecurityException ex) {
            return "";
        }
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
