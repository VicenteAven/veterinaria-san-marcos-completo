package cl.duoc.catalogo.controller;

import cl.duoc.catalogo.dto.MedicamentoRequest;
import cl.duoc.catalogo.dto.MedicamentoResponse;
import cl.duoc.catalogo.dto.StockRequest;
import cl.duoc.catalogo.security.AuthUser;
import cl.duoc.catalogo.service.MedicamentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medicamentos")
@Tag(name = "Medicamentos y vacunas")
public class MedicamentoController {

    private final MedicamentoService service;

    public MedicamentoController(MedicamentoService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Lista medicamentos y vacunas con filtros opcionales (q, especie, categoriaId)")
    public List<MedicamentoResponse> listar(@RequestParam(required = false) String q,
                                            @RequestParam(required = false) String especie,
                                            @RequestParam(required = false) Long categoriaId,
                                            @RequestParam(defaultValue = "false") boolean incluirInactivos,
                                            @AuthenticationPrincipal AuthUser user) {
        return service.listar(q, especie, categoriaId, incluirInactivos && user.esStaff());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalle de un medicamento")
    public MedicamentoResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Crea un medicamento (administrador)")
    public MedicamentoResponse crear(@Valid @RequestBody MedicamentoRequest req) {
        return service.crear(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Edita un medicamento (administrador)")
    public MedicamentoResponse actualizar(@PathVariable Long id, @Valid @RequestBody MedicamentoRequest req) {
        return service.actualizar(id, req);
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN','RECEPCIONISTA')")
    @Operation(summary = "Ajusta el stock (administrador y recepción)")
    public MedicamentoResponse stock(@PathVariable Long id, @Valid @RequestBody StockRequest req) {
        return service.ajustarStock(id, req.stock());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Desactiva un medicamento (baja lógica, administrador)")
    public void desactivar(@PathVariable Long id) {
        service.desactivar(id);
    }
}
