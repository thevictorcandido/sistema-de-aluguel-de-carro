package br.com.aluguelcarros.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.aluguelcarros.exception.CampoInvalidoException;
import br.com.aluguelcarros.model.CadastroClienteRequest;
import br.com.aluguelcarros.model.Cliente;
import br.com.aluguelcarros.repository.ClienteRepository;
import br.com.aluguelcarros.repository.UsuarioRepository;

@Service
public class ClienteService {

	private final UsuarioRepository usuarios;
	private final ClienteRepository clientes;
	private final PasswordEncoder passwordEncoder;

	public ClienteService(UsuarioRepository usuarios, ClienteRepository clientes, PasswordEncoder passwordEncoder) {
		this.usuarios = usuarios;
		this.clientes = clientes;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public Cliente cadastrar(CadastroClienteRequest dados) {
		String login = dados.login().trim().toLowerCase();
		String rg = dados.rg().trim().toUpperCase();
		if (!cpfValido(dados.cpf())) {
			throw CampoInvalidoException.invalido("cpf", "Este CPF não é válido.");
		}
		if (usuarios.existsByLogin(login)) {
			throw CampoInvalidoException.emUso("login", "Este usuário já está em uso.");
		}
		if (clientes.existsByCpf(dados.cpf())) {
			throw CampoInvalidoException.emUso("cpf", "Já existe uma conta com este CPF.");
		}
		if (clientes.existsByRg(rg)) {
			throw CampoInvalidoException.emUso("rg", "Já existe uma conta com este RG.");
		}
		Cliente cliente = new Cliente(login, passwordEncoder.encode(dados.senha()), rg, dados.cpf(),
				dados.nome().trim(), dados.profissao().trim(), dados.endereco().paraEndereco());
		return clientes.save(cliente);
	}

	/** Confere os dois dígitos verificadores de um CPF no formato 000.000.000-00. */
	static boolean cpfValido(String cpf) {
		String digitos = cpf.replaceAll("\\D", "");
		if (digitos.length() != 11 || digitos.chars().distinct().count() == 1) {
			return false;
		}
		for (int posicao = 9; posicao <= 10; posicao++) {
			int soma = 0;
			for (int i = 0; i < posicao; i++) {
				soma += (digitos.charAt(i) - '0') * (posicao + 1 - i);
			}
			int resto = (soma * 10) % 11;
			if (resto == 10) {
				resto = 0;
			}
			if (resto != digitos.charAt(posicao) - '0') {
				return false;
			}
		}
		return true;
	}

}
