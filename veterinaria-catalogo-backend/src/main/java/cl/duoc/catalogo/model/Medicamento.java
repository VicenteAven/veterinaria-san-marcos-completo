package cl.duoc.catalogo.model;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "medicamento")
public class Medicamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String codigo;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @Column(name = "nombre_comercial", nullable = false, length = 120)
    private String nombreComercial;

    @Column(name = "principio_activo", nullable = false, length = 120)
    private String principioActivo;

    @Column(nullable = false, length = 80)
    private String presentacion;

    @Column(nullable = false)
    private int stock;

    @Column(nullable = false)
    private int precio;

    @Column(nullable = false)
    private boolean activo;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "medicamento_especie", joinColumns = @JoinColumn(name = "medicamento_id"), inverseJoinColumns = @JoinColumn(name = "especie_id"))
    private Set<Especie> especies = new HashSet<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public Categoria getCategoria() { return categoria; }
    public void setCategoria(Categoria categoria) { this.categoria = categoria; }
    public String getNombreComercial() { return nombreComercial; }
    public void setNombreComercial(String nombreComercial) { this.nombreComercial = nombreComercial; }
    public String getPrincipioActivo() { return principioActivo; }
    public void setPrincipioActivo(String principioActivo) { this.principioActivo = principioActivo; }
    public String getPresentacion() { return presentacion; }
    public void setPresentacion(String presentacion) { this.presentacion = presentacion; }
    public int getStock() { return stock; }
    public void setStock(int stock) { this.stock = stock; }
    public int getPrecio() { return precio; }
    public void setPrecio(int precio) { this.precio = precio; }
    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }
    public Set<Especie> getEspecies() { return especies; }
    public void setEspecies(Set<Especie> especies) { this.especies = especies; }
}
