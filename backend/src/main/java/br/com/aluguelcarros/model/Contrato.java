package br.com.aluguelcarros.model;

import java.time.LocalDate;

import br.com.aluguelcarros.exception.RegraNegocioException;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "contrato")
public class Contrato {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private TipoContrato tipo;

	@Column(name = "data_assinatura", nullable = false)
	private LocalDate dataAssinatura;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "pedido_id", nullable = false, unique = true)
	private PedidoAluguel pedido;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "agente_id", nullable = false)
	private Agente executadoPor;

	@OneToOne(mappedBy = "contrato", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
	private ContratoCredito credito;

	protected Contrato() {
	}

	public Contrato(PedidoAluguel pedido, Agente executadoPor, TipoContrato tipo, LocalDate dataAssinatura) {
		this.pedido = pedido;
		this.executadoPor = executadoPor;
		this.tipo = tipo;
		this.dataAssinatura = dataAssinatura;
	}

	void associarCredito(ContratoCredito credito) {
		if (this.credito != null) {
			throw new RegraNegocioException("Este contrato já tem um contrato de crédito.");
		}
		credito.setContrato(this);
		this.credito = credito;
	}

	public Long getId() {
		return id;
	}

	public TipoContrato getTipo() {
		return tipo;
	}

	public LocalDate getDataAssinatura() {
		return dataAssinatura;
	}

	public PedidoAluguel getPedido() {
		return pedido;
	}

	public Agente getExecutadoPor() {
		return executadoPor;
	}

	public ContratoCredito getCredito() {
		return credito;
	}

}
