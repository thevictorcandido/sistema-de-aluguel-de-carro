package br.com.aluguelcarros.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Dados que o cliente altera em Meus dados. Usuário e senha não mudam por aqui. */
public record AtualizarClienteRequest(
		@NotBlank(message = "Informe o nome.") @Size(max = 120, message = "Use até 120 caracteres.") String nome,

		@NotBlank(message = "Informe o CPF.")
		@Pattern(regexp = "\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}", message = "Use o formato 000.000.000-00.")
		String cpf,

		@NotBlank(message = "Informe o RG.") @Size(max = 20, message = "Use até 20 caracteres.") String rg,

		@NotBlank(message = "Informe a profissão.") @Size(max = 80, message = "Use até 80 caracteres.") String profissao,

		@NotNull(message = "Informe o endereço.") @Valid EnderecoRequest endereco) {
}
