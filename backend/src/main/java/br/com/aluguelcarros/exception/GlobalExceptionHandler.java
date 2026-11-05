package br.com.aluguelcarros.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import br.com.aluguelcarros.model.ErroResponse;

/** Converte as exceções no formato de erro da SPEC: { "mensagem": "...", "campos": { ... } }. */
@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErroResponse> validacao(MethodArgumentNotValidException e) {
		Map<String, String> campos = new LinkedHashMap<>();
		for (FieldError erro : e.getBindingResult().getFieldErrors()) {
			campos.putIfAbsent(erro.getField(), erro.getDefaultMessage());
		}
		return resposta(HttpStatus.BAD_REQUEST, new ErroResponse("Confira os campos destacados.", campos));
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ErroResponse> corpoInvalido() {
		return resposta(HttpStatus.BAD_REQUEST, new ErroResponse("Os dados enviados estão em formato inválido."));
	}

	/** Id que não é número no caminho, como /api/pedidos/abc. */
	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ErroResponse> parametroInvalido() {
		return resposta(HttpStatus.BAD_REQUEST, new ErroResponse("O endereço pedido não é válido."));
	}

	@ExceptionHandler(CampoInvalidoException.class)
	public ResponseEntity<ErroResponse> campo(CampoInvalidoException e) {
		HttpStatus status = e.isConflito() ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
		return resposta(status, new ErroResponse("Confira os campos destacados.", Map.of(e.getCampo(), e.getMessage())));
	}

	@ExceptionHandler(CredenciaisInvalidasException.class)
	public ResponseEntity<ErroResponse> credenciais(CredenciaisInvalidasException e) {
		return resposta(HttpStatus.UNAUTHORIZED, new ErroResponse(e.getMessage()));
	}

	@ExceptionHandler(RecursoNaoEncontradoException.class)
	public ResponseEntity<ErroResponse> naoEncontrado(RecursoNaoEncontradoException e) {
		return resposta(HttpStatus.NOT_FOUND, new ErroResponse(e.getMessage()));
	}

	/** Duas requisições ao mesmo tempo venceram a checagem do serviço, e o banco recusou pela constraint. */
	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ErroResponse> conflitoNoBanco() {
		return resposta(HttpStatus.CONFLICT,
				new ErroResponse("Estes dados mudaram enquanto você salvava. Recarregue a página e tente de novo."));
	}

	@ExceptionHandler(RegraNegocioException.class)
	public ResponseEntity<ErroResponse> regra(RegraNegocioException e) {
		return resposta(HttpStatus.CONFLICT, new ErroResponse(e.getMessage()));
	}

	private static ResponseEntity<ErroResponse> resposta(HttpStatus status, ErroResponse corpo) {
		return ResponseEntity.status(status).body(corpo);
	}

}
