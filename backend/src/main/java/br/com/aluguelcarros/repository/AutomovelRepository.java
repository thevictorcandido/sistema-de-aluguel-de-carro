package br.com.aluguelcarros.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.aluguelcarros.model.Automovel;

public interface AutomovelRepository extends JpaRepository<Automovel, Long> {

	List<Automovel> findAllByOrderByMarcaAscModeloAsc();

}
