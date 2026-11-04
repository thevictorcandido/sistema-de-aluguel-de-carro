package br.com.aluguelcarros.exception;

/** Erro de um campo que só o servidor consegue conferir, como CPF já cadastrado. */
public class CampoInvalidoException extends RuntimeException {

	private final String campo;
	private final boolean conflito;

	private CampoInvalidoException(String campo, String mensagem, boolean conflito) {
		super(mensagem);
		this.campo = campo;
		this.conflito = conflito;
	}

	/** O valor é inválido em si, como um CPF com dígito verificador errado. Responde 400. */
	public static CampoInvalidoException invalido(String campo, String mensagem) {
		return new CampoInvalidoException(campo, mensagem, false);
	}

	/** O valor já pertence a outro registro, como um login em uso. Responde 409. */
	public static CampoInvalidoException emUso(String campo, String mensagem) {
		return new CampoInvalidoException(campo, mensagem, true);
	}

	public String getCampo() {
		return campo;
	}

	public boolean isConflito() {
		return conflito;
	}

}
