package br.com.aluguelcarros.service;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.aluguelcarros.exception.CredenciaisInvalidasException;
import br.com.aluguelcarros.exception.RecursoNaoEncontradoException;
import br.com.aluguelcarros.model.Usuario;
import br.com.aluguelcarros.repository.UsuarioRepository;

@Service
@Transactional(readOnly = true)
public class AuthService {

	private final UsuarioRepository usuarios;
	private final PasswordEncoder passwordEncoder;
	private final String hashDeReferencia;

	public AuthService(UsuarioRepository usuarios, PasswordEncoder passwordEncoder) {
		this.usuarios = usuarios;
		this.passwordEncoder = passwordEncoder;
		this.hashDeReferencia = passwordEncoder.encode("referencia-para-login-inexistente");
	}

	public Usuario autenticar(String login, String senha) {
		Optional<Usuario> usuario = usuarios.findByLogin(login.trim().toLowerCase());
		// Sem usuário, compara com um hash qualquer: o tempo da resposta não revela quais logins existem
		String hash = usuario.map(Usuario::getSenhaHash).orElse(hashDeReferencia);
		boolean confere = passwordEncoder.matches(senha, hash);
		return usuario.filter(u -> confere).orElseThrow(CredenciaisInvalidasException::new);
	}

	public Usuario buscar(Long id) {
		return usuarios.findById(id)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
	}

}
