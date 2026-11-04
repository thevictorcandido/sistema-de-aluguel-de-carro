package br.com.aluguelcarros.model;

import java.math.BigDecimal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/** Execução do contrato (US11). O crédito é opcional, e só um banco o concede (US12). */
public record ContratoRequest(
		@NotNull(message = "Escolha quem fica proprietário do automóvel.") TipoContrato tipo,
		@Valid CreditoRequest credito) {

	public record CreditoRequest(
			@NotNull(message = "Informe o valor do crédito.")
			@DecimalMin(value = "0.01", message = "O valor precisa ser maior que zero.")
			@Digits(integer = 10, fraction = 2, message = "Use no máximo 2 casas decimais.")
			BigDecimal valor,

			@NotNull(message = "Informe a taxa de juros.")
			@DecimalMin(value = "0", message = "A taxa não pode ser negativa.")
			@DecimalMax(value = "100", message = "Use uma taxa de até 100% ao mês.")
			@Digits(integer = 3, fraction = 2, message = "Use no máximo 2 casas decimais.")
			BigDecimal taxaJuros,

			@NotNull(message = "Informe as parcelas.")
			@Min(value = 1, message = "Use de 1 a 60 parcelas.")
			@Max(value = 60, message = "Use de 1 a 60 parcelas.")
			Integer parcelas) {
	}

}
