package cl.duoc.auth.repository;

import cl.duoc.auth.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<Usuario> findAllByOrderByNombreAsc();

    List<Usuario> findByRolNombreAndActivoTrueOrderByNombreAsc(String rolNombre);
}
