package br.com.aluguelcarros.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/** Pedido como as telas mostram: automóvel, período, valor, cliente e o parecer, quando houver. */
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
		ParecerResponse parecer) {

	public record ClienteResumo(Long id, String nome) {
	}

	public record ParecerResponse(boolean positivo, String justificativa, LocalDateTime data, String agente) {

		static ParecerResponse de(Parecer parecer) {
			return parecer == null ? null
					: new ParecerResponse(parecer.isPositivo(), parecer.getJustificativa(), parecer.getData(),
							parecer.getAgente().getNome());
		}

	}

	public static PedidoResponse de(PedidoAluguel pedido) {
		long diarias = ChronoUnit.DAYS.between(pedido.getDataInicio(), pedido.getDataFim()) + 1;
		return new PedidoResponse(pedido.getId(), pedido.getStatus(), pedido.getDataCriacao(),
				pedido.getDataInicio(), pedido.getDataFim(), diarias, pedido.getValorTotal(),
				AutomovelResponse.de(pedido.getAutomovel()),
				new ClienteResumo(pedido.getCliente().getId(), pedido.getCliente().getNome()),
				ParecerResponse.de(pedido.getParecer()));
	}

}
