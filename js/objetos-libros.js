class Libro {
    constructor({
        id_libro = null,
        id_editorial = "",
        nombre_editorial = "",
        titulo = "",
        isbn = "",
        anio_edicion = null,
        fecha_baja = null,
        esta_espanol = 1,
        url_imagen = null
    } = {}) {
        this.id_libro = id_libro;
        this.id_editorial = id_editorial;
        this.nombre_editorial = nombre_editorial;
        this.titulo = titulo;
        this.isbn = isbn;
        this.anio_edicion = anio_edicion;
        this.fecha_baja = fecha_baja;
        this.esta_espanol = Number(esta_espanol) === 1 ? 1 : 0;
        this.url_imagen = url_imagen;
    }

    estaActivo() {
        return !this.fecha_baja;
    }
}

class GestorLibros {
    constructor(endpoint = "php/libros.php") {
        this.endpoint = endpoint;
    }

    async listar(filtros = {}) {
        return await peticionAjax(this.endpoint, "GET", filtros);
    }

    async obtenerEditoriales() {
        return await peticionAjax(this.endpoint, "GET", { accion: "editoriales" });
    }

    async guardar(formData) {
        formData.append("accion", "guardar");
        return await peticionAjax(this.endpoint, "POST", formData);
    }

    async cambiarEstado(idLibro, accion) {
        const formData = new FormData();
        formData.append("accion", accion);
        formData.append("id_libro", idLibro);
        return await peticionAjax(this.endpoint, "POST", formData);
    }
}