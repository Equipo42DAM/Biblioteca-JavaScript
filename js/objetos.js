"use strict";

class Pais {
    #idPais;
    #nombrePais;

    constructor(idPais, nombrePais) {
        this.#idPais = idPais;
        this.#nombrePais = nombrePais;
    }

    get idPais() {
        return this.#idPais;
    }
    set idPais(valor) {
        this.#idPais = valor;
    }

    get nombrePais() {
        return this.#nombrePais;
    }
    set nombrePais(valor) {
        this.#nombrePais = valor;
    }

    toJSON() {
        return {
            idPais: this.#idPais,
            nombrePais: this.#nombrePais,
        };
    }
}

class Editorial {
    #idPais;
    #nombre;
    #contacto;
    #urlimagen;
    #edita_espanol;
    #anno_origen;

    constructor(idPais, nombre, contacto, urlimagen, edita_espanol, anno_origen) {
        this.#idPais = idPais;
        this.#nombre = nombre;
        this.#contacto = contacto;
        this.#urlimagen = urlimagen;
        this.#edita_espanol = edita_espanol;
        this.#anno_origen = anno_origen;
    }

    get idPais() {
        return this.#idPais;
    }
    set idPais(valor) {
        this.#idPais = valor;
    }

    get nombre() {
        return this.#nombre;
    }
    set nombre(valor) {
        this.#nombre = valor;
    }

    get contacto() {
        return this.#contacto;
    }
    set contacto(valor) {
        this.#contacto = valor;
    }

    get urlimagen() {
        return this.#urlimagen;
    }
    set urlimagen(valor) {
        this.#urlimagen = valor;
    }

    get edita_espanol() {
        return this.#edita_espanol;
    }
    set edita_espanol(valor) {
        this.#edita_espanol = valor;
    }

    get anno_origen() {
        return this.#anno_origen;
    }
    set anno_origen(valor) {
        this.#anno_origen = valor;
    }

    toJSON() {
        return {
            idPais: this.#idPais,
            nombre: this.#nombre,
            contacto: this.#contacto,
            urlimagen: this.#urlimagen,
            edita_espanol: this.#edita_espanol,
            anno_origen: this.#anno_origen,
        };
    }
}

class GestorEditorial {
    async altaEditorial(oEditorial) {
        let datos = new FormData();

        datos.append("editorial", JSON.stringify(oEditorial)); // $editorial = json_decode($_POST["editorial"])

        let respuesta = await peticionPOST("crear_editorial.php", datos);

        return respuesta;
    }

    async bajaEditorial(oEditorial) {
        let datos = new FormData();

        datos.append("editorial", JSON.stringify(oEditorial));

        let respuesta = await peticionPOST("eliminar_editorial.php", datos);

        return respuesta;
    }

    async modificarEditorial(oEditorial) {
        let datos = new FormData();

        datos.append("editorial", JSON.stringify(oEditorial));

        let respuesta = await peticionPOST("modificar_editorial.php", datos);

        return respuesta;
    }

    async getEditoriales() {
        return await peticionGET("get_editoriales.php", new FormData());
    }

    async getPaises() {
        return await peticionGET("get_paises.php", new FormData());
    }
}