package br.com.aluguelcarros.model;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CadastroClienteRequest(
		@NotBlank(message = "Escolha um usuário.")
		@Pattern(regexp = "[a-zA-Z0-9._-]{3,60}", message = "Use de 3 a 60 letras, números, ponto, hífen ou sublinhado.")
		String login,

		@NotBlank(message = "Escolha uma senha.")
		@Size(min = 8, max = 72, message = "A senha precisa ter de 8 a 72 caracteres.")
		String senha,

		@NotBlank(message = "Informe o nome.") @Size(max = 120, message = "Use até 120 caracteres.") String nome,

		@NotBlank(message = "Informe o CPF.")
		@Pattern(regexp = "\\d{3}\\.\\d{3}\\.\\d{3}-\\d{2}", message = "Use o formato 000.000.000-00.")
		String cpf,

		@NotBlank(message = "Informe o RG.") @Size(max = 20, message = "Use até 20 caracteres.") String rg,

		@NotBlank(message = "Informe a profissão.") @Size(max = 80, message = "Use até 80 caracteres.") String profissao,

		@NotNull(message = "Informe o endereço.") @Valid EnderecoRequest endereco) {
}
