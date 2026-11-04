package br.com.aluguelcarros.model;

import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "automovel")
public class Automovel {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 20)
	private String matricula;

	@Column(nullable = false)
	private int ano;

	@Column(nullable = false, length = 40)
	private String marca;

	@Column(nullable = false, length = 60)
	private String modelo;

	@Column(nullable = false, unique = true, length = 7)
	private String placa;

	@Column(name = "valor_diaria", nullable = false, precision = 10, scale = 2)
	private BigDecimal valorDiaria;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "proprietario_id", nullable = false)
	private Usuario proprietario;

	protected Automovel() {
	}

	/** Quem cadastra o automóvel é o proprietário inicial. */
	public Automovel(String matricula, int ano, String marca, String modelo, String placa, BigDecimal valorDiaria,
			Usuario proprietario) {
		this.matricula = matricula;
		this.ano = ano;
		this.marca = marca;
		this.modelo = modelo;
		this.placa = placa;
		this.valorDiaria = valorDiaria;
		this.proprietario = proprietario;
	}

	public void registrarProprietario(Usuario novo) {
		this.proprietario = novo;
	}

	public void atualizar(String matricula, int ano, String marca, String modelo, String placa,
			BigDecimal valorDiaria) {
		this.matricula = matricula;
		this.ano = ano;
		this.marca = marca;
		this.modelo = modelo;
		this.placa = placa;
		this.valorDiaria = valorDiaria;
	}

	public Long getId() {
		return id;
	}

	public String getMatricula() {
		return matricula;
	}

	public int getAno() {
		return ano;
	}

	public String getMarca() {
		return marca;
	}

	public String getModelo() {
		return modelo;
	}

	public String getPlaca() {
		return placa;
	}

	public BigDecimal getValorDiaria() {
		return valorDiaria;
	}

	public Usuario getProprietario() {
		return proprietario;
	}

}
