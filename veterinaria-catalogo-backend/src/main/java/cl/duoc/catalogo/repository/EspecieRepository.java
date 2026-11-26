package cl.duoc.catalogo.repository;

import cl.duoc.catalogo.model.Especie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EspecieRepository extends JpaRepository<Especie, Long> {
    Optional<Especie> findByNombreIgnoreCase(String nombre);
}
