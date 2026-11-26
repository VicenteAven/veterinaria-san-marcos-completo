package cl.duoc.catalogo.dto;

import cl.duoc.catalogo.model.Especie;
import cl.duoc.catalogo.model.Medicamento;

import java.util.Comparator;
import java.util.List;

public record MedicamentoResponse(Long id, String codigo, CategoriaResponse categoria, String nombreComercial,
                                  String principioActivo, String presentacion, int stock, int precio,
                                  List<String> especies, boolean activo) {

    public static MedicamentoResponse de(Medicamento m) {
        List<String> esp = m.getEspecies().stream().map(Especie::getNombre).sorted(Comparator.naturalOrder()).toList();
        return new MedicamentoResponse(m.getId(), m.getCodigo(), CategoriaResponse.de(m.getCategoria()), m.getNombreComercial(),
                m.getPrincipioActivo(), m.getPresentacion(), m.getStock(), m.getPrecio(), esp, m.isActivo());
    }
}
