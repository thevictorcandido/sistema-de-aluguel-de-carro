package br.com.aluguelcarros.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.EnumSet;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import br.com.aluguelcarros.exception.RegraNegocioException;

class PedidoAluguelTest {

	private static final LocalDate INICIO = LocalDate.of(2026, 11, 10);
	private static final LocalDate FIM = LocalDate.of(2026, 11, 19);

	private final Empresa empresa = new Empresa("rotasul", "hash", "Locadora Rota Sul", "11.222.333/0001-81");
	private final Automovel onix = new Automovel("01234567801", 2024, "Chevrolet", "Onix", "RTA2F41",
			new BigDecimal("180.00"), empresa);
	private final Automovel hb20 = new Automovel("01234567802", 2023, "Hyundai", "HB20", "QPE7C02",
			new BigDecimal("160.00"), empresa);
	private final Cliente cliente = new Cliente("marina", "hash", "MG-12.345.678", "123.456.789-09", "Marina Costa",
			"Enfermeira", null);

	private PedidoAluguel novoPedido() {
		return new PedidoAluguel(cliente, onix, INICIO, FIM, LocalDateTime.of(2026, 10, 31, 9, 0));
	}

	private PedidoAluguel pedidoEm(StatusPedido status) {
		PedidoAluguel pedido = novoPedido();
		switch (status) {
			case ENVIADO -> {
			}
			case EM_ANALISE -> pedido.iniciarAnalise();
			case APROVADO, REPROVADO, CONTRATADO -> {
				pedido.iniciarAnalise();
				pedido.registrarParecer(parecer(status != StatusPedido.REPROVADO));
				if (status == StatusPedido.CONTRATADO) {
					pedido.contratar();
				}
			}
			case CANCELADO -> pedido.cancelar();
		}
		assertThat(pedido.getStatus()).isEqualTo(status);
		return pedido;
	}

	private Parecer parecer(boolean positivo) {
		return new Parecer(empresa, positivo, "Renda compatível.", LocalDateTime.of(2026, 11, 3, 10, 0));
	}

	@Test
	void pedidoNasceEnviado() {
		assertThat(novoPedido().getStatus()).isEqualTo(StatusPedido.ENVIADO);
	}

	@Test
	void recusaFimAntesDoInicio() {
		assertThatThrownBy(() -> new PedidoAluguel(cliente, onix, FIM, INICIO, LocalDateTime.now()))
				.isInstanceOf(RegraNegocioException.class);
	}

	@Test
	void aceitaInicioEFimNoMesmoDia() {
		PedidoAluguel pedido = new PedidoAluguel(cliente, onix, INICIO, INICIO, LocalDateTime.now());
		assertThat(pedido.getValorTotal()).isEqualByComparingTo("180.00");
	}

	@Test
	void valorTotalContaInicioEFim() {
		// 10/11 a 19/11 são 10 diárias de R$ 180,00
		assertThat(novoPedido().getValorTotal()).isEqualByComparingTo("1800.00");
	}

	@Test
	void analiseFavoravelAprova() {
		PedidoAluguel pedido = pedidoEm(StatusPedido.EM_ANALISE);
		pedido.registrarParecer(parecer(true));
		assertThat(pedido.getStatus()).isEqualTo(StatusPedido.APROVADO);
		assertThat(pedido.getParecer()).isNotNull();
	}

	@Test
	void analiseDesfavoravelReprova() {
		PedidoAluguel pedido = pedidoEm(StatusPedido.EM_ANALISE);
		pedido.registrarParecer(parecer(false));
		assertThat(pedido.getStatus()).isEqualTo(StatusPedido.REPROVADO);
	}

	@Test
	void aprovadoPodeSerContratado() {
		PedidoAluguel pedido = pedidoEm(StatusPedido.APROVADO);
		pedido.contratar();
		assertThat(pedido.getStatus()).isEqualTo(StatusPedido.CONTRATADO);
	}

	@ParameterizedTest
	@EnumSource(value = StatusPedido.class, names = { "EM_ANALISE", "APROVADO", "REPROVADO", "CONTRATADO", "CANCELADO" })
	void soEnviadoEntraEmAnalise(StatusPedido status) {
		assertThatThrownBy(() -> pedidoEm(status).iniciarAnalise()).isInstanceOf(RegraNegocioException.class);
	}

	@ParameterizedTest
	@EnumSource(value = StatusPedido.class, names = { "ENVIADO", "APROVADO", "REPROVADO", "CONTRATADO", "CANCELADO" })
	void parecerSoComPedidoEmAnalise(StatusPedido status) {
		assertThatThrownBy(() -> pedidoEm(status).registrarParecer(parecer(true)))
				.isInstanceOf(RegraNegocioException.class);
	}

	@ParameterizedTest
	@EnumSource(value = StatusPedido.class, names = { "ENVIADO", "EM_ANALISE", "REPROVADO", "CONTRATADO", "CANCELADO" })
	void soAprovadoPodeSerContratado(StatusPedido status) {
		assertThatThrownBy(() -> pedidoEm(status).contratar()).isInstanceOf(RegraNegocioException.class);
	}

	@ParameterizedTest
	@EnumSource(value = StatusPedido.class, names = { "ENVIADO", "EM_ANALISE", "APROVADO", "REPROVADO" })
	void modificarVoltaParaEnviadoEDescartaParecer(StatusPedido status) {
		PedidoAluguel pedido = pedidoEm(status);
		pedido.modificar(hb20, INICIO, INICIO.plusDays(2));
		assertThat(pedido.getStatus()).isEqualTo(StatusPedido.ENVIADO);
		assertThat(pedido.getParecer()).isNull();
		assertThat(pedido.getAutomovel()).isSameAs(hb20);
		assertThat(pedido.getValorTotal()).isEqualByComparingTo("480.00");
	}

	@ParameterizedTest
	@EnumSource(value = StatusPedido.class, names = { "ENVIADO", "EM_ANALISE", "APROVADO", "REPROVADO" })
	void podeCancelarAntesDeContratar(StatusPedido status) {
		PedidoAluguel pedido = pedidoEm(status);
		pedido.cancelar();
		assertThat(pedido.getStatus()).isEqualTo(StatusPedido.CANCELADO);
	}

	@ParameterizedTest
	@EnumSource(value = StatusPedido.class, names = { "CONTRATADO", "CANCELADO" })
	void contratadoOuCanceladoNaoMuda(StatusPedido status) {
		PedidoAluguel pedido = pedidoEm(status);
		assertThatThrownBy(pedido::cancelar).isInstanceOf(RegraNegocioException.class);
		assertThatThrownBy(() -> pedido.modificar(hb20, INICIO, FIM)).isInstanceOf(RegraNegocioException.class);
		assertThat(pedido.getStatus()).isEqualTo(status);
	}

	@Test
	void modificarComPeriodoInvalidoNaoAlteraNada() {
		PedidoAluguel pedido = pedidoEm(StatusPedido.APROVADO);
		assertThatThrownBy(() -> pedido.modificar(hb20, FIM, INICIO)).isInstanceOf(RegraNegocioException.class);
		assertThat(pedido.getStatus()).isEqualTo(StatusPedido.APROVADO);
		assertThat(pedido.getAutomovel()).isSameAs(onix);
	}

	@Test
	void statusAtivosImpedemExclusaoDoCliente() {
		assertThat(EnumSet.allOf(StatusPedido.class).stream().filter(StatusPedido::ativo))
				.containsExactlyInAnyOrder(StatusPedido.ENVIADO, StatusPedido.EM_ANALISE, StatusPedido.APROVADO);
	}

}
