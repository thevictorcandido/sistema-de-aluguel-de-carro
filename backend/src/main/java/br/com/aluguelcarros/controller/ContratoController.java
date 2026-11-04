package br.com.aluguelcarros.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.aluguelcarros.model.ContratoRequest;
import br.com.aluguelcarros.model.ContratoResponse;
import br.com.aluguelcarros.security.UsuarioAutenticado;
import br.com.aluguelcarros.service.ContratoService;
import jakarta.validation.Valid;

@RestController
public class ContratoController {

	private final ContratoService contratoService;

	public ContratoController(ContratoService contratoService) {
		this.contratoService = contratoService;
	}

	@PostMapping("/api/pedidos/{id}/contrato")
	@ResponseStatus(HttpStatus.CREATED)
	public ContratoResponse executar(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id,
			@Valid @RequestBody ContratoRequest dados) {
		return contratoService.executar(usuario.id(), id, dados);
	}

	@GetMapping("/api/contratos")
	public List<ContratoResponse> listar() {
		return contratoService.listar();
	}

}
