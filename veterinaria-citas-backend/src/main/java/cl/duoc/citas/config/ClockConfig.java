package cl.duoc.citas.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/** Reloj de la clínica (hora de Chile). Inyectarlo permite probar las reglas de agenda con una hora fija. */
@Configuration
public class ClockConfig {

    @Bean
    Clock clock() {
        return Clock.system(ZoneId.of("America/Santiago"));
    }
}
