package br.com.aluguelcarros;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import jakarta.servlet.http.Cookie;

/** Login pela API nos testes, com os usuários dos dados iniciais (senha123). */
public final class SessaoTeste {

	private SessaoTeste() {
	}

	public static MvcResult entrar(MockMvc mockMvc, String login, String senha) throws Exception {
		return mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"login\":\"" + login + "\",\"senha\":\"" + senha + "\"}"))
				.andReturn();
	}

	public static Cookie sessao(MockMvc mockMvc, String login) throws Exception {
		Cookie cookie = entrar(mockMvc, login, "senha123").getResponse().getCookie("sessao");
		assertThat(cookie).as("cookie de sessão de " + login).isNotNull();
		return cookie;
	}

}
