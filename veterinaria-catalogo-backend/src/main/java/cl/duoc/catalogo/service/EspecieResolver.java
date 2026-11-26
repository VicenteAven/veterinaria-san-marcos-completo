package cl.duoc.catalogo.service;

import cl.duoc.catalogo.model.Especie;
import cl.duoc.catalogo.exception.ApiException;
import cl.duoc.catalogo.repository.CategoriaRepository;
import cl.duoc.catalogo.repository.EspecieRepository;
import cl.duoc.catalogo.model.Categoria;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Traduce nombres de especie y ids de categoría (que llegan en el JSON) a entidades, validando que existan. */
@Component
public class EspecieResolver {

    private final EspecieRepository especies;
    private final CategoriaRepository categorias;

    public EspecieResolver(EspecieRepository especies, CategoriaRepository categorias) {
        this.especies = especies;
        this.categorias = categorias;
    }

    public Set<Especie> resolver(List<String> nombres) {
        Set<Especie> resultado = new HashSet<>();
        for (String nombre : nombres) {
            resultado.add(especies.findByNombreIgnoreCase(nombre == null ? "" : nombre.trim())
                    .orElseThrow(() -> ApiException.invalido("La especie «" + nombre + "» no existe.")));
        }
        return resultado;
    }

    public Categoria categoria(Long id, String tipoEsperado) {
        Categoria c = categorias.findById(id).orElseThrow(() -> ApiException.invalido("La categoría indicada no existe."));
        if (!c.getTipo().equals(tipoEsperado)) {
            throw ApiException.invalido("La categoría «" + c.getNombre() + "» no corresponde a este tipo de elemento.");
        }
        return c;
    }
}
