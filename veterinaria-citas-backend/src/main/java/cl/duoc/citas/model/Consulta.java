package cl.duoc.citas.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "consulta")
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "mascota_id", nullable = false)
    private Mascota mascota;

    @Column(name = "cita_id")
    private Long citaId;

    @Column(nullable = false)
    private LocalDate fecha;

    @Column(nullable = false, length = 500)
    private String diagnostico;

    @Column(length = 500)
    private String tratamiento;

    @Column(name = "peso_kg")
    private BigDecimal pesoKg;

    @Column(name = "proximo_control")
    private LocalDate proximoControl;

    @Column(name = "registrado_por", nullable = false)
    private Long registradoPor;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @OneToMany(mappedBy = "consulta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Vacunacion> vacunaciones = new ArrayList<>();

    @OneToMany(mappedBy = "consulta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Receta> recetas = new ArrayList<>();

    @PrePersist
    void antesDeGuardar() { if (creadoEn == null) creadoEn = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Mascota getMascota() { return mascota; }
    public void setMascota(Mascota mascota) { this.mascota = mascota; }
    public Long getCitaId() { return citaId; }
    public void setCitaId(Long citaId) { this.citaId = citaId; }
    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }
    public String getDiagnostico() { return diagnostico; }
    public void setDiagnostico(String diagnostico) { this.diagnostico = diagnostico; }
    public String getTratamiento() { return tratamiento; }
    public void setTratamiento(String tratamiento) { this.tratamiento = tratamiento; }
    public BigDecimal getPesoKg() { return pesoKg; }
    public void setPesoKg(BigDecimal pesoKg) { this.pesoKg = pesoKg; }
    public LocalDate getProximoControl() { return proximoControl; }
    public void setProximoControl(LocalDate proximoControl) { this.proximoControl = proximoControl; }
    public Long getRegistradoPor() { return registradoPor; }
    public void setRegistradoPor(Long registradoPor) { this.registradoPor = registradoPor; }
    public LocalDateTime getCreadoEn() { return creadoEn; }
    public void setCreadoEn(LocalDateTime creadoEn) { this.creadoEn = creadoEn; }
    public List<Vacunacion> getVacunaciones() { return vacunaciones; }
    public void setVacunaciones(List<Vacunacion> vacunaciones) { this.vacunaciones = vacunaciones; }
    public List<Receta> getRecetas() { return recetas; }
    public void setRecetas(List<Receta> recetas) { this.recetas = recetas; }
}
