package br.com.aluguelcarros.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.aluguelcarros.exception.CampoInvalidoException;
import br.com.aluguelcarros.exception.RecursoNaoEncontradoException;
import br.com.aluguelcarros.model.Agente;
import br.com.aluguelcarros.model.Automovel;
import br.com.aluguelcarros.model.Cliente;
import br.com.aluguelcarros.model.Contrato;
import br.com.aluguelcarros.model.NovoPedidoRequest;
import br.com.aluguelcarros.model.Parecer;
import br.com.aluguelcarros.model.ParecerRequest;
import br.com.aluguelcarros.model.PedidoAluguel;
import br.com.aluguelcarros.model.PedidoResponse;
import br.com.aluguelcarros.model.Perfil;
import br.com.aluguelcarros.repository.AgenteRepository;
import br.com.aluguelcarros.repository.AutomovelRepository;
import br.com.aluguelcarros.repository.ClienteRepository;
import br.com.aluguelcarros.repository.ContratoRepository;
import br.com.aluguelcarros.repository.PedidoAluguelRepository;
import br.com.aluguelcarros.security.UsuarioAutenticado;

@Service
public class PedidoService {

	private final PedidoAluguelRepository pedidos;
	private final ClienteRepository clientes;
	private final AutomovelRepository automoveis;
	private final AgenteRepository agentes;
	private final ContratoRepository contratos;
	private final Clock relogio;

	public PedidoService(PedidoAluguelRepository pedidos, ClienteRepository clientes, AutomovelRepository automoveis,
			AgenteRepository agentes, ContratoRepository contratos, Clock relogio) {
		this.pedidos = pedidos;
		this.clientes = clientes;
		this.automoveis = automoveis;
		this.agentes = agentes;
		this.contratos = contratos;
		this.relogio = relogio;
	}

	/** US05: o pedido nasce ENVIADO, com início a partir de hoje e fim igual ou depois do início. */
	@Transactional
	public PedidoResponse criar(Long clienteId, NovoPedidoRequest dados) {
		Cliente cliente = clientes.findById(clienteId)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Cliente não encontrado."));
		Automovel automovel = automoveis.findById(dados.automovelId())
				.orElseThrow(() -> CampoInvalidoException.invalido("automovelId", "Este automóvel não existe."));
		validarPeriodo(dados.dataInicio(), dados.dataFim());
		PedidoAluguel pedido = new PedidoAluguel(cliente, automovel, dados.dataInicio(), dados.dataFim(),
				LocalDateTime.now(relogio));
		return PedidoResponse.de(pedidos.save(pedido));
	}

	/** Cliente vê só os próprios pedidos, do mais novo ao mais antigo. Agente vê todos. */
	@Transactional(readOnly = true)
	public List<PedidoResponse> listar(UsuarioAutenticado usuario) {
		List<PedidoAluguel> lista = usuario.perfil() == Perfil.CLIENTE
				? pedidos.findByClienteIdOrderByDataCriacaoDesc(usuario.id())
				: pedidos.findAllByOrderByDataCriacaoAsc();
		return lista.stream().map(PedidoResponse::de).toList();
	}

	/**
	 * US07 e US09: o dono ou um agente troca automóvel ou datas. Um pedido já avaliado volta para ENVIADO e perde o
	 * parecer; contratado ou cancelado não muda (409).
	 */
	@Transactional
	public PedidoResponse modificar(UsuarioAutenticado usuario, Long pedidoId, NovoPedidoRequest dados) {
		PedidoAluguel pedido = buscarVisivel(usuario, pedidoId);
		pedido.exigirAlteravel("modificado");
		Automovel automovel = automoveis.findById(dados.automovelId())
				.orElseThrow(() -> CampoInvalidoException.invalido("automovelId", "Este automóvel não existe."));
		validarPeriodo(dados.dataInicio(), dados.dataFim());
		pedido.modificar(automovel, dados.dataInicio(), dados.dataFim());
		pedidos.flush();
		return visao(usuario, pedido);
	}

	/** US08: só o dono cancela, e só antes de contratado. O pedido continua no histórico. */
	@Transactional
	public PedidoResponse cancelar(UsuarioAutenticado usuario, Long pedidoId) {
		PedidoAluguel pedido = buscarVisivel(usuario, pedidoId);
		pedido.cancelar();
		return PedidoResponse.de(pedido);
	}

	/** US06: pedido de outro cliente responde 404, para não revelar que existe. O agente recebe a ficha financeira. */
	@Transactional(readOnly = true)
	public PedidoResponse buscar(UsuarioAutenticado usuario, Long pedidoId) {
		return visao(usuario, buscarVisivel(usuario, pedidoId));
	}

	/** US10: o agente abre a análise de um pedido que aguarda; o status passa a EM_ANALISE. */
	@Transactional
	public PedidoResponse abrirAnalise(UsuarioAutenticado usuario, Long pedidoId) {
		PedidoAluguel pedido = buscarVisivel(usuario, pedidoId);
		pedido.iniciarAnalise();
		return PedidoResponse.paraAgente(pedido, null);
	}

	/** US10: o parecer guarda agente, resultado, justificativa e data; favorável aprova, desfavorável reprova. */
	@Transactional
	public PedidoResponse registrarParecer(UsuarioAutenticado usuario, Long pedidoId, ParecerRequest dados) {
		PedidoAluguel pedido = buscarVisivel(usuario, pedidoId);
		Agente agente = agentes.findById(usuario.id())
				.orElseThrow(() -> new RecursoNaoEncontradoException("Agente não encontrado."));
		pedido.registrarParecer(new Parecer(agente, dados.positivo(), dados.justificativa().trim(),
				LocalDateTime.now(relogio)));
		pedidos.flush();
		return PedidoResponse.paraAgente(pedido, null);
	}

	private PedidoResponse visao(UsuarioAutenticado usuario, PedidoAluguel pedido) {
		Contrato contrato = contratos.findByPedidoId(pedido.getId()).orElse(null);
		return usuario.perfil() == Perfil.CLIENTE ? PedidoResponse.de(pedido, contrato)
				: PedidoResponse.paraAgente(pedido, contrato);
	}

	PedidoAluguel buscarVisivel(UsuarioAutenticado usuario, Long pedidoId) {
		return pedidos.findById(pedidoId)
				.filter(pedido -> usuario.perfil() != Perfil.CLIENTE
						|| pedido.getCliente().getId().equals(usuario.id()))
				.orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado."));
	}

	private void validarPeriodo(LocalDate inicio, LocalDate fim) {
		if (inicio.isBefore(LocalDate.now(relogio))) {
			throw CampoInvalidoException.invalido("dataInicio", "O início precisa ser hoje ou depois.");
		}
		if (fim.isBefore(inicio)) {
			throw CampoInvalidoException.invalido("dataFim", "O fim não pode ser antes do início.");
		}
	}

}
