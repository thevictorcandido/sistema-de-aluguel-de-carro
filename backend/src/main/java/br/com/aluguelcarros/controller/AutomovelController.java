package br.com.aluguelcarros.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
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

import br.com.aluguelcarros.model.AutomovelRequest;
import br.com.aluguelcarros.model.AutomovelResponse;
import br.com.aluguelcarros.security.UsuarioAutenticado;
import br.com.aluguelcarros.service.AutomovelService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/automoveis")
public class AutomovelController {

	private final AutomovelService automovelService;

	public AutomovelController(AutomovelService automovelService) {
		this.automovelService = automovelService;
	}

	@GetMapping
	public List<AutomovelResponse> listar() {
		return automovelService.listar();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AutomovelResponse cadastrar(@AuthenticationPrincipal UsuarioAutenticado usuario,
			@Valid @RequestBody AutomovelRequest dados) {
		return automovelService.cadastrar(usuario.id(), dados);
	}

	@PutMapping("/{id}")
	public AutomovelResponse atualizar(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id,
			@Valid @RequestBody AutomovelRequest dados) {
		return automovelService.atualizar(usuario.id(), id, dados);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void excluir(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id) {
		automovelService.excluir(usuario.id(), id);
	}

}
