package cl.duoc.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 3, max = 100, message = "El nombre debe tener entre 3 y 100 caracteres")
        String nombre,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        String email,

        @Pattern(regexp = "^$|^(\\+?56)?9\\d{8}$", message = "El teléfono debe ser un celular chileno (ej: +56912345678)")
        String telefono,

        @Size(max = 72, message = "La contraseña es demasiado larga")
        String password,

        @NotBlank(message = "El rol es obligatorio")
        @Pattern(regexp = "ADMIN|RECEPCIONISTA|DUENO", message = "El rol debe ser ADMIN, RECEPCIONISTA o DUENO")
        String rol
) {
}
