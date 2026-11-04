package br.com.aluguelcarros.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import br.com.aluguelcarros.security.JwtFilter;
import br.com.aluguelcarros.security.JwtUtil;

/**
 * Regras de acesso por rota, conforme a tabela de API da SPEC. A verificação de dono de cada pedido fica nos
 * serviços.
 */
@Configuration
public class SecurityConfig {

	private static final String[] AGENTES = { "EMPRESA", "BANCO" };

	@Bean
	SecurityFilterChain filterChain(HttpSecurity http, JwtUtil jwtUtil, @Value("${app.cookie.nome}") String cookie)
			throws Exception {
		return http
				.csrf(csrf -> csrf.disable())
				.sessionManagement(sessao -> sessao.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(rotas -> rotas
						.requestMatchers("/api/health", "/api/auth/login", "/api/auth/logout").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/clientes").permitAll()
						.requestMatchers("/api/clientes/me/**").hasRole("CLIENTE")
						.requestMatchers(HttpMethod.POST, "/api/pedidos", "/api/pedidos/*/cancelar").hasRole("CLIENTE")
						.requestMatchers(HttpMethod.POST, "/api/pedidos/*/analise", "/api/pedidos/*/parecer")
						.hasAnyRole(AGENTES)
						.requestMatchers("/api/contratos/**").hasAnyRole(AGENTES)
						.requestMatchers(HttpMethod.POST, "/api/automoveis/**").hasAnyRole(AGENTES)
						.requestMatchers(HttpMethod.PUT, "/api/automoveis/**").hasAnyRole(AGENTES)
						.requestMatchers(HttpMethod.DELETE, "/api/automoveis/**").hasAnyRole(AGENTES)
						.anyRequest().authenticated())
				.addFilterBefore(new JwtFilter(jwtUtil, cookie), UsernamePasswordAuthenticationFilter.class)
				.exceptionHandling(erros -> erros
						.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
				.httpBasic(basic -> basic.disable())
				.formLogin(form -> form.disable())
				.logout(logout -> logout.disable())
				.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}
