package br.com.aluguelcarros.model;

import java.math.BigDecimal;

public record RendimentoResponse(Long id, String entidadeEmpregadora, BigDecimal valor) {

	public static RendimentoResponse de(Rendimento rendimento) {
		return new RendimentoResponse(rendimento.getId(), rendimento.getEntidadeEmpregadora(), rendimento.getValor());
	}

}
