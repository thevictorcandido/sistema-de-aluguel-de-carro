package br.com.aluguelcarros.security;

import br.com.aluguelcarros.model.Perfil;

/** Quem fez a requisição, lido do JWT. É o principal do Spring Security. */
public record UsuarioAutenticado(Long id, Perfil perfil) {
}
