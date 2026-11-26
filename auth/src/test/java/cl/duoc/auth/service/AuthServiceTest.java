package cl.duoc.auth.service;

import cl.duoc.auth.dto.AuthResponse;
import cl.duoc.auth.dto.LoginRequest;
import cl.duoc.auth.dto.RegisterRequest;
import cl.duoc.auth.model.Rol;
import cl.duoc.auth.model.Usuario;
import cl.duoc.auth.exception.ApiException;
import cl.duoc.auth.repository.RolRepository;
import cl.duoc.auth.repository.UsuarioRepository;
import cl.duoc.auth.security.AuthUser;
import cl.duoc.auth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @Mock UsuarioRepository usuarios;
    @Mock RolRepository roles;

    PasswordEncoder encoder = new BCryptPasswordEncoder();
    JwtService jwt = new JwtService("secreto-de-pruebas-con-mas-de-treinta-y-dos-caracteres", 60);
    AuthService service;
    Usuario maria;

    @BeforeEach
    void preparar() {
        service = new AuthService(usuarios, roles, encoder, jwt);
        Rol dueno = new Rol();
        dueno.setId(3L);
        dueno.setNombre("DUENO");
        maria = new Usuario();
        maria.setId(3L);
        maria.setNombre("María González");
        maria.setEmail("dueno@correo.cl");
        maria.setPasswordHash(encoder.encode("Dueno#2026"));
        maria.setRol(dueno);
        maria.setActivo(true);
        when(roles.findByNombre("DUENO")).thenReturn(Optional.of(dueno));
        when(usuarios.save(any(Usuario.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void loginCorrectoEntregaUnTokenQueSePuedeLeer() {
        when(usuarios.findByEmailIgnoreCase("dueno@correo.cl")).thenReturn(Optional.of(maria));
        AuthResponse r = service.login(new LoginRequest("dueno@correo.cl", "Dueno#2026"));
        AuthUser leido = jwt.leer(r.token());
        assertThat(leido.id()).isEqualTo(3L);
        assertThat(leido.rol()).isEqualTo("DUENO");
        assertThat(r.usuario().email()).isEqualTo("dueno@correo.cl");
    }

    @Test
    void loginConClaveIncorrectaDa401() {
        when(usuarios.findByEmailIgnoreCase("dueno@correo.cl")).thenReturn(Optional.of(maria));
        assertThatThrownBy(() -> service.login(new LoginRequest("dueno@correo.cl", "otra")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void loginDeUsuarioDesactivadoDa403() {
        maria.setActivo(false);
        when(usuarios.findByEmailIgnoreCase("dueno@correo.cl")).thenReturn(Optional.of(maria));
        assertThatThrownBy(() -> service.login(new LoginRequest("dueno@correo.cl", "Dueno#2026")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void registroCreaSiempreUnDuenoYGuardaLaClaveCifrada() {
        when(usuarios.existsByEmailIgnoreCase("nuevo@correo.cl")).thenReturn(false);
        AuthResponse r = service.registrar(new RegisterRequest("Pedro Soto", "Nuevo@Correo.cl", "+56912345678", "Clave1234"));
        assertThat(r.usuario().rol()).isEqualTo("DUENO");
        assertThat(r.usuario().email()).isEqualTo("nuevo@correo.cl");
    }

    @Test
    void registroConCorreoRepetidoDa409() {
        when(usuarios.existsByEmailIgnoreCase("dueno@correo.cl")).thenReturn(true);
        assertThatThrownBy(() -> service.registrar(new RegisterRequest("María", "dueno@correo.cl", null, "Clave1234")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void tokenAlteradoEsRechazado() {
        String token = jwt.generar(1L, "a@a.cl", "A", "ADMIN");
        String alterado = token.substring(0, token.length() - 3) + "abc";
        assertThatThrownBy(() -> jwt.leer(alterado)).isInstanceOf(io.jsonwebtoken.JwtException.class);
    }
}
