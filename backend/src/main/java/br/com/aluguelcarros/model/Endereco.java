package br.com.aluguelcarros.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class Endereco {

	@Column(nullable = false, length = 120)
	private String logradouro;

	@Column(nullable = false, length = 10)
	private String numero;

	@Column(length = 60)
	private String complemento;

	@Column(nullable = false, length = 60)
	private String bairro;

	@Column(nullable = false, length = 60)
	private String cidade;

	@Column(nullable = false, length = 2)
	private String uf;

	@Column(nullable = false, length = 9)
	private String cep;

	protected Endereco() {
	}

	public Endereco(String logradouro, String numero, String complemento, String bairro, String cidade,
			String uf, String cep) {
		this.logradouro = logradouro;
		this.numero = numero;
		this.complemento = complemento;
		this.bairro = bairro;
		this.cidade = cidade;
		this.uf = uf;
		this.cep = cep;
	}

	public String getLogradouro() {
		return logradouro;
	}

	public String getNumero() {
		return numero;
	}

	public String getComplemento() {
		return complemento;
	}

	public String getBairro() {
		return bairro;
	}

	public String getCidade() {
		return cidade;
	}

	public String getUf() {
		return uf;
	}

	public String getCep() {
		return cep;
	}

}
