package br.com.aluguelcarros.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
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
import br.com.aluguelcarros.model.Automovel;
import br.com.aluguelcarros.repository.AutomovelRepository;
import jakarta.servlet.http.Cookie;

/** Criar e consultar pedidos (US05 e US06). */
@SpringBootTest(classes = AluguelCarrosApplication.class)
@AutoConfigureMockMvc
@Transactional
class PedidoControllerTest {

	private static final LocalDate HOJE = LocalDate.now(ZoneId.of("America/Sao_Paulo"));

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AutomovelRepository automoveis;

	private Long onix() {
		return automoveis.findAll().stream().filter(a -> a.getPlaca().equals("RTA2F41")).findFirst()
				.map(Automovel::getId).orElseThrow();
	}

	private ResultActions criar(Cookie sessao, Object automovelId, LocalDate inicio, LocalDate fim) throws Exception {
		String json = "{\"automovelId\":" + automovelId + ",\"dataInicio\":\"" + inicio + "\",\"dataFim\":\"" + fim
				+ "\"}";
		return mockMvc.perform(post("/api/pedidos").cookie(sessao).contentType(MediaType.APPLICATION_JSON)
				.content(json));
	}

	private Long criarPedido(Cookie sessao) throws Exception {
		String corpo = criar(sessao, onix(), HOJE.plusDays(7), HOJE.plusDays(16))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
		return Long.valueOf(corpo.replaceAll("^\\{\"id\":(\\d+),.*$", "$1"));
	}

	@Test
	void listaOsAutomoveisParaQuemEstaLogado() throws Exception {
		mockMvc.perform(get("/api/automoveis").cookie(SessaoTeste.sessao(mockMvc, "marina")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(8))
				.andExpect(jsonPath("$[0].marca").value("Chevrolet"))
				.andExpect(jsonPath("$[0].valorDiaria").value(180.00));
	}

	@Test
	void pedidoNasceEnviadoComValorCalculado() throws Exception {
		criar(SessaoTeste.sessao(mockMvc, "marina"), onix(), HOJE.plusDays(7), HOJE.plusDays(16))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.status").value("ENVIADO"))
				.andExpect(jsonPath("$.diarias").value(10))
				.andExpect(jsonPath("$.valorTotal").value(1800.00))
				.andExpect(jsonPath("$.automovel.placa").value("RTA2F41"))
				.andExpect(jsonPath("$.cliente.nome").value("Marina Costa"))
				.andExpect(jsonPath("$.parecer").doesNotExist());
	}

	@Test
	void inicioNoPassadoERecusadoNoCampo() throws Exception {
		criar(SessaoTeste.sessao(mockMvc, "marina"), onix(), HOJE.minusDays(1), HOJE.plusDays(2))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.dataInicio").value("O início precisa ser hoje ou depois."));
	}

	@Test
	void fimAntesDoInicioERecusadoNoCampo() throws Exception {
		criar(SessaoTeste.sessao(mockMvc, "marina"), onix(), HOJE.plusDays(5), HOJE.plusDays(4))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.dataFim").value("O fim não pode ser antes do início."));
	}

	@Test
	void automovelInexistenteERecusadoNoCampo() throws Exception {
		criar(SessaoTeste.sessao(mockMvc, "marina"), 999999, HOJE, HOJE)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.automovelId").value("Este automóvel não existe."));
	}

	@Test
	void camposObrigatorios() throws Exception {
		mockMvc.perform(post("/api/pedidos").cookie(SessaoTeste.sessao(mockMvc, "marina"))
				.contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.automovelId").value("Escolha um automóvel."))
				.andExpect(jsonPath("$.campos.dataInicio").value("Informe a data de início."));
	}

	@Test
	void clienteVeSoOsProprios() throws Exception {
		Cookie marina = SessaoTeste.sessao(mockMvc, "marina");
		Cookie joao = SessaoTeste.sessao(mockMvc, "joao");
		Long daMarina = criarPedido(marina);
		criarPedido(joao);

		mockMvc.perform(get("/api/pedidos").cookie(marina))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(daMarina));
	}

	@Test
	void pedidoDeOutroClienteRespondeNaoEncontrado() throws Exception {
		Long daMarina = criarPedido(SessaoTeste.sessao(mockMvc, "marina"));

		mockMvc.perform(get("/api/pedidos/" + daMarina).cookie(SessaoTeste.sessao(mockMvc, "joao")))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.mensagem").value("Pedido não encontrado."));
	}

	@Test
	void donoEAgenteVeemODetalhe() throws Exception {
		Long daMarina = criarPedido(SessaoTeste.sessao(mockMvc, "marina"));

		mockMvc.perform(get("/api/pedidos/" + daMarina).cookie(SessaoTeste.sessao(mockMvc, "marina")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("ENVIADO"));
		mockMvc.perform(get("/api/pedidos/" + daMarina).cookie(SessaoTeste.sessao(mockMvc, "horizonte")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.cliente.nome").value("Marina Costa"));
	}

	@Test
	void agenteNaoCriaPedido() throws Exception {
		criar(SessaoTeste.sessao(mockMvc, "rotasul"), onix(), HOJE.plusDays(1), HOJE.plusDays(2))
				.andExpect(status().isForbidden());
	}

}
