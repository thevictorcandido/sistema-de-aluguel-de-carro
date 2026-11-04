package br.com.aluguelcarros.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.aluguelcarros.model.LoginRequest;
import br.com.aluguelcarros.model.Usuario;
import br.com.aluguelcarros.model.UsuarioResponse;
import br.com.aluguelcarros.security.CookieSessao;
import br.com.aluguelcarros.security.JwtUtil;
import br.com.aluguelcarros.security.UsuarioAutenticado;
import br.com.aluguelcarros.service.AuthService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;
	private final JwtUtil jwtUtil;
	private final CookieSessao cookieSessao;

	public AuthController(AuthService authService, JwtUtil jwtUtil, CookieSessao cookieSessao) {
		this.authService = authService;
		this.jwtUtil = jwtUtil;
		this.cookieSessao = cookieSessao;
	}

	@PostMapping("/login")
	public ResponseEntity<UsuarioResponse> login(@Valid @RequestBody LoginRequest dados) {
		Usuario usuario = authService.autenticar(dados.login(), dados.senha());
		return ResponseEntity.ok()
				.header(HttpHeaders.SET_COOKIE, cookieSessao.criar(jwtUtil.gerar(usuario)))
				.body(UsuarioResponse.de(usuario));
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout() {
		return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookieSessao.apagar()).build();
	}

	@GetMapping("/me")
	public UsuarioResponse me(@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return UsuarioResponse.de(authService.buscar(usuario.id()));
	}

}
