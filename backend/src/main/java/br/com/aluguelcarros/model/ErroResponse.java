package br.com.aluguelcarros.model;

import java.util.Map;

/** Formato de erro da API: uma mensagem geral e, quando houver, o erro de cada campo. */
public record ErroResponse(String mensagem, Map<String, String> campos) {

	public ErroResponse(String mensagem) {
		this(mensagem, Map.of());
	}

}
