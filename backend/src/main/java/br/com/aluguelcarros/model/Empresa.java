package br.com.aluguelcarros.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "empresa")
public class Empresa extends Agente {

	protected Empresa() {
	}

	public Empresa(String login, String senhaHash, String nome, String cnpj) {
		super(login, senhaHash, nome, cnpj);
	}

	@Override
	public Perfil getPerfil() {
		return Perfil.EMPRESA;
	}

}
