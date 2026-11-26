package cl.duoc.catalogo.controller;

import cl.duoc.catalogo.dto.CategoriaResponse;
import cl.duoc.catalogo.model.Especie;
import cl.duoc.catalogo.repository.CategoriaRepository;
import cl.duoc.catalogo.repository.EspecieRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Listas de apoyo para los filtros y formularios del frontend. */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Categorías y especies")
public class ReferenciaController {

    private final CategoriaRepository categorias;
    private final EspecieRepository especies;

    public ReferenciaController(CategoriaRepository categorias, EspecieRepository especies) {
        this.categorias = categorias;
        this.especies = especies;
    }

    @GetMapping("/categorias")
    @Operation(summary = "Lista categorías; tipo opcional: SERVICIO o MEDICAMENTO")
    public List<CategoriaResponse> categorias(@RequestParam(required = false) String tipo) {
        var lista = tipo == null || tipo.isBlank()
                ? categorias.findAllByOrderByNombreAsc()
                : categorias.findByTipoOrderByNombreAsc(tipo.trim().toUpperCase());
        return lista.stream().map(CategoriaResponse::de).toList();
    }

    @GetMapping("/especies")
    @Operation(summary = "Lista las especies que atiende la clínica")
    public List<String> especies() {
        return especies.findAll().stream().map(Especie::getNombre).toList();
    }
}
