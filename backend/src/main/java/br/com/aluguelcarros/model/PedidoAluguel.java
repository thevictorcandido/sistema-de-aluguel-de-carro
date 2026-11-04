package br.com.aluguelcarros.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

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

/** Pedido de aluguel. As transições de status seguem a tabela de ciclo da SPEC. */
@Entity
@Table(name = "pedido_aluguel")
public class PedidoAluguel {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "cliente_id", nullable = false)
	private Cliente cliente;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "automovel_id", nullable = false)
	private Automovel automovel;

	@Column(name = "data_criacao", nullable = false)
	private LocalDateTime dataCriacao;

	@Column(name = "data_inicio", nullable = false)
	private LocalDate dataInicio;

	@Column(name = "data_fim", nullable = false)
	private LocalDate dataFim;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private StatusPedido status;

	@OneToOne(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	@JoinColumn(name = "parecer_id", unique = true)
	private Parecer parecer;

	protected PedidoAluguel() {
	}

	public PedidoAluguel(Cliente cliente, Automovel automovel, LocalDate dataInicio, LocalDate dataFim,
			LocalDateTime dataCriacao) {
		validarPeriodo(dataInicio, dataFim);
		this.cliente = cliente;
		this.automovel = automovel;
		this.dataInicio = dataInicio;
		this.dataFim = dataFim;
		this.dataCriacao = dataCriacao;
		this.status = StatusPedido.ENVIADO;
	}

	/** Troca automóvel ou datas. Um pedido já avaliado volta para ENVIADO e perde o parecer. */
	public void modificar(Automovel automovel, LocalDate inicio, LocalDate fim) {
		exigirAlteravel("modificado");
		validarPeriodo(inicio, fim);
		this.automovel = automovel;
		this.dataInicio = inicio;
		this.dataFim = fim;
		this.parecer = null;
		this.status = StatusPedido.ENVIADO;
	}

	public void iniciarAnalise() {
		exigirStatus(StatusPedido.ENVIADO, "Só um pedido aguardando análise pode entrar em análise.");
		this.status = StatusPedido.EM_ANALISE;
	}

	public void registrarParecer(Parecer parecer) {
		exigirStatus(StatusPedido.EM_ANALISE, "O parecer só pode ser registrado com o pedido em análise.");
		this.parecer = parecer;
		this.status = parecer.isPositivo() ? StatusPedido.APROVADO : StatusPedido.REPROVADO;
	}

	public void cancelar() {
		exigirAlteravel("cancelado");
		this.status = StatusPedido.CANCELADO;
	}

	public void contratar() {
		exigirStatus(StatusPedido.APROVADO, "Só um pedido aprovado pode ser contratado.");
		this.status = StatusPedido.CONTRATADO;
	}

	/** Diárias contando o dia de início e o de fim, vezes o valor da diária do automóvel. */
	public BigDecimal getValorTotal() {
		long diarias = ChronoUnit.DAYS.between(dataInicio, dataFim) + 1;
		return automovel.getValorDiaria().multiply(BigDecimal.valueOf(diarias));
	}

	private static void validarPeriodo(LocalDate inicio, LocalDate fim) {
		if (inicio == null || fim == null) {
			throw new RegraNegocioException("Informe a data de início e a de fim.");
		}
		if (fim.isBefore(inicio)) {
			throw new RegraNegocioException("A data de fim não pode ser anterior à de início.");
		}
	}

	private void exigirAlteravel(String acao) {
		if (!status.permiteAlteracao()) {
			throw new RegraNegocioException("Um pedido " + status.name().toLowerCase() + " não pode ser " + acao + ".");
		}
	}

	private void exigirStatus(StatusPedido esperado, String mensagem) {
		if (status != esperado) {
			throw new RegraNegocioException(mensagem);
		}
	}

	public Long getId() {
		return id;
	}

	public Cliente getCliente() {
		return cliente;
	}

	public Automovel getAutomovel() {
		return automovel;
	}

	public LocalDateTime getDataCriacao() {
		return dataCriacao;
	}

	public LocalDate getDataInicio() {
		return dataInicio;
	}

	public LocalDate getDataFim() {
		return dataFim;
	}

	public StatusPedido getStatus() {
		return status;
	}

	public Parecer getParecer() {
		return parecer;
	}

}
