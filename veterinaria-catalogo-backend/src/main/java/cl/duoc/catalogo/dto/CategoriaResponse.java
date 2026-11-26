package cl.duoc.catalogo.dto;

import cl.duoc.catalogo.model.Categoria;

public record CategoriaResponse(Long id, String nombre, String tipo) {
    public static CategoriaResponse de(Categoria c) {
        return new CategoriaResponse(c.getId(), c.getNombre(), c.getTipo());
    }
}
