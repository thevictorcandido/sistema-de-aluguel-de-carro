package br.com.aluguelcarros.model;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Contrato executado: quem executou, quem ficou proprietário do automóvel e o crédito, quando houver. */
public record ContratoResponse(
		Long id,
		TipoContrato tipo,
		LocalDate dataAssinatura,
		Long pedidoId,
		String placa,
		String automovel,
		String cliente,
		String executadoPor,
		String proprietario,
		BigDecimal valorAluguel,
		CreditoResponse credito) {

	public record CreditoResponse(BigDecimal valor, BigDecimal taxaJuros, int parcelas, String banco) {

		static CreditoResponse de(ContratoCredito credito) {
			return credito == null ? null
					: new CreditoResponse(credito.getValor(), credito.getTaxaJuros(), credito.getParcelas(),
							credito.getBanco().getNome());
		}

	}

	public static ContratoResponse de(Contrato contrato) {
		PedidoAluguel pedido = contrato.getPedido();
		Automovel automovel = pedido.getAutomovel();
		return new ContratoResponse(contrato.getId(), contrato.getTipo(), contrato.getDataAssinatura(),
				pedido.getId(), automovel.getPlaca(),
				automovel.getMarca() + " " + automovel.getModelo() + " " + automovel.getAno(),
				pedido.getCliente().getNome(), contrato.getExecutadoPor().getNome(),
				automovel.getProprietario().getNome(), pedido.getValorTotal(),
				CreditoResponse.de(contrato.getCredito()));
	}

}
