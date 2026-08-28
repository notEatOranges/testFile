package com.love.nest.cfg;

import com.love.nest.core.ApiException;
import com.love.nest.core.Jwt;
import com.love.nest.repo.Users;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.file.Paths;
import java.util.Map;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${love.jwt-secret}")
    private String secret;

    @Value("${love.jwt-days}")
    private long jwtDays;

    @Value("${love.files-dir}")
    private String filesDir;

    private final Users users;

    public WebMvcConfig(Users users) {
        this.users = users;
    }

    @Bean
    public Jwt jwt() {
        return new Jwt(secret, jwtDays);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("*")
                .allowedHeaders("*");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String abs = Paths.get(filesDir).toAbsolutePath().normalize().toString().replace("\\", "/");
        registry.addResourceHandler("/files/**").addResourceLocations("file:" + abs + "/");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) {
                String auth = req.getHeader("Authorization");
                if (auth != null && auth.startsWith("Bearer ")) {
                    long uid = jwt().verify(auth.substring(7));
                    if (uid > 0) {
                        Map<String, Object> user = users.findById(uid);
                        if (user != null) {
                            req.setAttribute("user", user);
                            return true;
                        }
                    }
                }
                throw new ApiException(401, "请先登录");
            }
        }).addPathPatterns("/api/**")
          .excludePathPatterns("/api/auth/login", "/api/auth/register", "/api/admin/**");
    }
}
