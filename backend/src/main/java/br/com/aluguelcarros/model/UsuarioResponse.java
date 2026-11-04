package br.com.aluguelcarros.model;

/** Dados do usuário logado que a API devolve. Nunca inclui o hash da senha. */
public record UsuarioResponse(Long id, String login, String nome, Perfil perfil) {

	public static UsuarioResponse de(Usuario usuario) {
		return new UsuarioResponse(usuario.getId(), usuario.getLogin(), usuario.getNome(), usuario.getPerfil());
	}

}
