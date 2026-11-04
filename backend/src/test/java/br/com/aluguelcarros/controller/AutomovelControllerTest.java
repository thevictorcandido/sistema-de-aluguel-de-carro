package br.com.aluguelcarros.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
import br.com.aluguelcarros.model.PedidoAluguel;
import br.com.aluguelcarros.repository.AutomovelRepository;
import br.com.aluguelcarros.repository.PedidoAluguelRepository;
import br.com.aluguelcarros.repository.UsuarioRepository;

/** Cadastro e manutenção de automóveis pelos agentes (US13). */
@SpringBootTest(classes = AluguelCarrosApplication.class)
@AutoConfigureMockMvc
@Transactional
class AutomovelControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private AutomovelRepository automoveis;

	@Autowired
	private UsuarioRepository usuarios;

	@Autowired
	private PedidoAluguelRepository pedidos;

	private static String carro(String placa, String matricula) {
		return """
				{"matricula":"%s","ano":2025,"marca":"Nissan","modelo":"Kicks","placa":"%s","valorDiaria":230.00}
				""".formatted(matricula, placa);
	}

	private ResultActions cadastrar(String login, String json) throws Exception {
		return mockMvc.perform(post("/api/automoveis").cookie(SessaoTeste.sessao(mockMvc, login))
				.contentType(MediaType.APPLICATION_JSON).content(json));
	}

	private Long idDaPlaca(String placa) {
		return automoveis.findAll().stream().filter(a -> a.getPlaca().equals(placa)).findFirst()
				.map(Automovel::getId).orElseThrow();
	}

	@Test
	void agenteQueCadastraEOProprietarioInicial() throws Exception {
		cadastrar("horizonte", carro("rtz-9a12", "01234567899"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.placa").value("RTZ9A12"))
				.andExpect(jsonPath("$.proprietario").value("Banco Horizonte"));

		mockMvc.perform(get("/api/automoveis").cookie(SessaoTeste.sessao(mockMvc, "marina")))
				.andExpect(jsonPath("$.length()").value(9));
	}

	@Test
	void placaEMatriculaRepetidasApontamOCampo() throws Exception {
		cadastrar("rotasul", carro("RTA2F41", "01234567899"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.campos.placa").value("Já existe um automóvel com esta placa."));
		cadastrar("rotasul", carro("RTZ9A12", "01234567801"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.campos.matricula").value("Já existe um automóvel com esta matrícula."));
	}

	@Test
	void camposInvalidosApontamOCampo() throws Exception {
		cadastrar("rotasul", "{\"matricula\":\"\",\"ano\":1950,\"marca\":\"Fiat\",\"modelo\":\"Uno\","
				+ "\"placa\":\"12345\",\"valorDiaria\":0}")
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.matricula").value("Informe a matrícula."))
				.andExpect(jsonPath("$.campos.ano").value("Use um ano a partir de 1990."))
				.andExpect(jsonPath("$.campos.placa").value("Use o formato ABC1D23 ou ABC-1234."))
				.andExpect(jsonPath("$.campos.valorDiaria").value("O valor precisa ser maior que zero."));
	}

	@Test
	void proprietarioEditaMantendoAPropriaPlaca() throws Exception {
		Long onix = idDaPlaca("RTA2F41");
		String json = "{\"matricula\":\"01234567801\",\"ano\":2024,\"marca\":\"Chevrolet\",\"modelo\":\"Onix Plus\","
				+ "\"placa\":\"RTA2F41\",\"valorDiaria\":195.00}";

		mockMvc.perform(put("/api/automoveis/" + onix).cookie(SessaoTeste.sessao(mockMvc, "rotasul"))
				.contentType(MediaType.APPLICATION_JSON).content(json))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.modelo").value("Onix Plus"))
				.andExpect(jsonPath("$.valorDiaria").value(195.00));
	}

	@Test
	void outroAgenteNaoEditaNemExclui() throws Exception {
		Long onix = idDaPlaca("RTA2F41");

		mockMvc.perform(put("/api/automoveis/" + onix).cookie(SessaoTeste.sessao(mockMvc, "vialeste"))
				.contentType(MediaType.APPLICATION_JSON).content(carro("RTA2F41", "01234567801")))
				.andExpect(status().isForbidden());
		mockMvc.perform(delete("/api/automoveis/" + onix).cookie(SessaoTeste.sessao(mockMvc, "vialeste")))
				.andExpect(status().isForbidden());
	}

	@Test
	void excluiAutomovelSemPedidos() throws Exception {
		Long onix = idDaPlaca("RTA2F41");

		mockMvc.perform(delete("/api/automoveis/" + onix).cookie(SessaoTeste.sessao(mockMvc, "rotasul")))
				.andExpect(status().isNoContent());
		assertThat(automoveis.findById(onix)).isEmpty();
	}

	@Test
	void automovelComPedidoNaoPodeSerExcluido() throws Exception {
		Long onix = idDaPlaca("RTA2F41");
		Cliente marina = (Cliente) usuarios.findByLogin("marina").orElseThrow();
		pedidos.saveAndFlush(new PedidoAluguel(marina, automoveis.findById(onix).orElseThrow(),
				LocalDate.now().plusDays(3), LocalDate.now().plusDays(4), LocalDateTime.now()));

		mockMvc.perform(delete("/api/automoveis/" + onix).cookie(SessaoTeste.sessao(mockMvc, "rotasul")))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.mensagem").value("Este automóvel já aparece em pedidos e não pode ser excluído."));
	}

	@Test
	void clienteNaoCadastra() throws Exception {
		cadastrar("marina", carro("RTZ9A12", "01234567899")).andExpect(status().isForbidden());
	}

}
