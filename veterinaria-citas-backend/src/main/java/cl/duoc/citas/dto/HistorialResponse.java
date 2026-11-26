package cl.duoc.citas.dto;

import java.util.List;

public record HistorialResponse(MascotaResponse mascota, List<ConsultaResponse> consultas) {
}
