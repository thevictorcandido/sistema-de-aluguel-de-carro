package br.com.aluguelcarros.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import br.com.aluguelcarros.model.Contrato;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {

	@EntityGraph(attributePaths = { "pedido.automovel.proprietario", "pedido.cliente", "executadoPor", "credito.banco" })
	List<Contrato> findAllByOrderByIdDesc();

	Optional<Contrato> findByPedidoId(Long pedidoId);

}
