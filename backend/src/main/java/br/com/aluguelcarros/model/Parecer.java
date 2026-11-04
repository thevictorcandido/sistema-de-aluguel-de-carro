package br.com.aluguelcarros.model;

import java.time.LocalDateTime;

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
@Table(name = "parecer")
public class Parecer {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private boolean positivo;

	@Column(nullable = false, length = 1000)
	private String justificativa;

	@Column(nullable = false)
	private LocalDateTime data;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "agente_id", nullable = false)
	private Agente agente;

	protected Parecer() {
	}

	public Parecer(Agente agente, boolean positivo, String justificativa, LocalDateTime data) {
		this.agente = agente;
		this.positivo = positivo;
		this.justificativa = justificativa;
		this.data = data;
	}

	public Long getId() {
		return id;
	}

	public boolean isPositivo() {
		return positivo;
	}

	public String getJustificativa() {
		return justificativa;
	}

	public LocalDateTime getData() {
		return data;
	}

	public Agente getAgente() {
		return agente;
	}

}
