package br.com.aluguelcarros.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import br.com.aluguelcarros.SessaoTeste;
import br.com.aluguelcarros.application.AluguelCarrosApplication;
import br.com.aluguelcarros.model.Cliente;
import br.com.aluguelcarros.model.Empresa;
import br.com.aluguelcarros.model.Parecer;
import br.com.aluguelcarros.model.PedidoAluguel;
import br.com.aluguelcarros.repository.AutomovelRepository;
import br.com.aluguelcarros.repository.PedidoAluguelRepository;
import br.com.aluguelcarros.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.Cookie;

/** Rotas /api/clientes/me: consultar, alterar e excluir o cadastro, e os rendimentos (US03 e US04). */
@SpringBootTest(classes = AluguelCarrosApplication.class)
@AutoConfigureMockMvc
@Transactional
class MeusDadosControllerTest {

	private static final String DADOS_MARINA = """
			{
			  "nome": "Marina Costa Lima",
			  "cpf": "%s",
			  "rg": "MG-12.345.678",
			  "profissao": "Enfermeira chefe",
			  "endereco": {
			    "logradouro": "Rua da Bahia",
			    "numero": "1150",
			    "complemento": "",
			    "bairro": "Centro",
			    "cidade": "Belo Horizonte",
			    "uf": "MG",
			    "cep": "30160-011"
			  }
			}
			""";

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

	private Cookie marina;

	@BeforeEach
	void entrar() throws Exception {
		marina = SessaoTeste.sessao(mockMvc, "marina");
	}

	private PedidoAluguel pedidoDaMarina() {
		Cliente cliente = (Cliente) usuarios.findByLogin("marina").orElseThrow();
		return pedidos.save(new PedidoAluguel(cliente, automoveis.findAll().getFirst(), LocalDate.of(2026, 12, 1),
				LocalDate.of(2026, 12, 3), LocalDateTime.now()));
	}

	private static String rendimento(String empregador, String valor) {
		return "{\"entidadeEmpregadora\":\"" + empregador + "\",\"valor\":" + valor + "}";
	}

	@Test
	void consultaMostraDadosRendimentosERendaSemDadosDeAcesso() throws Exception {
		mockMvc.perform(get("/api/clientes/me").cookie(marina))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nome").value("Marina Costa"))
				.andExpect(jsonPath("$.cpf").value("123.456.789-09"))
				.andExpect(jsonPath("$.endereco.cidade").value("Belo Horizonte"))
				.andExpect(jsonPath("$.rendimentos.length()").value(2))
				.andExpect(jsonPath("$.rendaMensal").value(5500.00))
				.andExpect(jsonPath("$.maximoRendimentos").value(3))
				.andExpect(jsonPath("$.exclusao.permitida").value(true))
				.andExpect(jsonPath("$.senhaHash").doesNotExist());
	}

