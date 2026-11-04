package br.com.aluguelcarros.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.aluguelcarros.model.AtualizarClienteRequest;
import br.com.aluguelcarros.model.CadastroClienteRequest;
import br.com.aluguelcarros.model.ClienteResponse;
import br.com.aluguelcarros.model.RendimentoRequest;
import br.com.aluguelcarros.model.RendimentoResponse;
import br.com.aluguelcarros.model.UsuarioResponse;
import br.com.aluguelcarros.security.CookieSessao;
import br.com.aluguelcarros.security.UsuarioAutenticado;
import br.com.aluguelcarros.service.ClienteService;
import jakarta.validation.Valid;

/** Cadastro público e as rotas /me, em que o cliente só mexe nos próprios dados. */
@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

	private final ClienteService clienteService;
	private final CookieSessao cookieSessao;

	public ClienteController(ClienteService clienteService, CookieSessao cookieSessao) {
		this.clienteService = clienteService;
		this.cookieSessao = cookieSessao;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public UsuarioResponse cadastrar(@Valid @RequestBody CadastroClienteRequest dados) {
		return UsuarioResponse.de(clienteService.cadastrar(dados));
	}

	@GetMapping("/me")
	public ClienteResponse consultar(@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return clienteService.consultar(usuario.id());
	}

	@PutMapping("/me")
	public ClienteResponse atualizar(@AuthenticationPrincipal UsuarioAutenticado usuario,
			@Valid @RequestBody AtualizarClienteRequest dados) {
		return clienteService.atualizar(usuario.id(), dados);
	}

	/** Exclui a conta e encerra a sessão no mesmo passo. */
	@DeleteMapping("/me")
	public ResponseEntity<Void> excluir(@AuthenticationPrincipal UsuarioAutenticado usuario) {
		clienteService.excluir(usuario.id());
		return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, cookieSessao.apagar()).build();
	}

	@PostMapping("/me/rendimentos")
	@ResponseStatus(HttpStatus.CREATED)
	public RendimentoResponse adicionarRendimento(@AuthenticationPrincipal UsuarioAutenticado usuario,
			@Valid @RequestBody RendimentoRequest dados) {
		return clienteService.adicionarRendimento(usuario.id(), dados);
	}

	@PutMapping("/me/rendimentos/{id}")
	public RendimentoResponse atualizarRendimento(@AuthenticationPrincipal UsuarioAutenticado usuario,
			@PathVariable Long id, @Valid @RequestBody RendimentoRequest dados) {
		return clienteService.atualizarRendimento(usuario.id(), id, dados);
	}

	@DeleteMapping("/me/rendimentos/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void removerRendimento(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id) {
		clienteService.removerRendimento(usuario.id(), id);
	}

}
