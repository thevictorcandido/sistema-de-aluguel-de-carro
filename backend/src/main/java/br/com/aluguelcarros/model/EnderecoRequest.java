package br.com.aluguelcarros.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EnderecoRequest(
		@NotBlank(message = "Informe a rua.") @Size(max = 120, message = "Use até 120 caracteres.") String logradouro,
		@NotBlank(message = "Informe o número.") @Size(max = 10, message = "Use até 10 caracteres.") String numero,
		@Size(max = 60, message = "Use até 60 caracteres.") String complemento,
		@NotBlank(message = "Informe o bairro.") @Size(max = 60, message = "Use até 60 caracteres.") String bairro,
		@NotBlank(message = "Informe a cidade.") @Size(max = 60, message = "Use até 60 caracteres.") String cidade,
		@NotBlank(message = "Escolha o estado.") @Pattern(regexp = "[A-Z]{2}", message = "Escolha o estado.") String uf,
		@NotBlank(message = "Informe o CEP.") @Pattern(regexp = "\\d{5}-\\d{3}", message = "Use o formato 00000-000.") String cep) {

	public Endereco paraEndereco() {
		String semComplemento = complemento == null || complemento.isBlank() ? null : complemento.trim();
		return new Endereco(logradouro.trim(), numero.trim(), semComplemento, bairro.trim(), cidade.trim(), uf, cep);
	}

}
