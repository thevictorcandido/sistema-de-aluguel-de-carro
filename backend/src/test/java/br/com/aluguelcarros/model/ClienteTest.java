package br.com.aluguelcarros.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

import br.com.aluguelcarros.exception.RegraNegocioException;

class ClienteTest {

	private final Cliente cliente = new Cliente("marina", "hash", "MG-12.345.678", "123.456.789-09", "Marina Costa",
			"Enfermeira", null);

	@Test
	void rendaMensalSemRendimentosEZero() {
		assertThat(cliente.getRendaMensal()).isEqualByComparingTo("0");
	}

	@Test
	void rendaMensalSomaOsRendimentos() {
		cliente.adicionarRendimento(new Rendimento("Hospital São Lucas", new BigDecimal("4200.00")));
		cliente.adicionarRendimento(new Rendimento("Clínica Vida Plena", new BigDecimal("1300.00")));
		assertThat(cliente.getRendaMensal()).isEqualByComparingTo("5500.00");
		assertThat(cliente.getRendimentos()).allSatisfy(r -> assertThat(r.getCliente()).isSameAs(cliente));
	}

	@Test
	void recusaQuartoRendimento() {
		for (int i = 1; i <= Cliente.MAXIMO_RENDIMENTOS; i++) {
			cliente.adicionarRendimento(new Rendimento("Empregador " + i, new BigDecimal("1000.00")));
		}
		assertThatThrownBy(() -> cliente.adicionarRendimento(new Rendimento("Quarto", new BigDecimal("1.00"))))
				.isInstanceOf(RegraNegocioException.class);
		assertThat(cliente.getRendimentos()).hasSize(3);
	}

	@Test
	void removerAbreEspacoParaOutroRendimento() {
		for (int i = 1; i <= Cliente.MAXIMO_RENDIMENTOS; i++) {
			cliente.adicionarRendimento(new Rendimento("Empregador " + i, new BigDecimal("1000.00")));
		}
		cliente.removerRendimento(cliente.getRendimentos().getFirst());
		cliente.adicionarRendimento(new Rendimento("Novo", new BigDecimal("500.00")));
		assertThat(cliente.getRendaMensal()).isEqualByComparingTo("2500.00");
	}

}
