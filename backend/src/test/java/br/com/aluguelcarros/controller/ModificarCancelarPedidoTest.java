package br.com.aluguelcarros.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import br.com.aluguelcarros.SessaoTeste;
import br.com.aluguelcarros.application.AluguelCarrosApplication;
import br.com.aluguelcarros.model.Automovel;
import br.com.aluguelcarros.model.Cliente;
import br.com.aluguelcarros.model.Empresa;
import br.com.aluguelcarros.model.Parecer;
import br.com.aluguelcarros.model.PedidoAluguel;
import br.com.aluguelcarros.model.StatusPedido;
import br.com.aluguelcarros.repository.AutomovelRepository;
import br.com.aluguelcarros.repository.PedidoAluguelRepository;
import br.com.aluguelcarros.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;

/** Modificar e cancelar pela API (US07, US08 e US09), com as linhas da tabela de ciclo da SPEC. */
@SpringBootTest(classes = AluguelCarrosApplication.class)
@AutoConfigureMockMvc
@Transactional
class ModificarCancelarPedidoTest {

	private static final LocalDate HOJE = LocalDate.now(ZoneId.of("America/Sao_Paulo"));

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UsuarioRepository usuarios;

	@Autowired
	private AutomovelRepository automoveis;

	@Autowired
	private PedidoAluguelRepository pedidos;

	@Autowired
	private EntityManager em;

	private Automovel carro(String placa) {
		return automoveis.findAll().stream().filter(a -> a.getPlaca().equals(placa)).findFirst().orElseThrow();
	}

	/** Pedido da Marina já no status pedido, montado pelo próprio modelo. */
	private PedidoAluguel pedidoDaMarinaEm(StatusPedido status) {
		Cliente marina = (Cliente) usuarios.findByLogin("marina").orElseThrow();
		Empresa empresa = (Empresa) usuarios.findByLogin("rotasul").orElseThrow();
		PedidoAluguel pedido = new PedidoAluguel(marina, carro("RTA2F41"), HOJE.plusDays(7), HOJE.plusDays(16),
				LocalDateTime.now());
		switch (status) {
			case ENVIADO -> {
			}
			case EM_ANALISE -> pedido.iniciarAnalise();
			case APROVADO, REPROVADO, CONTRATADO -> {
				pedido.iniciarAnalise();
				pedido.registrarParecer(new Parecer(empresa, status != StatusPedido.REPROVADO, "Parecer de teste.",
						LocalDateTime.now()));
				if (status == StatusPedido.CONTRATADO) {
					pedido.contratar();
				}
			}
			case CANCELADO -> pedido.cancelar();
		}
		pedidos.saveAndFlush(pedido);
		return pedido;
	}

	private ResultActions modificar(String login, Long pedidoId, String placa) throws Exception {
		String json = "{\"automovelId\":" + carro(placa).getId() + ",\"dataInicio\":\"" + HOJE.plusDays(3)
				+ "\",\"dataFim\":\"" + HOJE.plusDays(5) + "\"}";
		return mockMvc.perform(put("/api/pedidos/" + pedidoId).cookie(SessaoTeste.sessao(mockMvc, login))
				.contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private ResultActions cancelar(String login, Long pedidoId) throws Exception {
		return mockMvc.perform(post("/api/pedidos/" + pedidoId + "/cancelar").cookie(SessaoTeste.sessao(mockMvc, login)));
	}

	@ParameterizedTest
	@EnumSource(value = StatusPedido.class, names = { "ENVIADO", "EM_ANALISE", "APROVADO", "REPROVADO" })
	void clienteModificaEPedidoVoltaParaEnviadoSemParecer(StatusPedido status) throws Exception {
		PedidoAluguel pedido = pedidoDaMarinaEm(status);
		Long parecerId = pedido.getParecer() == null ? null : pedido.getParecer().getId();

		modificar("marina", pedido.getId(), "QPE7C02")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("ENVIADO"))
				.andExpect(jsonPath("$.automovel.placa").value("QPE7C02"))
				.andExpect(jsonPath("$.diarias").value(3))
				.andExpect(jsonPath("$.valorTotal").value(480.00))
				.andExpect(jsonPath("$.parecer").doesNotExist());

		em.flush();
		if (parecerId != null) {
			assertThat(em.find(Parecer.class, parecerId)).as("parecer descartado").isNull();
		}
	}

	@ParameterizedTest
	@EnumSource(value = StatusPedido.class, names = { "CONTRATADO", "CANCELADO" })
	void contratadoOuCanceladoNaoMuda(StatusPedido status) throws Exception {
		PedidoAluguel pedido = pedidoDaMarinaEm(status);

		modificar("marina", pedido.getId(), "QPE7C02").andExpect(status().isConflict());
		cancelar("marina", pedido.getId()).andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensagem").value("Um pedido " + status.name().toLowerCase()
						+ " não pode ser cancelado."));
	}

	@ParameterizedTest
	@EnumSource(value = StatusPedido.class, names = { "ENVIADO", "EM_ANALISE", "APROVADO", "REPROVADO" })
	void clienteCancelaAntesDeContratar(StatusPedido status) throws Exception {
		PedidoAluguel pedido = pedidoDaMarinaEm(status);

		cancelar("marina", pedido.getId())
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("CANCELADO"));
	}

	@Test
	void agenteModificaMasNaoCancela() throws Exception {
		PedidoAluguel pedido = pedidoDaMarinaEm(StatusPedido.EM_ANALISE);

		modificar("horizonte", pedido.getId(), "SBC4H19")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("ENVIADO"));
		cancelar("horizonte", pedido.getId()).andExpect(status().isForbidden());
	}

	@Test
	void outroClienteNaoEncontraOPedido() throws Exception {
		PedidoAluguel pedido = pedidoDaMarinaEm(StatusPedido.ENVIADO);

		modificar("joao", pedido.getId(), "QPE7C02").andExpect(status().isNotFound());
		cancelar("joao", pedido.getId()).andExpect(status().isNotFound());
	}

	@Test
	void modificarValidaAsDatasComoNaCriacao() throws Exception {
		PedidoAluguel pedido = pedidoDaMarinaEm(StatusPedido.ENVIADO);
		String json = "{\"automovelId\":" + carro("RTA2F41").getId() + ",\"dataInicio\":\"" + HOJE.minusDays(1)
				+ "\",\"dataFim\":\"" + HOJE.plusDays(1) + "\"}";

		mockMvc.perform(put("/api/pedidos/" + pedido.getId()).cookie(SessaoTeste.sessao(mockMvc, "marina"))
				.contentType(MediaType.APPLICATION_JSON).content(json))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.dataInicio").value("O início precisa ser hoje ou depois."));
	}

}
