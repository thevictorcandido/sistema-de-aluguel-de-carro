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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "contrato_credito")
public class ContratoCredito {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal valor;

	/** Taxa de juros ao mês, em porcentagem. */
	@Column(name = "taxa_juros", nullable = false, precision = 5, scale = 2)
	private BigDecimal taxaJuros;

	@Column(nullable = false)
	private int parcelas;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "contrato_id", nullable = false, unique = true)
	private Contrato contrato;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "banco_id", nullable = false)
	private Banco banco;

	protected ContratoCredito() {
	}

	ContratoCredito(Banco banco, BigDecimal valor, BigDecimal taxaJuros, int parcelas) {
		this.banco = banco;
		this.valor = valor;
		this.taxaJuros = taxaJuros;
		this.parcelas = parcelas;
	}

	void setContrato(Contrato contrato) {
		this.contrato = contrato;
	}

	public Long getId() {
		return id;
	}

	public BigDecimal getValor() {
		return valor;
	}

	public BigDecimal getTaxaJuros() {
		return taxaJuros;
	}

	public int getParcelas() {
		return parcelas;
	}

	public Contrato getContrato() {
		return contrato;
	}

	public Banco getBanco() {
		return banco;
	}

}
