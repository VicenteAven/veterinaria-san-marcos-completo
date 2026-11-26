package cl.duoc.catalogo.service;

import cl.duoc.catalogo.dto.ServicioResponse;
import cl.duoc.catalogo.model.Categoria;
import cl.duoc.catalogo.model.Especie;
import cl.duoc.catalogo.model.Servicio;
import cl.duoc.catalogo.repository.ServicioRepository;
import cl.duoc.catalogo.util.Texto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ServicioServiceTest {

    @Mock ServicioRepository repo;
    @Mock EspecieResolver resolver;
    ServicioService service;

    private static Especie especie(String nombre) {
        Especie e = new Especie();
        e.setNombre(nombre);
        return e;
    }

    private static Servicio servicio(long id, String codigo, String nombre, boolean activo, String... especies) {
        Categoria c = new Categoria();
        c.setId(1L);
        c.setNombre("Vacunación");
        c.setTipo("SERVICIO");
        Servicio s = new Servicio();
        s.setId(id);
        s.setCodigo(codigo);
        s.setNombre(nombre);
        s.setCategoria(c);
        s.setActivo(activo);
        s.setDuracionMin(10);
        s.setPrecio(12000);
        for (String e : especies) {
            s.getEspecies().add(especie(e));
        }
        return s;
    }

    @BeforeEach
    void preparar() {
        service = new ServicioService(repo, resolver);
        when(repo.findAllByOrderByCodigoAsc()).thenReturn(List.of(
                servicio(1, "VA001", "Vacuna antirrábica canina", true, "Perro"),
                servicio(2, "VA003", "Vacuna bivalente felina", true, "Gato"),
                servicio(3, "SV001", "Consulta general", true, "Perro", "Gato"),
                servicio(4, "OT009", "Servicio retirado", false, "Perro")));
    }

    @Test
    void filtraPorEspecie() {
        List<String> codigos = service.listar(null, "Gato", null, false).stream().map(ServicioResponse::codigo).toList();
        assertThat(codigos).containsExactly("VA003", "SV001");
    }

    @Test
    void buscaSinImportarTildesNiMayusculas() {
        assertThat(service.listar("ANTIRRABICA", null, null, false)).extracting(ServicioResponse::codigo).containsExactly("VA001");
    }

    @Test
    void ocultaServiciosInactivosSalvoQueSePidan() {
        assertThat(service.listar(null, null, null, false)).hasSize(3);
        assertThat(service.listar(null, null, null, true)).hasSize(4);
    }

    @Test
    void normalizarQuitaTildes() {
        assertThat(Texto.normalizar("Antirrábica ÁÉÍ")).isEqualTo("antirrabica aei");
        assertThat(Set.of(Texto.normalizar(null))).containsExactly("");
    }
}
