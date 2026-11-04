package br.com.aluguelcarros.exception;

/** Ação que o estado atual não permite, como cancelar um pedido já contratado. */
public class RegraNegocioException extends RuntimeException {

	public RegraNegocioException(String mensagem) {
		super(mensagem);
	}

}
