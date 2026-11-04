package br.com.aluguelcarros.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuario")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Usuario {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 60)
	private String login;

	@Column(name = "senha_hash", nullable = false, length = 100)
	private String senhaHash;

	protected Usuario() {
	}

	protected Usuario(String login, String senhaHash) {
		this.login = login;
		this.senhaHash = senhaHash;
	}

	public abstract Perfil getPerfil();

	/** Nome mostrado nas telas: o do cliente ou o da empresa ou banco. */
	public abstract String getNome();

	public Long getId() {
		return id;
	}

	public String getLogin() {
		return login;
	}

	public String getSenhaHash() {
		return senhaHash;
	}

	public void setSenhaHash(String senhaHash) {
		this.senhaHash = senhaHash;
	}

}
