package br.com.aluguelcarros.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.aluguelcarros.exception.CampoInvalidoException;
import br.com.aluguelcarros.exception.RecursoNaoEncontradoException;
import br.com.aluguelcarros.model.Agente;
import br.com.aluguelcarros.model.Banco;
import br.com.aluguelcarros.model.Contrato;
import br.com.aluguelcarros.model.ContratoRequest;
import br.com.aluguelcarros.model.ContratoRequest.CreditoRequest;
import br.com.aluguelcarros.model.ContratoResponse;
import br.com.aluguelcarros.model.Empresa;
import br.com.aluguelcarros.model.PedidoAluguel;
import br.com.aluguelcarros.model.TipoContrato;
import br.com.aluguelcarros.model.Usuario;
import br.com.aluguelcarros.repository.AgenteRepository;
import br.com.aluguelcarros.repository.ContratoRepository;
import br.com.aluguelcarros.repository.PedidoAluguelRepository;

@Service
public class ContratoService {

	private final ContratoRepository contratos;
	private final PedidoAluguelRepository pedidos;
	private final AgenteRepository agentes;
	private final Clock relogio;

	public ContratoService(ContratoRepository contratos, PedidoAluguelRepository pedidos, AgenteRepository agentes,
			Clock relogio) {
		this.contratos = contratos;
		this.pedidos = pedidos;
		this.agentes = agentes;
		this.relogio = relogio;
	}

	/**
	 * US11 e US12: executa o contrato de um pedido aprovado. O tipo define o proprietário do automóvel; contrato de
	 * propriedade da empresa só por empresa, e de propriedade do banco só por banco, com crédito obrigatório.
	 */
	@Transactional
	public ContratoResponse executar(Long agenteId, Long pedidoId, ContratoRequest dados) {
		PedidoAluguel pedido = pedidos.findById(pedidoId)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Pedido não encontrado."));
		// O agente pode vir como proxy de Usuario; sem desembrulhar, instanceof Banco falharia
		Agente agente = (Agente) Hibernate.unproxy(agentes.findById(agenteId)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Agente não encontrado.")));
		pedido.contratar();
		validar(agente, dados);

		Contrato contrato = new Contrato(pedido, agente, dados.tipo(), LocalDate.now(relogio));
		if (dados.credito() != null) {
			CreditoRequest credito = dados.credito();
			((Banco) agente).concederCredito(contrato, credito.valor(), credito.taxaJuros(), credito.parcelas());
		}
		pedido.getAutomovel().registrarProprietario(novoProprietario(dados.tipo(), pedido, agente));
		return ContratoResponse.de(contratos.save(contrato));
	}

	/** Contratos de todos os agentes, do mais novo ao mais antigo. */
	@Transactional(readOnly = true)
	public List<ContratoResponse> listar() {
		return contratos.findAllByOrderByIdDesc().stream().map(ContratoResponse::de).toList();
	}

	private static void validar(Agente agente, ContratoRequest dados) {
		boolean banco = agente instanceof Banco;
		if (dados.tipo() == TipoContrato.PROPRIEDADE_EMPRESA && !(agente instanceof Empresa)) {
			throw CampoInvalidoException.invalido("tipo", "Só uma empresa fica proprietária pelo contrato.");
		}
		if (dados.tipo() == TipoContrato.PROPRIEDADE_BANCO && !banco) {
			throw CampoInvalidoException.invalido("tipo", "Só um banco fica proprietário pelo contrato.");
		}
		if (dados.tipo() == TipoContrato.PROPRIEDADE_BANCO && dados.credito() == null) {
			throw CampoInvalidoException.invalido("credito", "Contrato com o banco como proprietário exige crédito.");
		}
		if (dados.credito() != null && !banco) {
			throw CampoInvalidoException.invalido("credito", "Só um banco concede crédito.");
		}
	}

	private static Usuario novoProprietario(TipoContrato tipo, PedidoAluguel pedido, Agente agente) {
		return switch (tipo) {
			case PROPRIEDADE_CLIENTE -> pedido.getCliente();
			case PROPRIEDADE_EMPRESA, PROPRIEDADE_BANCO -> agente;
		};
	}

}
