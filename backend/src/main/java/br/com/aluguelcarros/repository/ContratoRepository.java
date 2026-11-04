package br.com.aluguelcarros.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.aluguelcarros.model.Contrato;

public interface ContratoRepository extends JpaRepository<Contrato, Long> {

}
