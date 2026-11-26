package cl.duoc.catalogo.repository;

import cl.duoc.catalogo.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByTipoOrderByNombreAsc(String tipo);

    List<Categoria> findAllByOrderByNombreAsc();
}
