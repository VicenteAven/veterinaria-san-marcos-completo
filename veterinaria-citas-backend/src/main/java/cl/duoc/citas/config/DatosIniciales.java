package cl.duoc.citas.config;

import cl.duoc.citas.repository.MascotaRepository;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

/**
 * Carga los datos iniciales desde datos-citas.sql la primera vez que se inicia el servicio
 * (solo si la tabla mascota está vacía). Hibernate ya creó las tablas.
 */
@Configuration
public class DatosIniciales {

    private static final Logger log = LoggerFactory.getLogger(DatosIniciales.class);

    @Bean
    CommandLineRunner cargarDatos(MascotaRepository repo, DataSource dataSource) {
        return args -> {
            if (repo.count() == 0) {
                ResourceDatabasePopulator populator = new ResourceDatabasePopulator(new ClassPathResource("datos-citas.sql"));
                populator.setSqlScriptEncoding("UTF-8");
                populator.execute(dataSource);
                log.info("Datos iniciales cargados desde datos-citas.sql");
            }
        };
    }
}
