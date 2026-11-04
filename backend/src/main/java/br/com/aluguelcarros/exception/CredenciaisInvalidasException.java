package br.com.aluguelcarros.exception;

/** Usuário ou senha incorretos. A mensagem não diz qual dos dois errou. */
public class CredenciaisInvalidasException extends RuntimeException {

	public CredenciaisInvalidasException() {
		super("Usuário ou senha incorretos.");
	}

}
