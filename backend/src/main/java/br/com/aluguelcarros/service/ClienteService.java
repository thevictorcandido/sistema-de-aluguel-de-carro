package br.com.aluguelcarros.service;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.aluguelcarros.exception.CampoInvalidoException;
import br.com.aluguelcarros.exception.RecursoNaoEncontradoException;
import br.com.aluguelcarros.exception.RegraNegocioException;
import br.com.aluguelcarros.model.AtualizarClienteRequest;
import br.com.aluguelcarros.model.CadastroClienteRequest;
import br.com.aluguelcarros.model.Cliente;
import br.com.aluguelcarros.model.ClienteResponse;
import br.com.aluguelcarros.model.ClienteResponse.Exclusao;
import br.com.aluguelcarros.model.Rendimento;
import br.com.aluguelcarros.model.RendimentoRequest;
import br.com.aluguelcarros.model.RendimentoResponse;
import br.com.aluguelcarros.model.StatusPedido;
import br.com.aluguelcarros.repository.ClienteRepository;
import br.com.aluguelcarros.repository.PedidoAluguelRepository;
import br.com.aluguelcarros.repository.UsuarioRepository;

@Service
public class ClienteService {

	private static final Set<StatusPedido> STATUS_ATIVOS = EnumSet.copyOf(
			EnumSet.allOf(StatusPedido.class).stream().filter(StatusPedido::ativo).toList());

	private final UsuarioRepository usuarios;
	private final ClienteRepository clientes;
	private final PedidoAluguelRepository pedidos;
	private final PasswordEncoder passwordEncoder;

	public ClienteService(UsuarioRepository usuarios, ClienteRepository clientes, PedidoAluguelRepository pedidos,
			PasswordEncoder passwordEncoder) {
		this.usuarios = usuarios;
		this.clientes = clientes;
		this.pedidos = pedidos;
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

	@Transactional(readOnly = true)
	public ClienteResponse consultar(Long clienteId) {
		return ClienteResponse.de(buscar(clienteId), verificarExclusao(clienteId));
	}

	@Transactional
	public ClienteResponse atualizar(Long clienteId, AtualizarClienteRequest dados) {
		Cliente cliente = buscar(clienteId);
		String rg = dados.rg().trim().toUpperCase();
		if (!cpfValido(dados.cpf())) {
			throw CampoInvalidoException.invalido("cpf", "Este CPF não é válido.");
		}
		if (clientes.existsByCpfAndIdNot(dados.cpf(), clienteId)) {
			throw CampoInvalidoException.emUso("cpf", "Já existe uma conta com este CPF.");
		}
		if (clientes.existsByRgAndIdNot(rg, clienteId)) {
			throw CampoInvalidoException.emUso("rg", "Já existe uma conta com este RG.");
		}
		cliente.atualizarDados(rg, dados.cpf(), dados.nome().trim(), dados.profissao().trim(),
				dados.endereco().paraEndereco());
		return ClienteResponse.de(cliente, verificarExclusao(clienteId));
	}

	/**
	 * Pedido em andamento bloqueia a exclusão (US03). Contrato executado também, porque o contrato e o
	 * proprietário do automóvel precisam continuar no histórico.
	 */
	@Transactional(readOnly = true)
	public Exclusao verificarExclusao(Long clienteId) {
		if (pedidos.existsByClienteIdAndStatusIn(clienteId, STATUS_ATIVOS)) {
			return Exclusao.bloqueada("Você tem pedidos em andamento. Cancele-os antes de excluir a conta.");
		}
		if (pedidos.existsByClienteIdAndStatusIn(clienteId, List.of(StatusPedido.CONTRATADO))) {
			return Exclusao.bloqueada("Você tem contratos executados, que precisam continuar no histórico.");
		}
		return Exclusao.liberada();
	}

	/** Exclui a conta e os pedidos cancelados ou reprovados, que são os únicos que ela pode ter aqui. */
	@Transactional
	public void excluir(Long clienteId) {
		Cliente cliente = buscar(clienteId);
		Exclusao exclusao = verificarExclusao(clienteId);
		if (!exclusao.permitida()) {
			throw new RegraNegocioException(exclusao.motivo());
		}
		pedidos.deleteByClienteId(clienteId);
		clientes.delete(cliente);
	}

	@Transactional
	public RendimentoResponse adicionarRendimento(Long clienteId, RendimentoRequest dados) {
		Cliente cliente = buscar(clienteId);
		Rendimento rendimento = new Rendimento(dados.entidadeEmpregadora().trim(), dados.valor());
		cliente.adicionarRendimento(rendimento);
		clientes.flush();
		return RendimentoResponse.de(rendimento);
	}

	@Transactional
	public RendimentoResponse atualizarRendimento(Long clienteId, Long rendimentoId, RendimentoRequest dados) {
		Rendimento rendimento = buscarRendimento(buscar(clienteId), rendimentoId);
		rendimento.atualizar(dados.entidadeEmpregadora().trim(), dados.valor());
		return RendimentoResponse.de(rendimento);
	}

	@Transactional
	public void removerRendimento(Long clienteId, Long rendimentoId) {
		Cliente cliente = buscar(clienteId);
		cliente.removerRendimento(buscarRendimento(cliente, rendimentoId));
	}

	private Cliente buscar(Long clienteId) {
		return clientes.findById(clienteId)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado."));
	}

	/** Só procura entre os rendimentos do próprio cliente: o de outra pessoa responde 404. */
	private static Rendimento buscarRendimento(Cliente cliente, Long rendimentoId) {
		return cliente.getRendimentos().stream()
				.filter(r -> r.getId().equals(rendimentoId))
				.findFirst()
				.orElseThrow(() -> new RecursoNaoEncontradoException("Rendimento não encontrado."));
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
