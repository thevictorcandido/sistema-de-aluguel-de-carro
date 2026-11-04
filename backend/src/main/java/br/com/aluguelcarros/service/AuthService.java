package br.com.aluguelcarros.service;

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

	public AuthService(UsuarioRepository usuarios, PasswordEncoder passwordEncoder) {
		this.usuarios = usuarios;
		this.passwordEncoder = passwordEncoder;
	}

	public Usuario autenticar(String login, String senha) {
		return usuarios.findByLogin(login.trim().toLowerCase())
				.filter(usuario -> passwordEncoder.matches(senha, usuario.getSenhaHash()))
				.orElseThrow(CredenciaisInvalidasException::new);
	}

	public Usuario buscar(Long id) {
		return usuarios.findById(id)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
	}

}
