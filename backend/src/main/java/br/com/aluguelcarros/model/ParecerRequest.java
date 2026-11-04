package br.com.aluguelcarros.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ParecerRequest(
		@NotNull(message = "Escolha favorável ou desfavorável.") Boolean positivo,
		@NotBlank(message = "Escreva a justificativa.") @Size(max = 1000, message = "Use até 1000 caracteres.")
		String justificativa) {
}
