package br.com.aluguelcarros.model;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RendimentoRequest(
		@NotBlank(message = "Informe o empregador.") @Size(max = 120, message = "Use até 120 caracteres.")
		String entidadeEmpregadora,

		@NotNull(message = "Informe o valor.")
		@DecimalMin(value = "0.01", message = "O valor precisa ser maior que zero.")
		@Digits(integer = 10, fraction = 2, message = "Use no máximo 2 casas decimais.")
		BigDecimal valor) {
}
