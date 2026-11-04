package br.com.aluguelcarros.service;

import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.aluguelcarros.exception.CampoInvalidoException;
import br.com.aluguelcarros.exception.RecursoNaoEncontradoException;
import br.com.aluguelcarros.exception.RegraNegocioException;
import br.com.aluguelcarros.model.Agente;
import br.com.aluguelcarros.model.Automovel;
import br.com.aluguelcarros.model.AutomovelRequest;
import br.com.aluguelcarros.model.AutomovelResponse;
import br.com.aluguelcarros.repository.AgenteRepository;
import br.com.aluguelcarros.repository.AutomovelRepository;
import br.com.aluguelcarros.repository.PedidoAluguelRepository;

@Service
public class AutomovelService {

	private final AutomovelRepository automoveis;
	private final AgenteRepository agentes;
	private final PedidoAluguelRepository pedidos;

	public AutomovelService(AutomovelRepository automoveis, AgenteRepository agentes,
			PedidoAluguelRepository pedidos) {
		this.automoveis = automoveis;
		this.agentes = agentes;
		this.pedidos = pedidos;
	}

	@Transactional(readOnly = true)
	public List<AutomovelResponse> listar() {
		return automoveis.findAllByOrderByMarcaAscModeloAsc().stream().map(AutomovelResponse::de).toList();
	}

	/** US13: o agente que cadastra é o proprietário inicial. Matrícula e placa são únicas. */
	@Transactional
	public AutomovelResponse cadastrar(Long agenteId, AutomovelRequest dados) {
		Agente agente = agentes.findById(agenteId)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Agente não encontrado."));
		String placa = dados.placaNormalizada();
		String matricula = dados.matricula().trim();
		exigirUnicos(placa, matricula, null);
		Automovel automovel = new Automovel(matricula, dados.ano(), dados.marca().trim(), dados.modelo().trim(),
				placa, dados.valorDiaria(), agente);
		return AutomovelResponse.de(automoveis.save(automovel));
	}

	/** Só o proprietário atual altera o automóvel. */
	@Transactional
	public AutomovelResponse atualizar(Long agenteId, Long automovelId, AutomovelRequest dados) {
		Automovel automovel = buscarDoProprietario(agenteId, automovelId);
		String placa = dados.placaNormalizada();
		String matricula = dados.matricula().trim();
		exigirUnicos(placa, matricula, automovelId);
		automovel.atualizar(matricula, dados.ano(), dados.marca().trim(), dados.modelo().trim(), placa,
				dados.valorDiaria());
		return AutomovelResponse.de(automovel);
	}

	/** Automóvel que já aparece em algum pedido fica no histórico e não pode ser excluído. */
	@Transactional
	public void excluir(Long agenteId, Long automovelId) {
		Automovel automovel = buscarDoProprietario(agenteId, automovelId);
		if (pedidos.existsByAutomovelId(automovelId)) {
			throw new RegraNegocioException("Este automóvel já aparece em pedidos e não pode ser excluído.");
		}
		automoveis.delete(automovel);
	}

	private Automovel buscarDoProprietario(Long agenteId, Long automovelId) {
		Automovel automovel = automoveis.findById(automovelId)
				.orElseThrow(() -> new RecursoNaoEncontradoException("Automóvel não encontrado."));
		if (!automovel.getProprietario().getId().equals(agenteId)) {
			throw new AccessDeniedException("Só o proprietário altera este automóvel.");
		}
		return automovel;
	}

	private void exigirUnicos(String placa, String matricula, Long ignorarId) {
		boolean placaEmUso = ignorarId == null ? automoveis.existsByPlaca(placa)
				: automoveis.existsByPlacaAndIdNot(placa, ignorarId);
		if (placaEmUso) {
			throw CampoInvalidoException.emUso("placa", "Já existe um automóvel com esta placa.");
		}
		boolean matriculaEmUso = ignorarId == null ? automoveis.existsByMatricula(matricula)
				: automoveis.existsByMatriculaAndIdNot(matricula, ignorarId);
		if (matriculaEmUso) {
			throw CampoInvalidoException.emUso("matricula", "Já existe um automóvel com esta matrícula.");
		}
	}

}
