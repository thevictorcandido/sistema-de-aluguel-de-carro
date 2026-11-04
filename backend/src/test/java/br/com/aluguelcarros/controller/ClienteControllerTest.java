package br.com.aluguelcarros.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import br.com.aluguelcarros.repository.UsuarioRepository;

@SpringBootTest(classes = AluguelCarrosApplication.class)
@AutoConfigureMockMvc
@Transactional
class ClienteControllerTest {

	// CPF fictício com dígitos verificadores válidos, diferente dos dados iniciais
	private static final String CPF_NOVO = "111.444.777-35";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private UsuarioRepository usuarios;

	private static String cadastro(String login, String cpf, String rg) {
		return """
				{
				  "login": "%s",
				  "senha": "senha-forte-1",
				  "nome": "Ana Ribeiro",
				  "cpf": "%s",
				  "rg": "%s",
				  "profissao": "Professora",
				  "endereco": {
				    "logradouro": "Rua Guajajaras",
				    "numero": "40",
				    "complemento": "",
				    "bairro": "Centro",
				    "cidade": "Belo Horizonte",
				    "uf": "MG",
				    "cep": "30180-100"
				  }
				}
				""".formatted(login, cpf, rg);
	}

	private ResultActions cadastrar(String json) throws Exception {
		return mockMvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(json));
	}

	@Test
	void cadastroCriaClienteSemLoginPrevio() throws Exception {
		cadastrar(cadastro("Ana.Ribeiro", CPF_NOVO, "mg-55.666.777"))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.login").value("ana.ribeiro"))
				.andExpect(jsonPath("$.perfil").value("CLIENTE"));

		Cliente ana = (Cliente) usuarios.findByLogin("ana.ribeiro").orElseThrow();
		assertThat(ana.getRg()).isEqualTo("MG-55.666.777");
		assertThat(ana.getEndereco().getComplemento()).isNull();
		assertThat(ana.getSenhaHash()).startsWith("$2a$").doesNotContain("senha-forte-1");
	}

	@Test
	void clienteCadastradoConsegueEntrar() throws Exception {
		cadastrar(cadastro("ana", CPF_NOVO, "MG-55.666.777")).andExpect(status().isCreated());
		assertThat(SessaoTeste.entrar(mockMvc, "ana", "senha-forte-1").getResponse().getStatus())
				.isEqualTo(200);
	}

	@Test
	void loginEmUsoResponde409NoCampo() throws Exception {
		cadastrar(cadastro("marina", CPF_NOVO, "MG-55.666.777"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.campos.login").value("Este usuário já está em uso."));
	}

	@Test
	void cpfJaCadastradoResponde409NoCampo() throws Exception {
		cadastrar(cadastro("ana", "123.456.789-09", "MG-55.666.777"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.campos.cpf").value("Já existe uma conta com este CPF."));
	}

	@Test
	void rgJaCadastradoResponde409NoCampo() throws Exception {
		cadastrar(cadastro("ana", CPF_NOVO, "MG-12.345.678"))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.campos.rg").value("Já existe uma conta com este RG."));
	}

	@Test
	void cpfComDigitoErradoResponde400() throws Exception {
		cadastrar(cadastro("ana", "111.444.777-00", "MG-55.666.777"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.cpf").value("Este CPF não é válido."));
	}

	@Test
	void camposInvalidosVoltamComONomeDoCampo() throws Exception {
		String json = cadastro("a", "12345678900", "MG-55.666.777")
				.replace("\"senha-forte-1\"", "\"curta\"")
				.replace("\"30180-100\"", "\"30180100\"");
		cadastrar(json)
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.mensagem").value("Confira os campos destacados."))
				.andExpect(jsonPath("$.campos.login").exists())
				.andExpect(jsonPath("$.campos.senha").value("A senha precisa ter de 8 a 72 caracteres."))
				.andExpect(jsonPath("$.campos.cpf").value("Use o formato 000.000.000-00."))
				.andExpect(jsonPath("$['campos']['endereco.cep']").value("Use o formato 00000-000."));
	}

}
