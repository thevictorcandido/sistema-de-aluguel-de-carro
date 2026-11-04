package br.com.aluguelcarros.model;

import java.math.BigDecimal;

public record AutomovelResponse(Long id, String placa, String matricula, String marca, String modelo, int ano,
		BigDecimal valorDiaria) {

	public static AutomovelResponse de(Automovel automovel) {
		return new AutomovelResponse(automovel.getId(), automovel.getPlaca(), automovel.getMatricula(),
				automovel.getMarca(), automovel.getModelo(), automovel.getAno(), automovel.getValorDiaria());
	}

}
