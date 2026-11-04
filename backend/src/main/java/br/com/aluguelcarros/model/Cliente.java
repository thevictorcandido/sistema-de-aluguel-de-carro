package br.com.aluguelcarros.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import br.com.aluguelcarros.exception.RegraNegocioException;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "cliente")
public class Cliente extends Usuario {

	public static final int MAXIMO_RENDIMENTOS = 3;

	@Column(nullable = false, unique = true, length = 20)
	private String rg;

	@Column(nullable = false, unique = true, length = 14)
	private String cpf;

	@Column(nullable = false, length = 120)
	private String nome;

	@Column(nullable = false, length = 80)
	private String profissao;

	@Embedded
	private Endereco endereco;

	@OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("id")
	private List<Rendimento> rendimentos = new ArrayList<>();

	protected Cliente() {
	}

	public Cliente(String login, String senhaHash, String rg, String cpf, String nome, String profissao,
			Endereco endereco) {
		super(login, senhaHash);
		this.rg = rg;
		this.cpf = cpf;
		this.nome = nome;
		this.profissao = profissao;
		this.endereco = endereco;
	}

	@Override
	public Perfil getPerfil() {
		return Perfil.CLIENTE;
	}

	public void adicionarRendimento(Rendimento rendimento) {
		if (rendimentos.size() >= MAXIMO_RENDIMENTOS) {
			throw new RegraNegocioException("O cliente pode informar no máximo 3 rendimentos.");
		}
		rendimento.setCliente(this);
		rendimentos.add(rendimento);
	}

	public void removerRendimento(Rendimento rendimento) {
		rendimentos.remove(rendimento);
	}

	/** Soma dos rendimentos informados, usada na análise financeira. */
	public BigDecimal getRendaMensal() {
		return rendimentos.stream().map(Rendimento::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
	}

	public void atualizarDados(String rg, String cpf, String nome, String profissao, Endereco endereco) {
		this.rg = rg;
		this.cpf = cpf;
		this.nome = nome;
		this.profissao = profissao;
		this.endereco = endereco;
	}

	public String getRg() {
		return rg;
	}

	public String getCpf() {
		return cpf;
	}

	@Override
	public String getNome() {
		return nome;
	}

	public String getProfissao() {
		return profissao;
	}

	public Endereco getEndereco() {
		return endereco;
	}

	public List<Rendimento> getRendimentos() {
		return Collections.unmodifiableList(rendimentos);
	}

}
