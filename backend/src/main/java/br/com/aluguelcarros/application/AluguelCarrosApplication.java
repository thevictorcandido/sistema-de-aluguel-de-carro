package br.com.aluguelcarros.application;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "br.com.aluguelcarros")
@EnableJpaRepositories("br.com.aluguelcarros.repository")
@EntityScan("br.com.aluguelcarros.model")
public class AluguelCarrosApplication {

	public static void main(String[] args) {
		SpringApplication.run(AluguelCarrosApplication.class, args);
	}

}
