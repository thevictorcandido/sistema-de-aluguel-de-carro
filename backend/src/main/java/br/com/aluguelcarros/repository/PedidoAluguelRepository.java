package br.com.aluguelcarros.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.aluguelcarros.model.PedidoAluguel;
import br.com.aluguelcarros.model.StatusPedido;

public interface PedidoAluguelRepository extends JpaRepository<PedidoAluguel, Long> {

	List<PedidoAluguel> findByClienteIdOrderByDataCriacaoDesc(Long clienteId);

	List<PedidoAluguel> findAllByOrderByDataCriacaoAsc();

	boolean existsByClienteIdAndStatusIn(Long clienteId, Collection<StatusPedido> status);

	void deleteByClienteId(Long clienteId);

}
