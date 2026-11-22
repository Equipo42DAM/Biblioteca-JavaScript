"use strict";

/**
 * Clase Pais: contiene lo necesario para la creación de un objeto Pais
 */
class Pais {
    constructor(idPais, nombrePais) {
        this.idPais = idPais
        this.nombrePais = nombrePais
    }

    getIdPais() {
        return this.idPais
    }

    setIdPais(idPais) {
        this.idPais = idPais
    }

    getNombrePais() {
        return this.nombrePais
    }

    setNombrePais(nombrePais) {
        this.nombrePais = nombrePais
    }
}

/**
 * Clase Editorial: contiene lo necesario para la creación de un objeto Editorial
 * 
 * 'idPais' es asignado como la clave foránea de la clase Pais
 */
class Editorial {
    constructor(idPais, nombre, contacto, urlimagen, edita_espanol, anno_origen) {
        this.idPais = idPais
        this.nombre = nombre
        this.contacto = contacto
        this.urlimagen = urlimagen
        this.edita_espanol = edita_espanol
        this.anno_origen = anno_origen
    }

    getIdPais() {
        return this.idPais
    }

    setIdPais(idPais) {
        this.idPais = idPais
    }

    getNombre() {
        return this.nombre
    }

    setNombre(nombre) {
        this.nombre = nombre
    }

    getContacto() {
        return this.contacto
    }

    setContacto(contacto) {
        this.contacto = contacto
    }

    getUrlimagen() {
        return this.urlimagen
    }

    setUrlimagen(urlimagen) {
        this.urlimagen = urlimagen
    }

    isEdita_espanol() {
        return this.edita_espanol
    }

    setEdita_espanol(edita_espanol) {
        this.edita_espanol = edita_espanol
    }

    getAnno_origen() {
        return this.anno_origen
    }

    setAnno_origen(anno_origen) {
        this.anno_origen = anno_origen
    }
}

/**
 * Clase encargada de empaquetar los datos vía fetch para ser procesados por el lado servidor (PHP)
 */
class GestorEditorial {

    // Función asíncrona para el alta de editorial
    async altaEditorial(oEditorial) {
        // Creamos un nuevo FormData y le añadimos los campos con getters
        let datosForm = new FormData();
        datosForm.append(oEditorial.getIdpais());
        datosForm.append(oEditorial.getNombre());
        datosForm.append(oEditorial.getContacto());
        datosForm.append(oEditorial.getUrlimagen());
        datosForm.append(oEditorial.isEdita_espanol());
        datosForm.append(oEditorial.getAnno_origen());

        // Creamos una petición para crear_editorial.php que será esperada. Sucede mediante POST
        let peticionFetch = await fetch(rutaBackend + "crear_editorial.php", {
            method: "POST",
            body: datosForm
        })

        // La respuesta de lado servidor llega en formato JSON
        let respuestaPhp = await peticionFetch.json();

        // Si algo ha ido mal, lanza un error con su respectivo código
        if (!peticionFetch.ok) {
            throw new error("El servidor falló (" + peticionFetch.status + "): " + respuestaPhp);
        }

        // Si no ha ido mal, muestra al usuario por pantalla
        alert("Editorial creada exitosamente.");
    }

    // Función asíncrona para la baja de editorial
    async bajaEditorial(oEditorial) {

        let datosForm = new FormData();
        datosForm.append(oEditorial.getIdpais());
        datosForm.append(oEditorial.getNombre());
        datosForm.append(oEditorial.getContacto());
        datosForm.append(oEditorial.getUrlimagen());
        datosForm.append(oEditorial.isEdita_espanol());
        datosForm.append(oEditorial.getAnno_origen());

        let peticionFetch = await fetch(rutaBackend + "eliminar_editorial.php", {
            method: "POST",
            body: datosForm
        })

        let respuestaPhp = await peticionFetch.json();

        if (!peticionFetch.ok) {
            throw new error("El servidor falló (" + peticionFetch.status + "): " + respuestaPhp);
        }

        alert("Editorial eliminada exitosamente.");
    }

    // Función asíncrona para la modificación de una editorial
    async modificarEditorial(oEditorial) {

        let datosForm = new FormData();
        datosForm.append(oEditorial.getIdpais());
        datosForm.append(oEditorial.getNombre());
        datosForm.append(oEditorial.getContacto());
        datosForm.append(oEditorial.getUrlimagen());
        datosForm.append(oEditorial.isEdita_espanol());
        datosForm.append(oEditorial.getAnno_origen());

        let peticionFetch = await fetch(rutaBackend + "modificar_editorial.php", {
            method: "POST",
            body: datosForm
        })

        let respuestaPhp = await peticionFetch.json();

        if (!peticionFetch.ok) {
            throw new error("El servidor falló (" + peticionFetch.status + "): " + respuestaPhp);
        }

        alert("Editorial modificada exitosamente")
    }
}