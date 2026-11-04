package br.com.aluguelcarros.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.aluguelcarros.model.Automovel;

public interface AutomovelRepository extends JpaRepository<Automovel, Long> {

	List<Automovel> findAllByOrderByMarcaAscModeloAsc();

	boolean existsByPlaca(String placa);

	boolean existsByPlacaAndIdNot(String placa, Long id);

	boolean existsByMatricula(String matricula);

	boolean existsByMatriculaAndIdNot(String matricula, Long id);

}
