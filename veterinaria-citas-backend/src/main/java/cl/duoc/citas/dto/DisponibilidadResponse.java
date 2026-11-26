package cl.duoc.citas.dto;

import java.util.List;

/** Bloques de 30 minutos de un día con los cupos que quedan en cada uno. */
public record DisponibilidadResponse(String fecha, List<Bloque> bloques) {

    public record Bloque(String hora, int cuposLibres) {
    }
}
