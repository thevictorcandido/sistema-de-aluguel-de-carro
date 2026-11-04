package br.com.aluguelcarros.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Relógio no fuso de Brasília, para "hoje" ser o mesmo dia que a pessoa vê na tela. */
@Configuration
public class RelogioConfig {

	@Bean
	Clock relogio() {
		return Clock.system(ZoneId.of("America/Sao_Paulo"));
	}

}
