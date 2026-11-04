package br.com.aluguelcarros.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.aluguelcarros.model.CadastroClienteRequest;
import br.com.aluguelcarros.model.UsuarioResponse;
import br.com.aluguelcarros.service.ClienteService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

	private final ClienteService clienteService;

	public ClienteController(ClienteService clienteService) {
		this.clienteService = clienteService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public UsuarioResponse cadastrar(@Valid @RequestBody CadastroClienteRequest dados) {
		return UsuarioResponse.de(clienteService.cadastrar(dados));
	}

}
