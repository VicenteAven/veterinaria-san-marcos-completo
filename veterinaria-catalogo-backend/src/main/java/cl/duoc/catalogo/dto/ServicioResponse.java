package cl.duoc.catalogo.dto;

import cl.duoc.catalogo.model.Especie;
import cl.duoc.catalogo.model.Servicio;

import java.util.Comparator;
import java.util.List;

public record ServicioResponse(Long id, String codigo, CategoriaResponse categoria, String nombre, int duracionMin,
                               int precio, String observaciones, List<String> especies, boolean activo) {

    public static ServicioResponse de(Servicio s) {
        List<String> esp = s.getEspecies().stream().map(Especie::getNombre).sorted(Comparator.naturalOrder()).toList();
        return new ServicioResponse(s.getId(), s.getCodigo(), CategoriaResponse.de(s.getCategoria()), s.getNombre(),
                s.getDuracionMin(), s.getPrecio(), s.getObservaciones(), esp, s.isActivo());
    }
}
