package cl.duoc.auth.config;

import cl.duoc.auth.model.Rol;
import cl.duoc.auth.model.Usuario;
import cl.duoc.auth.repository.RolRepository;
import cl.duoc.auth.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Crea los 3 usuarios iniciales si la tabla está vacía (ids 1, 2 y 3, en este orden).
 * El usuario 3 es el dueño de demostración al que apuntan las mascotas de ejemplo de citas-service.
 */
@Component
public class DatosIniciales implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatosIniciales.class);

    private final UsuarioRepository usuarios;
    private final RolRepository roles;
    private final PasswordEncoder encoder;
    private final String passAdmin;
    private final String passRecepcion;
    private final String passDueno;

    public DatosIniciales(UsuarioRepository usuarios, RolRepository roles, PasswordEncoder encoder,
                      @Value("${app.seed.admin-password:Admin#2026}") String passAdmin,
                      @Value("${app.seed.recepcion-password:Recepcion#2026}") String passRecepcion,
                      @Value("${app.seed.dueno-password:Dueno#2026}") String passDueno) {
        this.usuarios = usuarios;
        this.roles = roles;
        this.encoder = encoder;
        this.passAdmin = passAdmin;
        this.passRecepcion = passRecepcion;
        this.passDueno = passDueno;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Roles en este orden: ADMIN=1, RECEPCIONISTA=2, DUENO=3
        for (String nombre : new String[]{"ADMIN", "RECEPCIONISTA", "DUENO"}) {
            if (roles.findByNombre(nombre).isEmpty()) {
                Rol r = new Rol();
                r.setNombre(nombre);
                roles.save(r);
            }
        }
        if (usuarios.count() > 0) {
            return;
        }
        crear("Administrador San Marcos", "admin@sanmarcos.cl", "+56911111111", passAdmin, "ADMIN");
        crear("Recepción San Marcos", "recepcion@sanmarcos.cl", "+56922222222", passRecepcion, "RECEPCIONISTA");
        crear("María González", "dueno@correo.cl", "+56933333333", passDueno, "DUENO");
        log.info("Usuarios iniciales creados: admin@sanmarcos.cl, recepcion@sanmarcos.cl, dueno@correo.cl");
    }

    private void crear(String nombre, String email, String telefono, String password, String rol) {
        Usuario u = new Usuario();
        u.setNombre(nombre);
        u.setEmail(email);
        u.setTelefono(telefono);
        u.setPasswordHash(encoder.encode(password));
        u.setRol(roles.findByNombre(rol).orElseThrow());
        u.setActivo(true);
        usuarios.save(u);
    }
}
