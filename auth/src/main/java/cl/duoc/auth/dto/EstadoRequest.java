package cl.duoc.auth.dto;

import jakarta.validation.constraints.NotNull;

public record EstadoRequest(@NotNull(message = "Debes indicar si el usuario queda activo") Boolean activo) {
}
