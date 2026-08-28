package com.love.nest.core;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;

/** 极简 HS256 JWT：payload 只放 uid 和过期时间，够双人小应用用 */
public class Jwt {
    private final byte[] secret;
    private final long days;

    public Jwt(String secret, long days) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.days = days;
    }

    private static String b64(String s) {
        return b64(s.getBytes(StandardCharsets.UTF_8));
    }

    private static String b64(byte[] b) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    public String sign(long uid) {
        long exp = System.currentTimeMillis() + days * 86400_000L;
        String head = b64("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        String payload = b64("{\"uid\":" + uid + ",\"exp\":" + exp + "}");
        return head + "." + payload + "." + b64(hmac(head + "." + payload));
    }

    /** 校验通过返回 uid，否则 -1 */
    public long verify(String token) {
        try {
            String[] p = token.split("\\.");
            if (p.length != 3) return -1;
            if (!MessageDigest.isEqual(
                    hmac(p[0] + "." + p[1]),
                    Base64.getUrlDecoder().decode(p[2]))) return -1;
            String payload = new String(Base64.getUrlDecoder().decode(p[1]), StandardCharsets.UTF_8);
            long uid = num(payload, "uid");
            long exp = num(payload, "exp");
            if (uid <= 0 || System.currentTimeMillis() > exp) return -1;
            return uid;
        } catch (Exception e) {
            return -1;
        }
    }

    private static long num(String json, String key) {
        int i = json.indexOf("\"" + key + "\":");
        if (i < 0) return -1;
        int s = i + key.length() + 3, e = s;
        while (e < json.length() && Character.isDigit(json.charAt(e))) e++;
        return Long.parseLong(json.substring(s, e));
    }

    private byte[] hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
