package br.com.aluguelcarros.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.aluguelcarros.model.NovoPedidoRequest;
import br.com.aluguelcarros.model.ParecerRequest;
import br.com.aluguelcarros.model.PedidoResponse;
import br.com.aluguelcarros.security.UsuarioAutenticado;
import br.com.aluguelcarros.service.PedidoService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

	private final PedidoService pedidoService;

	public PedidoController(PedidoService pedidoService) {
		this.pedidoService = pedidoService;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public PedidoResponse criar(@AuthenticationPrincipal UsuarioAutenticado usuario,
			@Valid @RequestBody NovoPedidoRequest dados) {
		return pedidoService.criar(usuario.id(), dados);
	}

	@GetMapping
	public List<PedidoResponse> listar(@AuthenticationPrincipal UsuarioAutenticado usuario) {
		return pedidoService.listar(usuario);
	}

	@GetMapping("/{id}")
	public PedidoResponse buscar(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id) {
		return pedidoService.buscar(usuario, id);
	}

	@PutMapping("/{id}")
	public PedidoResponse modificar(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id,
			@Valid @RequestBody NovoPedidoRequest dados) {
		return pedidoService.modificar(usuario, id, dados);
	}

	@PostMapping("/{id}/analise")
	public PedidoResponse abrirAnalise(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id) {
		return pedidoService.abrirAnalise(usuario, id);
	}

	@PostMapping("/{id}/parecer")
	public PedidoResponse registrarParecer(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id,
			@Valid @RequestBody ParecerRequest dados) {
		return pedidoService.registrarParecer(usuario, id, dados);
	}

	@PostMapping("/{id}/cancelar")
	public PedidoResponse cancelar(@AuthenticationPrincipal UsuarioAutenticado usuario, @PathVariable Long id) {
		return pedidoService.cancelar(usuario, id);
	}

}
