package br.com.aluguelcarros.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import br.com.aluguelcarros.SessaoTeste;
import br.com.aluguelcarros.application.AluguelCarrosApplication;
import jakarta.servlet.http.Cookie;

/**
 * Regras por perfil do SecurityConfig. Quando o perfil pode acessar a rota, o filtro deixa passar: a resposta é a
 * da própria rota, ou 404 enquanto a rota ainda não existe (contratos entram na tarefa 8).
 */
@SpringBootTest(classes = AluguelCarrosApplication.class)
@AutoConfigureMockMvc
class AutorizacaoTest {

	@Autowired
	private MockMvc mockMvc;

	private Cookie sessao(String login) throws Exception {
		return SessaoTeste.sessao(mockMvc, login);
	}

	@Test
	void semLoginTodaRotaPrivadaResponde401() throws Exception {
		mockMvc.perform(get("/api/pedidos")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/clientes/me")).andExpect(status().isUnauthorized());
		mockMvc.perform(get("/api/contratos")).andExpect(status().isUnauthorized());
	}

	@Test
	void clienteNaoAcessaRotaDeAgente() throws Exception {
		Cookie marina = sessao("marina");
		mockMvc.perform(get("/api/contratos").cookie(marina)).andExpect(status().isForbidden());
		mockMvc.perform(post("/api/automoveis").cookie(marina).contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isForbidden());
		mockMvc.perform(delete("/api/automoveis/1").cookie(marina)).andExpect(status().isForbidden());
	}

	@Test
	void agenteNaoAcessaRotaDoCliente() throws Exception {
		mockMvc.perform(get("/api/clientes/me").cookie(sessao("rotasul"))).andExpect(status().isForbidden());
		mockMvc.perform(get("/api/clientes/me/rendimentos").cookie(sessao("horizonte")))
				.andExpect(status().isForbidden());
	}

	@Test
	void perfilCertoPassaPeloFiltro() throws Exception {
		mockMvc.perform(get("/api/contratos").cookie(sessao("horizonte"))).andExpect(status().isNotFound());
		mockMvc.perform(get("/api/clientes/me").cookie(sessao("marina"))).andExpect(status().isOk());
	}

}
