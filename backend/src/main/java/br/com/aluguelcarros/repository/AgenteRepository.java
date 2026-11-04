package br.com.aluguelcarros.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.aluguelcarros.model.Agente;

public interface AgenteRepository extends JpaRepository<Agente, Long> {

}
