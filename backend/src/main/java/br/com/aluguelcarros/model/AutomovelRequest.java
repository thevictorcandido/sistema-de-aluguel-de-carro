package br.com.aluguelcarros.model;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Cadastro e edição de automóvel (US13). A placa aceita o padrão Mercosul e o antigo, com ou sem hífen. */
public record AutomovelRequest(
		@NotBlank(message = "Informe a matrícula.") @Size(max = 20, message = "Use até 20 caracteres.")
		String matricula,

		@NotNull(message = "Informe o ano.")
		@Min(value = 1990, message = "Use um ano a partir de 1990.")
		@Max(value = 2100, message = "Use um ano válido.")
		Integer ano,

		@NotBlank(message = "Informe a marca.") @Size(max = 40, message = "Use até 40 caracteres.") String marca,

		@NotBlank(message = "Informe o modelo.") @Size(max = 60, message = "Use até 60 caracteres.") String modelo,

		@NotBlank(message = "Informe a placa.")
		@Pattern(regexp = "(?i)[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}", message = "Use o formato ABC1D23 ou ABC-1234.")
		String placa,

		@NotNull(message = "Informe o valor da diária.")
		@DecimalMin(value = "0.01", message = "O valor precisa ser maior que zero.")
		@Digits(integer = 8, fraction = 2, message = "Use no máximo 2 casas decimais.")
		BigDecimal valorDiaria) {

	/** Placa sem hífen e em maiúsculas, como fica guardada. */
	public String placaNormalizada() {
		return placa.replace("-", "").toUpperCase();
	}

}
