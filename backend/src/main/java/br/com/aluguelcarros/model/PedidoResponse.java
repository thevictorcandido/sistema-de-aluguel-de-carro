package br.com.aluguelcarros.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Pedido como as telas mostram: automóvel, período, valor, cliente e o parecer, quando houver. Para o agente, inclui
 * a ficha financeira do cliente usada na análise (US10).
 */
public record PedidoResponse(
		Long id,
		StatusPedido status,
		LocalDateTime dataCriacao,
		LocalDate dataInicio,
		LocalDate dataFim,
		long diarias,
		BigDecimal valorTotal,
		AutomovelResponse automovel,
		ClienteResumo cliente,
		ParecerResponse parecer,
		FichaFinanceira ficha,
		ContratoResponse contrato) {

	/** Referência da renda comprometida mostrada ao agente. Só informa: o sistema não aprova nem reprova sozinho. */
	public static final BigDecimal REFERENCIA_RENDA_COMPROMETIDA = new BigDecimal("30");

	public record ClienteResumo(Long id, String nome) {
	}

	public record ParecerResponse(boolean positivo, String justificativa, LocalDateTime data, String agente) {

		static ParecerResponse de(Parecer parecer) {
			return parecer == null ? null
					: new ParecerResponse(parecer.isPositivo(), parecer.getJustificativa(), parecer.getData(),
							parecer.getAgente().getNome());
		}

	}

	/** Dados do cliente que o agente usa para dar o parecer. */
	public record FichaFinanceira(
			String cpf,
			String rg,
			String profissao,
			Endereco endereco,
			List<RendimentoResponse> rendimentos,
			BigDecimal rendaMensal,
			BigDecimal rendaComprometida,
			BigDecimal referencia) {

		static FichaFinanceira de(Cliente cliente, BigDecimal valorTotal) {
			BigDecimal renda = cliente.getRendaMensal();
			BigDecimal comprometida = renda.signum() == 0 ? null
					: valorTotal.multiply(BigDecimal.valueOf(100)).divide(renda, 1, RoundingMode.HALF_UP);
			return new FichaFinanceira(cliente.getCpf(), cliente.getRg(), cliente.getProfissao(),
					cliente.getEndereco(), cliente.getRendimentos().stream().map(RendimentoResponse::de).toList(),
					renda, comprometida, REFERENCIA_RENDA_COMPROMETIDA);
		}

	}

	/** Visão do cliente e das listas: sem a ficha financeira nem o contrato. */
	public static PedidoResponse de(PedidoAluguel pedido) {
		return montar(pedido, null, null);
	}

	/** Detalhe para o cliente: com o contrato, quando houver. */
	public static PedidoResponse de(PedidoAluguel pedido, Contrato contrato) {
		return montar(pedido, null, contrato == null ? null : ContratoResponse.de(contrato));
	}

	/** Detalhe para o agente: com a ficha financeira do cliente e o contrato, quando houver. */
	public static PedidoResponse paraAgente(PedidoAluguel pedido, Contrato contrato) {
		return montar(pedido, FichaFinanceira.de(pedido.getCliente(), pedido.getValorTotal()),
				contrato == null ? null : ContratoResponse.de(contrato));
	}

	private static PedidoResponse montar(PedidoAluguel pedido, FichaFinanceira ficha, ContratoResponse contrato) {
		long diarias = ChronoUnit.DAYS.between(pedido.getDataInicio(), pedido.getDataFim()) + 1;
		return new PedidoResponse(pedido.getId(), pedido.getStatus(), pedido.getDataCriacao(),
				pedido.getDataInicio(), pedido.getDataFim(), diarias, pedido.getValorTotal(),
				AutomovelResponse.de(pedido.getAutomovel()),
				new ClienteResumo(pedido.getCliente().getId(), pedido.getCliente().getNome()),
				ParecerResponse.de(pedido.getParecer()), ficha, contrato);
	}

}
