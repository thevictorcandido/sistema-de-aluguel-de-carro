package br.com.aluguelcarros.repository;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.aluguelcarros.model.PedidoAluguel;
import br.com.aluguelcarros.model.StatusPedido;

public interface PedidoAluguelRepository extends JpaRepository<PedidoAluguel, Long> {

	// Listas carregam automóvel, cliente e parecer na mesma consulta, sem uma consulta extra por linha
	@EntityGraph(attributePaths = { "automovel", "cliente", "parecer.agente" })
	List<PedidoAluguel> findByClienteIdOrderByDataCriacaoDesc(Long clienteId);

	@EntityGraph(attributePaths = { "automovel", "cliente", "parecer.agente" })
	List<PedidoAluguel> findAllByOrderByDataCriacaoAsc();

	boolean existsByClienteIdAndStatusIn(Long clienteId, Collection<StatusPedido> status);

	void deleteByClienteId(Long clienteId);

	boolean existsByAutomovelId(Long automovelId);

}
