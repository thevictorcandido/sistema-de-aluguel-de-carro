package br.com.aluguelcarros.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import br.com.aluguelcarros.SessaoTeste;
import br.com.aluguelcarros.application.AluguelCarrosApplication;
import br.com.aluguelcarros.model.Cliente;
import br.com.aluguelcarros.model.PedidoAluguel;
import br.com.aluguelcarros.repository.AutomovelRepository;
import br.com.aluguelcarros.repository.PedidoAluguelRepository;
import br.com.aluguelcarros.repository.UsuarioRepository;

/** Fila e análise do agente (US10). */
@SpringBootTest(classes = AluguelCarrosApplication.class)
@AutoConfigureMockMvc
@Transactional
class AnalisePedidoTest {

	private static final LocalDate HOJE = LocalDate.now(ZoneId.of("America/Sao_Paulo"));

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UsuarioRepository usuarios;

	@Autowired
	private AutomovelRepository automoveis;

	@Autowired
	private PedidoAluguelRepository pedidos;

	/** Onix por 10 diárias: R$ 1.800,00 sobre a renda de R$ 5.500,00 da Marina. */
	private Long pedidoDaMarina() {
		Cliente marina = (Cliente) usuarios.findByLogin("marina").orElseThrow();
		var onix = automoveis.findAll().stream().filter(a -> a.getPlaca().equals("RTA2F41")).findFirst().orElseThrow();
		return pedidos.saveAndFlush(new PedidoAluguel(marina, onix, HOJE.plusDays(7), HOJE.plusDays(16),
				LocalDateTime.now())).getId();
	}

	private ResultActions abrir(String login, Long id) throws Exception {
		return mockMvc.perform(post("/api/pedidos/" + id + "/analise").cookie(SessaoTeste.sessao(mockMvc, login)));
	}

	private ResultActions parecer(String login, Long id, String json) throws Exception {
		return mockMvc.perform(post("/api/pedidos/" + id + "/parecer").cookie(SessaoTeste.sessao(mockMvc, login))
				.contentType(MediaType.APPLICATION_JSON).content(json));
	}

	@Test
	void agenteVeAFichaComRendaComprometida() throws Exception {
		Long id = pedidoDaMarina();

		mockMvc.perform(get("/api/pedidos/" + id).cookie(SessaoTeste.sessao(mockMvc, "horizonte")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.ficha.cpf").value("123.456.789-09"))
				.andExpect(jsonPath("$.ficha.rendimentos.length()").value(2))
				.andExpect(jsonPath("$.ficha.rendaMensal").value(5500.00))
				.andExpect(jsonPath("$.ficha.rendaComprometida").value(32.7))
				.andExpect(jsonPath("$.ficha.referencia").value(30));
	}

	@Test
	void clienteNaoRecebeAFicha() throws Exception {
		Long id = pedidoDaMarina();

		mockMvc.perform(get("/api/pedidos/" + id).cookie(SessaoTeste.sessao(mockMvc, "marina")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.ficha").doesNotExist());
	}

	@Test
	void abrirAnalisePassaParaEmAnaliseSoUmaVez() throws Exception {
		Long id = pedidoDaMarina();

		abrir("rotasul", id).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("EM_ANALISE"));
		abrir("horizonte", id).andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensagem").value("Só um pedido aguardando análise pode entrar em análise."));
	}

	@Test
	void parecerFavoravelAprovaEGuardaAgenteEJustificativa() throws Exception {
		Long id = pedidoDaMarina();
		abrir("horizonte", id);

		parecer("horizonte", id, "{\"positivo\":true,\"justificativa\":\"  Renda estável em dois vínculos.  \"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("APROVADO"))
				.andExpect(jsonPath("$.parecer.agente").value("Banco Horizonte"))
				.andExpect(jsonPath("$.parecer.justificativa").value("Renda estável em dois vínculos."))
				.andExpect(jsonPath("$.parecer.data").isNotEmpty());
	}

	@Test
	void parecerDesfavoravelReprova() throws Exception {
		Long id = pedidoDaMarina();
		abrir("rotasul", id);

		parecer("rotasul", id, "{\"positivo\":false,\"justificativa\":\"Renda insuficiente.\"}")
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("REPROVADO"))
				.andExpect(jsonPath("$.parecer.agente").value("Locadora Rota Sul"));
	}

	@Test
	void parecerSemAbrirAnaliseResponde409() throws Exception {
		Long id = pedidoDaMarina();

		parecer("horizonte", id, "{\"positivo\":true,\"justificativa\":\"Ok.\"}")
				.andExpect(status().isConflict());
	}

	@Test
	void parecerExigeResultadoEJustificativa() throws Exception {
		Long id = pedidoDaMarina();
		abrir("horizonte", id);

		parecer("horizonte", id, "{\"justificativa\":\"   \"}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.positivo").value("Escolha favorável ou desfavorável."))
				.andExpect(jsonPath("$.campos.justificativa").value("Escreva a justificativa."));
	}

	@Test
	void clienteNaoAnalisaNemDaParecer() throws Exception {
		Long id = pedidoDaMarina();

		abrir("marina", id).andExpect(status().isForbidden());
		parecer("marina", id, "{\"positivo\":true,\"justificativa\":\"Eu mesma aprovo.\"}")
				.andExpect(status().isForbidden());
	}

	@Test
	void filaDoAgenteVemDoMaisAntigoParaOMaisNovo() throws Exception {
		Long primeiro = pedidoDaMarina();
		Long segundo = pedidoDaMarina();

		mockMvc.perform(get("/api/pedidos").cookie(SessaoTeste.sessao(mockMvc, "vialeste")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].id").value(primeiro))
				.andExpect(jsonPath("$[1].id").value(segundo));
	}

}
