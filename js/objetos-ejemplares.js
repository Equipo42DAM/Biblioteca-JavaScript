"use strict";

class Ejemplar {
    #idEjemplar;
    #idLibro;
    #idEstado;
    #codigoBarras;
    #signatura;
    #numeroCopia;
    #esReferencia;
    #urlImagen;
    #fechaBaja;
    #tituloLibro;
    #isbn;
    #nombreEstado;
    #prestado;

    constructor(idEjemplar, idLibro, idEstado, codigoBarras, signatura = "", numeroCopia = 1, esReferencia = 0, urlImagen = "", fechaBaja = null, tituloLibro = "", isbn = "", nombreEstado = "", prestado = 0) {
        this.#idEjemplar = idEjemplar;
        this.#idLibro = idLibro;
        this.#idEstado = idEstado;
        this.#codigoBarras = codigoBarras;
        this.#signatura = signatura;
        this.#numeroCopia = numeroCopia;
        this.#esReferencia = esReferencia;
        this.#urlImagen = urlImagen;
        this.#fechaBaja = fechaBaja;
        this.#tituloLibro = tituloLibro;
        this.#isbn = isbn;
        this.#nombreEstado = nombreEstado;
        this.#prestado = prestado;
    }

    get idEjemplar() { return this.#idEjemplar; }
    set idEjemplar(valor) { this.#idEjemplar = valor; }

    get idLibro() { return this.#idLibro; }
    set idLibro(valor) { this.#idLibro = valor; }

    get idEstado() { return this.#idEstado; }
    set idEstado(valor) { this.#idEstado = valor; }

    get codigoBarras() { return this.#codigoBarras; }
    set codigoBarras(valor) { this.#codigoBarras = valor; }

    get signatura() { return this.#signatura; }
    set signatura(valor) { this.#signatura = valor; }

    get numeroCopia() { return this.#numeroCopia; }
    set numeroCopia(valor) { this.#numeroCopia = valor; }

    get esReferencia() { return this.#esReferencia; }
    set esReferencia(valor) { this.#esReferencia = valor; }

    get urlImagen() { return this.#urlImagen; }
    set urlImagen(valor) { this.#urlImagen = valor; }

    get fechaBaja() { return this.#fechaBaja; }
    set fechaBaja(valor) { this.#fechaBaja = valor; }

    get tituloLibro() { return this.#tituloLibro; }
    set tituloLibro(valor) { this.#tituloLibro = valor; }

    get isbn() { return this.#isbn; }
    set isbn(valor) { this.#isbn = valor; }

    get nombreEstado() { return this.#nombreEstado; }
    set nombreEstado(valor) { this.#nombreEstado = valor; }

    get prestado() { return this.#prestado; }
    set prestado(valor) { this.#prestado = valor; }

    toJSON() {
        return {
            idEjemplar:   this.#idEjemplar,
            idLibro:      this.#idLibro,
            idEstado:     this.#idEstado,
            codigoBarras: this.#codigoBarras,
            signatura:    this.#signatura,
            numeroCopia:  this.#numeroCopia,
            esReferencia: this.#esReferencia,
            urlImagen:    this.#urlImagen,
            fechaBaja:    this.#fechaBaja,
            tituloLibro:  this.#tituloLibro,
            isbn:         this.#isbn,
            nombreEstado: this.#nombreEstado,
            prestado:     this.#prestado,
        };
    }
}

class GestionEjemplares {
    async listadoEjemplares(buscar = "") {
        const datos = new FormData();
        datos.append("rol", sessionStorage.getItem("rol") || "usuario");
        datos.append("buscar", buscar);
        return await peticionPOST("ejemplares_listado.php", datos);
    }

    async catalogos() {
        return await peticionGET("ejemplares_catalogos.php");
    }

    async guardarEjemplar(oEjemplar) {
        const datos = new FormData();
        datos.append("ejemplar", JSON.stringify(oEjemplar));
        return await peticionPOST("ejemplares_guardar.php", datos);
    }

    // accion: "baja" | "alta"
    async cambiarEstadoEjemplar(idEjemplar, accion) {
        const datos = new FormData();
        datos.append("idEjemplar", idEjemplar);
        datos.append("accion", accion);
        return await peticionPOST("ejemplares_cambiar_estado.php", datos);
    }
}
