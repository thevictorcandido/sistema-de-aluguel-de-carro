package br.com.aluguelcarros.model;

import java.math.BigDecimal;
import java.util.List;

/** Tudo o que a tela Meus dados mostra, inclusive se a conta pode ser excluída e por quê. */
public record ClienteResponse(
		Long id,
		String login,
		String nome,
		String cpf,
		String rg,
		String profissao,
		Endereco endereco,
		List<RendimentoResponse> rendimentos,
		BigDecimal rendaMensal,
		int maximoRendimentos,
		Exclusao exclusao) {

	/** Se a conta pode ser excluída agora; quando não pode, o motivo escrito para a pessoa. */
	public record Exclusao(boolean permitida, String motivo) {

		public static Exclusao liberada() {
			return new Exclusao(true, null);
		}

		public static Exclusao bloqueada(String motivo) {
			return new Exclusao(false, motivo);
		}

	}

	public static ClienteResponse de(Cliente cliente, Exclusao exclusao) {
		return new ClienteResponse(cliente.getId(), cliente.getLogin(), cliente.getNome(), cliente.getCpf(),
				cliente.getRg(), cliente.getProfissao(), cliente.getEndereco(),
				cliente.getRendimentos().stream().map(RendimentoResponse::de).toList(), cliente.getRendaMensal(),
				Cliente.MAXIMO_RENDIMENTOS, exclusao);
	}

}
