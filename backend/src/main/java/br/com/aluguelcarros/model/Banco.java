package br.com.aluguelcarros.model;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "banco")
public class Banco extends Agente {

	protected Banco() {
	}

	public Banco(String login, String senhaHash, String nome, String cnpj) {
		super(login, senhaHash, nome, cnpj);
	}

	@Override
	public Perfil getPerfil() {
		return Perfil.BANCO;
	}

	public ContratoCredito concederCredito(Contrato contrato, BigDecimal valor, BigDecimal taxaJuros, int parcelas) {
		ContratoCredito credito = new ContratoCredito(this, valor, taxaJuros, parcelas);
		contrato.associarCredito(credito);
		return credito;
	}

}
