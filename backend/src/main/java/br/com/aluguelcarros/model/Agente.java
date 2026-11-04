package br.com.aluguelcarros.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

/** Empresa ou banco aderente, que avalia pedidos e executa contratos. */
@Entity
@Table(name = "agente")
public abstract class Agente extends Usuario {

	@Column(nullable = false, length = 120)
	private String nome;

	@Column(nullable = false, unique = true, length = 18)
	private String cnpj;

	protected Agente() {
	}

	protected Agente(String login, String senhaHash, String nome, String cnpj) {
		super(login, senhaHash);
		this.nome = nome;
		this.cnpj = cnpj;
	}

	@Override
	public String getNome() {
		return nome;
	}

	public String getCnpj() {
		return cnpj;
	}

}
