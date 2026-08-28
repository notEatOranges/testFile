package com.love.nest.core;

/** 业务异常：GlobalAdvice 统一转成 {ok:false,message} */
public class ApiException extends RuntimeException {
    public final int status;

    public ApiException(String message) { this(400, message); }

    public ApiException(int status, String message) {
        super(message);
        this.status = status;
    }
}
