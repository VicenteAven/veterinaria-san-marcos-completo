package cl.duoc.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Registro público: siempre crea un usuario con rol DUENO. */
public record RegisterRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 3, max = 100, message = "El nombre debe tener entre 3 y 100 caracteres")
        @Pattern(regexp = "^[\\p{L}][\\p{L} .'-]*$", message = "El nombre solo puede contener letras y espacios")
        String nombre,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        @Size(max = 120, message = "El correo es demasiado largo")
        String email,

        @Pattern(regexp = "^$|^(\\+?56)?9\\d{8}$", message = "El teléfono debe ser un celular chileno (ej: +56912345678)")
        String telefono,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
        @Pattern(regexp = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)\\S+$",
                message = "La contraseña debe incluir mayúscula, minúscula y número, sin espacios")
        String password
) {
}
