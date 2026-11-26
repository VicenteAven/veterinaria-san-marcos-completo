package cl.duoc.citas.controller;

import cl.duoc.citas.dto.ConsultaResponse;
import cl.duoc.citas.dto.ConsultaUpdateRequest;
import cl.duoc.citas.dto.VacunaProximaResponse;
import cl.duoc.citas.security.AuthUser;
import cl.duoc.citas.service.ConsultaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Mascotas y ficha clínica")
public class ConsultaController {

    private final ConsultaService service;

    public ConsultaController(ConsultaService service) {
        this.service = service;
    }

    @PutMapping("/consultas/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    @Operation(summary = "Edita diagnóstico, tratamiento y próximo control de una consulta")
    public ConsultaResponse editar(@PathVariable Long id, @Valid @RequestBody ConsultaUpdateRequest req) {
        return service.editar(id, req);
    }

    @GetMapping("/vacunaciones/proximas")
    @Operation(summary = "Vacunas con próxima dosis vencida o por vencer en los próximos N días (por defecto 30)")
    public List<VacunaProximaResponse> proximas(@AuthenticationPrincipal AuthUser user,
                                                @RequestParam(defaultValue = "30") @Min(1) @Max(365) int dias) {
        return service.proximas(user, dias);
    }
}