	@Test
	void alteraOsDadosEOEndereco() throws Exception {
		mockMvc.perform(put("/api/clientes/me").cookie(marina).contentType(MediaType.APPLICATION_JSON)
				.content(DADOS_MARINA.formatted("123.456.789-09")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.nome").value("Marina Costa Lima"))
				.andExpect(jsonPath("$.profissao").value("Enfermeira chefe"))
				.andExpect(jsonPath("$.endereco.numero").value("1150"))
				.andExpect(jsonPath("$.endereco.complemento").doesNotExist());
	}

	@Test
	void naoAceitaOCpfDeOutroCliente() throws Exception {
		mockMvc.perform(put("/api/clientes/me").cookie(marina).contentType(MediaType.APPLICATION_JSON)
				.content(DADOS_MARINA.formatted("987.654.321-00")))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.campos.cpf").value("Já existe uma conta com este CPF."));
	}

	@Test
	void aceitaAteTresRendimentosERecusaOQuarto() throws Exception {
		mockMvc.perform(post("/api/clientes/me/rendimentos").cookie(marina)
				.contentType(MediaType.APPLICATION_JSON).content(rendimento("Plantões extras", "800.50")))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").isNumber())
				.andExpect(jsonPath("$.valor").value(800.50));

		mockMvc.perform(post("/api/clientes/me/rendimentos").cookie(marina)
				.contentType(MediaType.APPLICATION_JSON).content(rendimento("Quarto vínculo", "100")))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensagem").value("O cliente pode informar no máximo 3 rendimentos."));

		mockMvc.perform(get("/api/clientes/me").cookie(marina))
				.andExpect(jsonPath("$.rendimentos.length()").value(3))
				.andExpect(jsonPath("$.rendaMensal").value(6300.50));
	}

	@Test
	void rendimentoComValorInvalidoApontaOCampo() throws Exception {
		mockMvc.perform(post("/api/clientes/me/rendimentos").cookie(marina)
				.contentType(MediaType.APPLICATION_JSON).content(rendimento("", "0")))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.entidadeEmpregadora").value("Informe o empregador."))
				.andExpect(jsonPath("$.campos.valor").value("O valor precisa ser maior que zero."));
	}

	@Test
	void editaERemoveOProprioRendimento() throws Exception {
		Cliente cliente = (Cliente) usuarios.findByLogin("marina").orElseThrow();
		Long id = cliente.getRendimentos().getFirst().getId();

		mockMvc.perform(put("/api/clientes/me/rendimentos/" + id).cookie(marina)
				.contentType(MediaType.APPLICATION_JSON).content(rendimento("Hospital São Lucas", "4500")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.valor").value(4500));

		mockMvc.perform(delete("/api/clientes/me/rendimentos/" + id).cookie(marina))
				.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/clientes/me").cookie(marina))
				.andExpect(jsonPath("$.rendimentos.length()").value(1))
				.andExpect(jsonPath("$.rendaMensal").value(1300.00));
	}

	@Test
	void rendimentoDeOutroClienteRespondeNaoEncontrado() throws Exception {
		Cliente joao = (Cliente) usuarios.findByLogin("joao").orElseThrow();
		Long idDoJoao = joao.getRendimentos().getFirst().getId();

		mockMvc.perform(put("/api/clientes/me/rendimentos/" + idDoJoao).cookie(marina)
				.contentType(MediaType.APPLICATION_JSON).content(rendimento("Invasão", "1")))
				.andExpect(status().isNotFound());
		mockMvc.perform(delete("/api/clientes/me/rendimentos/" + idDoJoao).cookie(marina))
				.andExpect(status().isNotFound());
	}

	@Test
	void pedidoEmAndamentoBloqueiaAExclusao() throws Exception {
		pedidoDaMarina();

		mockMvc.perform(get("/api/clientes/me").cookie(marina))
				.andExpect(jsonPath("$.exclusao.permitida").value(false))
				.andExpect(jsonPath("$.exclusao.motivo").value(Matchers.containsString("pedidos em andamento")));

		mockMvc.perform(delete("/api/clientes/me").cookie(marina))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensagem").value(Matchers.containsString("pedidos em andamento")));
		assertThat(usuarios.findByLogin("marina")).isPresent();
	}

	@Test
	void contratoExecutadoBloqueiaAExclusao() throws Exception {
		Empresa empresa = (Empresa) usuarios.findByLogin("rotasul").orElseThrow();
		PedidoAluguel pedido = pedidoDaMarina();
		pedido.iniciarAnalise();
		pedido.registrarParecer(new Parecer(empresa, true, "Renda compatível.", LocalDateTime.now()));
		pedido.contratar();

		mockMvc.perform(delete("/api/clientes/me").cookie(marina))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensagem").value(Matchers.containsString("contratos executados")));
	}

	@Test
	void excluiAContaComPedidoCanceladoEEncerraASessao() throws Exception {
		pedidoDaMarina().cancelar();

		mockMvc.perform(delete("/api/clientes/me").cookie(marina))
				.andExpect(status().isNoContent())
				.andExpect(header().string(HttpHeaders.SET_COOKIE, Matchers.containsString("Max-Age=0")));
		em.flush();

		assertThat(usuarios.findByLogin("marina")).isEmpty();
		assertThat(SessaoTeste.entrar(mockMvc, "marina", "senha123").getResponse().getStatus()).isEqualTo(401);
	}

}
