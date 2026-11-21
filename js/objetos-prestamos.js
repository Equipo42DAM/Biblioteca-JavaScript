"use strict";

class Prestamo {
    #idPrestamo;
    #idEjemplar;
    #tituloLibro;
    #fechaPrestamo;
    #fechaLimite;
    #fechaDevolucion;
    #observaciones;
    #importeFianza;
    #tieneFianza;
    #urlImagen;
    #fechaBaja;

    constructor(idPrestamo, idEjemplar, tituloLibro, fechaPrestamo, fechaLimite, fechaDevolucion, observaciones, importeFianza, tieneFianza, urlImagen) {
        this.#idPrestamo = idPrestamo;
        this.#idEjemplar = idEjemplar;
        this.#tituloLibro = tituloLibro;
        this.#fechaPrestamo = fechaPrestamo;
        this.#fechaLimite = fechaLimite;
        this.#fechaDevolucion = fechaDevolucion;
        this.#observaciones = observaciones;
        this.#importeFianza = importeFianza;
        this.#tieneFianza = tieneFianza;
        this.#urlImagen = urlImagen;
        this.#fechaBaja = null;
    }

    get idPrestamo() {return this.#idPrestamo;}
    set idPrestamo(valor) {this.#idPrestamo = valor;}

    get idEjemplar() {return this.#idEjemplar;}
    set idEjemplar(valor) {this.#idEjemplar = valor;}
    
    get tituloLibro() {return this.#tituloLibro;}
    set tituloLibro(valor) {this.#tituloLibro = valor;}

    get fechaPrestamo() {return this.#fechaPrestamo;}
    set fechaPrestamo(valor) {this.#fechaPrestamo = valor;} 
    
    get fechaLimite() {return this.#fechaLimite;}
    set fechaLimite(valor) {this.#fechaLimite = valor;}
    
    get fechaDevolucion() {return this.#fechaDevolucion;}
    set fechaDevolucion(valor) {this.#fechaDevolucion = valor;}
    
    get observaciones() {return this.#observaciones;}
    set observaciones(valor) {this.#observaciones = valor;}
    
    get importeFianza() {return this.#importeFianza;}
    set importeFianza(valor) {this.#importeFianza = valor;}
    
    get tieneFianza() {return this.#tieneFianza;}
    set tieneFianza(valor) {this.#tieneFianza = valor;}
    
    get urlImagen() {return this.#urlImagen;}
    set urlImagen(valor) {this.#urlImagen = valor;}
    
    get fechaBaja() {return this.#fechaBaja;}
    set fechaBaja(valor) {this.#fechaBaja = valor;}

    toJSON() {
        return {
            idPrestamo:      this.#idPrestamo,
            idEjemplar:      this.#idEjemplar,
            tituloLibro:     this.#tituloLibro,
            fechaPrestamo:   this.#fechaPrestamo,
            fechaLimite:     this.#fechaLimite,
            fechaDevolucion: this.#fechaDevolucion,
            observaciones:   this.#observaciones,
            importeFianza:   this.#importeFianza,
            tieneFianza:     this.#tieneFianza,
            urlImagen:       this.#urlImagen,
            fechaBaja:       this.#fechaBaja,
        };
    }
}

class Biblioteca {
    async crearPrestamo(oPrestamo){
        let datos = new FormData();
        datos.append("Prestamo", JSON.stringify(oPrestamo));
        let respuesta = await peticionPOST("crear_prestamo.php", datos);
        return respuesta;
    }

    async listadoPrestamos() {
        let respuesta = await peticionGET("prestamos_listado.php");
        return respuesta;
  }
}