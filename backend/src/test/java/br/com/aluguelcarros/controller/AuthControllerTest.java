package br.com.aluguelcarros.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import br.com.aluguelcarros.SessaoTeste;
import br.com.aluguelcarros.application.AluguelCarrosApplication;
import jakarta.servlet.http.Cookie;

@SpringBootTest(classes = AluguelCarrosApplication.class)
@AutoConfigureMockMvc
class AuthControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void loginCorretoDevolveUsuarioECookieHttpOnly() throws Exception {
		MvcResult resultado = SessaoTeste.entrar(mockMvc, "marina", "senha123");

		assertThat(resultado.getResponse().getStatus()).isEqualTo(200);
		String setCookie = resultado.getResponse().getHeader(HttpHeaders.SET_COOKIE);
		assertThat(setCookie).contains("sessao=", "HttpOnly", "SameSite=Strict", "Path=/");
		assertThat(resultado.getResponse().getContentAsString())
				.contains("\"perfil\":\"CLIENTE\"", "\"nome\":\"Marina Costa\"")
				.doesNotContain("senha");
	}

	@Test
	void loginIgnoraMaiusculasEEspacosNoUsuario() throws Exception {
		assertThat(SessaoTeste.entrar(mockMvc, " Horizonte ", "senha123").getResponse().getStatus()).isEqualTo(200);
	}

	@Test
	void senhaErradaNaoDizQualCampoErrou() throws Exception {
		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"login\":\"marina\",\"senha\":\"errada\"}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.mensagem").value("Usuário ou senha incorretos."))
				.andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));
	}

	@Test
	void usuarioInexistenteTemAMesmaResposta() throws Exception {
		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"login\":\"ninguem\",\"senha\":\"senha123\"}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.mensagem").value("Usuário ou senha incorretos."));
	}

	@Test
	void loginSemCamposApontaOsCampos() throws Exception {
		mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.campos.login").value("Informe o usuário."))
				.andExpect(jsonPath("$.campos.senha").value("Informe a senha."));
	}

	@Test
	void meComSessaoDevolveOPerfil() throws Exception {
		mockMvc.perform(get("/api/auth/me").cookie(SessaoTeste.sessao(mockMvc, "rotasul")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.login").value("rotasul"))
				.andExpect(jsonPath("$.perfil").value("EMPRESA"))
				.andExpect(jsonPath("$.nome").value("Locadora Rota Sul"));
	}

	@Test
	void meSemSessaoResponde401() throws Exception {
		mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
	}

	@Test
	void tokenAdulteradoResponde401() throws Exception {
		Cookie cookie = SessaoTeste.sessao(mockMvc, "marina");
		String token = cookie.getValue();
		Cookie adulterado = new Cookie("sessao", token.substring(0, token.length() - 2) + "xx");
		mockMvc.perform(get("/api/auth/me").cookie(adulterado)).andExpect(status().isUnauthorized());
	}

	@Test
	void logoutApagaOCookie() throws Exception {
		mockMvc.perform(post("/api/auth/logout"))
				.andExpect(status().isNoContent())
				.andExpect(header().string(HttpHeaders.SET_COOKIE,
						allOf(containsString("sessao="), containsString("Max-Age=0"))));
	}

}
