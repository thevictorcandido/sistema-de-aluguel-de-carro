package br.com.aluguelcarros.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.aluguelcarros.model.AutomovelResponse;
import br.com.aluguelcarros.repository.AutomovelRepository;

@Service
@Transactional(readOnly = true)
public class AutomovelService {

	private final AutomovelRepository automoveis;

	public AutomovelService(AutomovelRepository automoveis) {
		this.automoveis = automoveis;
	}

	public List<AutomovelResponse> listar() {
		return automoveis.findAllByOrderByMarcaAscModeloAsc().stream().map(AutomovelResponse::de).toList();
	}

}
