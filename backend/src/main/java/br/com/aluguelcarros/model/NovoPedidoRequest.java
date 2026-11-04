package br.com.aluguelcarros.model;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;

public record NovoPedidoRequest(
		@NotNull(message = "Escolha um automóvel.") Long automovelId,
		@NotNull(message = "Informe a data de início.") LocalDate dataInicio,
		@NotNull(message = "Informe a data de fim.") LocalDate dataFim) {
}
