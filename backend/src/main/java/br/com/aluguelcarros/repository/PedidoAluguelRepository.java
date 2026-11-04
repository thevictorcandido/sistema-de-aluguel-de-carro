package br.com.aluguelcarros.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.aluguelcarros.model.PedidoAluguel;

public interface PedidoAluguelRepository extends JpaRepository<PedidoAluguel, Long> {

	List<PedidoAluguel> findByClienteIdOrderByDataCriacaoDesc(Long clienteId);

}
