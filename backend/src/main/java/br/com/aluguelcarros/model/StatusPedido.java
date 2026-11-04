package br.com.aluguelcarros.model;

public enum StatusPedido {
	ENVIADO,
	EM_ANALISE,
	APROVADO,
	REPROVADO,
	CONTRATADO,
	CANCELADO;

	/** Status em que o cliente ainda pode modificar ou cancelar o pedido. */
	public boolean permiteAlteracao() {
		return this != CONTRATADO && this != CANCELADO;
	}

	/** Status que impedem a exclusão do cliente. */
	public boolean ativo() {
		return this == ENVIADO || this == EM_ANALISE || this == APROVADO;
	}
}
