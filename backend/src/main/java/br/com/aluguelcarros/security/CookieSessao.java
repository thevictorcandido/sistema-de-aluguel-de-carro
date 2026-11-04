package br.com.aluguelcarros.security;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

/** Cookie que leva o JWT: HttpOnly, para o JavaScript da página não ler o token. */
@Component
public class CookieSessao {

	private final String nome;
	private final boolean seguro;
	private final Duration validade;

	public CookieSessao(@Value("${app.cookie.nome}") String nome, @Value("${app.cookie.seguro}") boolean seguro,
			JwtUtil jwtUtil) {
		this.nome = nome;
		this.seguro = seguro;
		this.validade = jwtUtil.getValidade();
	}

	public String criar(String token) {
		return montar(token, validade);
	}

	public String apagar() {
		return montar("", Duration.ZERO);
	}

	private String montar(String valor, Duration duracao) {
		return ResponseCookie.from(nome, valor)
				.httpOnly(true)
				.secure(seguro)
				.sameSite("Strict")
				.path("/")
				.maxAge(duracao)
				.build()
				.toString();
	}

}
