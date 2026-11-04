package br.com.aluguelcarros.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import br.com.aluguelcarros.model.Perfil;
import br.com.aluguelcarros.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/** Gera e lê o token da sessão. O id do usuário vai no subject, e o perfil numa claim própria. */
@Component
public class JwtUtil {

	private static final String CLAIM_PERFIL = "perfil";

	private final SecretKey chave;
	private final Duration validade;

	public JwtUtil(@Value("${app.jwt.secret}") String segredo, @Value("${app.jwt.validade-horas}") long horas) {
		byte[] bytes = segredo.getBytes(StandardCharsets.UTF_8);
		if (bytes.length < 32) {
			throw new IllegalStateException("JWT_SECRET precisa ter 32 caracteres ou mais.");
		}
		this.chave = Keys.hmacShaKeyFor(bytes);
		this.validade = Duration.ofHours(horas);
	}

	public String gerar(Usuario usuario) {
		Instant agora = Instant.now();
		return Jwts.builder()
				.subject(usuario.getId().toString())
				.claim(CLAIM_PERFIL, usuario.getPerfil().name())
				.issuedAt(Date.from(agora))
				.expiration(Date.from(agora.plus(validade)))
				.signWith(chave)
				.compact();
	}

	/** Vazio quando o token está ausente, adulterado ou vencido. */
	public Optional<UsuarioAutenticado> ler(String token) {
		try {
			Claims claims = Jwts.parser().verifyWith(chave).build().parseSignedClaims(token).getPayload();
			Perfil perfil = Perfil.valueOf(claims.get(CLAIM_PERFIL, String.class));
			return Optional.of(new UsuarioAutenticado(Long.valueOf(claims.getSubject()), perfil));
		} catch (JwtException | IllegalArgumentException e) {
			return Optional.empty();
		}
	}

	public Duration getValidade() {
		return validade;
	}

}
