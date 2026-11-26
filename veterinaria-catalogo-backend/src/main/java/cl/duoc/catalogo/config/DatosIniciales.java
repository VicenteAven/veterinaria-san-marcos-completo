package cl.duoc.catalogo.config;

import cl.duoc.catalogo.repository.EspecieRepository;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

/**
 * Carga los datos iniciales desde datos-catalogo.sql la primera vez que se inicia el servicio
 * (solo si la tabla especie está vacía). Hibernate ya creó las tablas.
 */
@Configuration
public class DatosIniciales {

    private static final Logger log = LoggerFactory.getLogger(DatosIniciales.class);

    @Bean
    CommandLineRunner cargarDatos(EspecieRepository repo, DataSource dataSource) {
        return args -> {
            if (repo.count() == 0) {
                ResourceDatabasePopulator populator = new ResourceDatabasePopulator(new ClassPathResource("datos-catalogo.sql"));
                populator.setSqlScriptEncoding("UTF-8");
                populator.execute(dataSource);
                log.info("Datos iniciales cargados desde datos-catalogo.sql");
            }
        };
    }
}
