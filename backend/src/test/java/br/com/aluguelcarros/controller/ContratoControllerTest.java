package br.com.aluguelcarros.controller;

import static org.assertj.core.api.Assertions.assertThat;
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
import br.com.aluguelcarros.model.Automovel;
import br.com.aluguelcarros.model.Cliente;
import br.com.aluguelcarros.model.Empresa;
import br.com.aluguelcarros.model.Parecer;
import br.com.aluguelcarros.model.PedidoAluguel;
import br.com.aluguelcarros.repository.AutomovelRepository;
import br.com.aluguelcarros.repository.PedidoAluguelRepository;
import br.com.aluguelcarros.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;

/** Executar contrato e conceder crédito (US11 e US12). */
@SpringBootTest(classes = AluguelCarrosApplication.class)
@AutoConfigureMockMvc
@Transactional
class ContratoControllerTest {

	private static final LocalDate HOJE = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
	private static final String CREDITO = "{\"valor\":1800.00,\"taxaJuros\":1.20,\"parcelas\":6}";

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

	private Automovel onix() {
		return automoveis.findAll().stream().filter(a -> a.getPlaca().equals("RTA2F41")).findFirst().orElseThrow();
	}

	/** Pedido da Marina já aprovado (ou só enviado, quando aprovado = false). */
	private Long pedidoDaMarina(boolean aprovado) {
		Cliente marina = (Cliente) usuarios.findByLogin("marina").orElseThrow();
		Empresa empresa = (Empresa) usuarios.findByLogin("rotasul").orElseThrow();
		PedidoAluguel pedido = new PedidoAluguel(marina, onix(), HOJE.plusDays(7), HOJE.plusDays(16),
				LocalDateTime.now());
		if (aprovado) {
			pedido.iniciarAnalise();
			pedido.registrarParecer(new Parecer(empresa, true, "Renda compatível.", LocalDateTime.now()));
		}
		Long id = pedidos.saveAndFlush(pedido).getId();
		em.clear();
		return id;
	}

	private ResultActions executar(String login, Long pedidoId, String tipo, String credito) throws Exception {
		String json = "{\"tipo\":\"" + tipo + "\"" + (credito == null ? "" : ",\"credito\":" + credito) + "}";
		return mockMvc.perform(post("/api/pedidos/" + pedidoId + "/contrato")
				.cookie(SessaoTeste.sessao(mockMvc, login))
				.contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private String proprietarioDoOnix() {
		em.flush();
		em.clear();
		return onix().getProprietario().getNome();
	}

	@Test
	void empresaFicaProprietariaEPedidoViraContratado() throws Exception {
		Long id = pedidoDaMarina(true);

		executar("rotasul", id, "PROPRIEDADE_EMPRESA", null)
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.executadoPor").value("Locadora Rota Sul"))
				.andExpect(jsonPath("$.proprietario").value("Locadora Rota Sul"))
				.andExpect(jsonPath("$.dataAssinatura").value(HOJE.toString()))
				.andExpect(jsonPath("$.credito").doesNotExist());

		assertThat(pedidos.findById(id).orElseThrow().getStatus().name()).isEqualTo("CONTRATADO");
	}

	@Test
	void contratoDePropriedadeDoClienteTransfereOAutomovelParaEle() throws Exception {
		Long id = pedidoDaMarina(true);

		executar("vialeste", id, "PROPRIEDADE_CLIENTE", null)
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.proprietario").value("Marina Costa"));

		assertThat(proprietarioDoOnix()).isEqualTo("Marina Costa");
	}

	@Test
	void bancoFicaProprietarioComCredito() throws Exception {
		Long id = pedidoDaMarina(true);

		executar("horizonte", id, "PROPRIEDADE_BANCO", CREDITO)
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.proprietario").value("Banco Horizonte"))
				.andExpect(jsonPath("$.credito.valor").value(1800.00))
				.andExpect(jsonPath("$.credito.parcelas").value(6))
				.andExpect(jsonPath("$.credito.banco").value("Banco Horizonte"));

		assertThat(proprietarioDoOnix()).isEqualTo("Banco Horizonte");
	}

	@Test
	void bancoPodeConcederCreditoEmContratoDoCliente() throws Exception {
		Long id = pedidoDaMarina(true);

		executar("confianca", id, "PROPRIEDADE_CLIENTE", CREDITO)
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.proprietario").value("Marina Costa"))
				.andExpect(jsonPath("$.credito.banco").value("Banco Confiança"));
	}

	@Test
	void propriedadeDoBancoExigeCredito() throws Exception {
		executar("horizonte", pedidoDaMarina(true), "PROPRIEDADE_BANCO", null)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.credito").value("Contrato com o banco como proprietário exige crédito."));
	}

	@Test
	void soBancoConcedeCredito() throws Exception {
		executar("rotasul", pedidoDaMarina(true), "PROPRIEDADE_EMPRESA", CREDITO)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.credito").value("Só um banco concede crédito."));
	}

	@Test
	void tipoPrecisaCombinarComOAgente() throws Exception {
		executar("rotasul", pedidoDaMarina(true), "PROPRIEDADE_BANCO", CREDITO)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.tipo").value("Só um banco fica proprietário pelo contrato."));
		executar("horizonte", pedidoDaMarina(true), "PROPRIEDADE_EMPRESA", null)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.tipo").value("Só uma empresa fica proprietária pelo contrato."));
	}

	@Test
	void soPedidoAprovadoEContratadoUmaVez() throws Exception {
		executar("rotasul", pedidoDaMarina(false), "PROPRIEDADE_EMPRESA", null)
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensagem").value("Só um pedido aprovado pode ser contratado."));

		Long aprovado = pedidoDaMarina(true);
		executar("rotasul", aprovado, "PROPRIEDADE_EMPRESA", null).andExpect(status().isCreated());
		executar("vialeste", aprovado, "PROPRIEDADE_EMPRESA", null).andExpect(status().isConflict());
	}

	@Test
	void creditoInvalidoApontaOCampo() throws Exception {
		executar("horizonte", pedidoDaMarina(true), "PROPRIEDADE_BANCO",
				"{\"valor\":1800,\"taxaJuros\":1.2,\"parcelas\":0}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$['campos']['credito.parcelas']").value("Use de 1 a 60 parcelas."));
	}

	@Test
	void clienteNaoExecutaContrato() throws Exception {
		executar("marina", pedidoDaMarina(true), "PROPRIEDADE_CLIENTE", null).andExpect(status().isForbidden());
	}

	@Test
	void contratoApareceNaListaENoDetalheDoPedido() throws Exception {
		Long id = pedidoDaMarina(true);
		executar("horizonte", id, "PROPRIEDADE_BANCO", CREDITO).andExpect(status().isCreated());

		mockMvc.perform(get("/api/contratos").cookie(SessaoTeste.sessao(mockMvc, "rotasul")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].pedidoId").value(id))
				.andExpect(jsonPath("$[0].cliente").value("Marina Costa"))
				.andExpect(jsonPath("$[0].placa").value("RTA2F41"));

		mockMvc.perform(get("/api/pedidos/" + id).cookie(SessaoTeste.sessao(mockMvc, "marina")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("CONTRATADO"))
				.andExpect(jsonPath("$.contrato.proprietario").value("Banco Horizonte"))
				.andExpect(jsonPath("$.contrato.credito.parcelas").value(6));
	}

}
