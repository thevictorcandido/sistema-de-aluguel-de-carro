package br.com.aluguelcarros.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.WebUtils;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Lê o JWT do cookie da sessão e, se for válido, autentica a requisição com o perfil do usuário. */
public class JwtFilter extends OncePerRequestFilter {

	private final JwtUtil jwtUtil;
	private final String nomeCookie;

	public JwtFilter(JwtUtil jwtUtil, String nomeCookie) {
		this.jwtUtil = jwtUtil;
		this.nomeCookie = nomeCookie;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		Cookie cookie = WebUtils.getCookie(request, nomeCookie);
		if (cookie != null) {
			jwtUtil.ler(cookie.getValue()).ifPresent(usuario -> {
				var autoridade = new SimpleGrantedAuthority("ROLE_" + usuario.perfil().name());
				var autenticacao = new UsernamePasswordAuthenticationToken(usuario, null, List.of(autoridade));
				SecurityContextHolder.getContext().setAuthentication(autenticacao);
			});
		}
		chain.doFilter(request, response);
	}

}
