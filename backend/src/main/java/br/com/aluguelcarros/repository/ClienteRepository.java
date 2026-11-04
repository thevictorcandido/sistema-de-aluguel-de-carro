package br.com.aluguelcarros.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.aluguelcarros.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

	boolean existsByCpf(String cpf);

	boolean existsByRg(String rg);

	boolean existsByCpfAndIdNot(String cpf, Long id);

	boolean existsByRgAndIdNot(String rg, Long id);

}
