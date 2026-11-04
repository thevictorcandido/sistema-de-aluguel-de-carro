package br.com.aluguelcarros.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.aluguelcarros.model.Contrato;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {

	List<Contrato> findAllByOrderByIdDesc();

	Optional<Contrato> findByPedidoId(Long pedidoId);

}
