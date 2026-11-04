package br.com.aluguelcarros.repository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import br.com.aluguelcarros.application.AluguelCarrosApplication;
import br.com.aluguelcarros.model.Agente;
import br.com.aluguelcarros.model.Automovel;
import br.com.aluguelcarros.model.Banco;
import br.com.aluguelcarros.model.Cliente;
import br.com.aluguelcarros.model.Contrato;
import br.com.aluguelcarros.model.Empresa;
import br.com.aluguelcarros.model.Parecer;
import br.com.aluguelcarros.model.PedidoAluguel;
import br.com.aluguelcarros.model.Perfil;
import br.com.aluguelcarros.model.StatusPedido;
import br.com.aluguelcarros.model.TipoContrato;
import jakarta.persistence.EntityManager;

/** Confere as migrações e os dados iniciais contra o mapeamento das entidades, no H2. */
@SpringBootTest(classes = AluguelCarrosApplication.class)
@Transactional
class PersistenciaTest {

	@Autowired
	private UsuarioRepository usuarios;

	@Autowired
	private AgenteRepository agentes;

	@Autowired
	private AutomovelRepository automoveis;

	@Autowired
	private PedidoAluguelRepository pedidos;

	@Autowired
	private ContratoRepository contratos;

	@Autowired
	private EntityManager em;

	@Test
	void dadosIniciaisCarregados() {
		assertThat(usuarios.count()).isEqualTo(6);
		assertThat(agentes.findAll()).extracting(Agente::getPerfil)
				.containsExactlyInAnyOrder(Perfil.EMPRESA, Perfil.EMPRESA, Perfil.BANCO, Perfil.BANCO);
		assertThat(automoveis.count()).isEqualTo(8);
		assertThat(automoveis.findAll()).allSatisfy(a -> assertThat(a.getProprietario()).isInstanceOf(Empresa.class));
	}

	@Test
	void clienteDosDadosIniciaisTemRendimentosEEndereco() {
		Cliente marina = (Cliente) usuarios.findByLogin("marina").orElseThrow();
		assertThat(marina.getRendaMensal()).isEqualByComparingTo("5500.00");
		assertThat(marina.getEndereco().getCidade()).isEqualTo("Belo Horizonte");
		assertThat(marina.getSenhaHash()).startsWith("$2a$10$");
	}

	@Test
	void cicloCompletoComContratoECredito() {
		Cliente marina = (Cliente) usuarios.findByLogin("marina").orElseThrow();
		Banco banco = (Banco) usuarios.findByLogin("horizonte").orElseThrow();
		Automovel onix = automoveis.findAll().stream().filter(a -> a.getPlaca().equals("RTA2F41")).findFirst()
				.orElseThrow();

		PedidoAluguel pedido = pedidos.save(new PedidoAluguel(marina, onix, LocalDate.of(2026, 11, 10),
				LocalDate.of(2026, 11, 19), LocalDateTime.of(2026, 10, 31, 9, 0)));
		pedido.iniciarAnalise();
		pedido.registrarParecer(new Parecer(banco, true, "Renda compatível.", LocalDateTime.now()));
		pedido.contratar();

		Contrato contrato = new Contrato(pedido, banco, TipoContrato.PROPRIEDADE_BANCO, LocalDate.of(2026, 11, 4));
		banco.concederCredito(contrato, new BigDecimal("1800.00"), new BigDecimal("1.20"), 6);
		onix.registrarProprietario(banco);
		contratos.save(contrato);
		em.flush();
		em.clear();

		PedidoAluguel salvo = pedidos.findById(pedido.getId()).orElseThrow();
		assertThat(salvo.getStatus()).isEqualTo(StatusPedido.CONTRATADO);
		assertThat(salvo.getParecer().isPositivo()).isTrue();
		assertThat(salvo.getValorTotal()).isEqualByComparingTo("1800.00");
		assertThat(salvo.getAutomovel().getProprietario().getId()).isEqualTo(banco.getId());

		Contrato contratoSalvo = contratos.findById(contrato.getId()).orElseThrow();
		assertThat(contratoSalvo.getCredito().getParcelas()).isEqualTo(6);
		assertThat(contratoSalvo.getCredito().getBanco().getId()).isEqualTo(banco.getId());
	}

	@Test
	void modificarApagaOParecerDoBanco() {
		Cliente joao = (Cliente) usuarios.findByLogin("joao").orElseThrow();
		Empresa empresa = (Empresa) usuarios.findByLogin("rotasul").orElseThrow();
		Automovel carro = automoveis.findAll().getFirst();

		PedidoAluguel pedido = pedidos.save(new PedidoAluguel(joao, carro, LocalDate.of(2026, 12, 1),
				LocalDate.of(2026, 12, 3), LocalDateTime.now()));
		pedido.iniciarAnalise();
		pedido.registrarParecer(new Parecer(empresa, false, "Renda insuficiente.", LocalDateTime.now()));
		em.flush();
		Long parecerId = pedido.getParecer().getId();

		pedido.modificar(carro, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 2));
		em.flush();
		em.clear();

		assertThat(em.find(Parecer.class, parecerId)).isNull();
		assertThat(pedidos.findById(pedido.getId()).orElseThrow().getStatus()).isEqualTo(StatusPedido.ENVIADO);
	}

	@Test
	void placaRepetidaERecusadaPeloBanco() {
		Empresa empresa = (Empresa) usuarios.findByLogin("rotasul").orElseThrow();
		Automovel repetido = new Automovel("99999999999", 2024, "Fiat", "Mobi", "RTA2F41", new BigDecimal("100.00"),
				empresa);
		assertThatThrownBy(() -> automoveis.saveAndFlush(repetido))
				.isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void pedidosDoClienteDoMaisNovoParaOMaisAntigo() {
		Cliente marina = (Cliente) usuarios.findByLogin("marina").orElseThrow();
		Automovel carro = automoveis.findAll().getFirst();
		pedidos.save(new PedidoAluguel(marina, carro, LocalDate.of(2026, 12, 1), LocalDate.of(2026, 12, 2),
				LocalDateTime.of(2026, 11, 1, 8, 0)));
		pedidos.save(new PedidoAluguel(marina, carro, LocalDate.of(2026, 12, 5), LocalDate.of(2026, 12, 6),
				LocalDateTime.of(2026, 11, 2, 8, 0)));
		assertThat(pedidos.findByClienteIdOrderByDataCriacaoDesc(marina.getId())).extracting(PedidoAluguel::getDataInicio)
				.containsExactly(LocalDate.of(2026, 12, 5), LocalDate.of(2026, 12, 1));
	}

}
