const URL_ENDPOINT_LIBROS = "php/libros.php";
const gestorLibros = new GestorLibros(URL_ENDPOINT_LIBROS);
let listaLibros = [];

const toastEl = document.querySelector("#toastNotificacionLibros");
const toastBootstrap = toastEl ? new bootstrap.Toast(toastEl, { delay: 3000 }) : null;

function mostrarToastLibro(mensaje, tipo = "success") {
    if (!toastBootstrap || !toastEl) return;
    const cuerpo = document.querySelector("#toastMensajeLibros");
    toastEl.classList.remove("bg-success", "bg-danger", "bg-warning");
    toastEl.classList.add(tipo === "error" ? "bg-danger" : tipo === "warning" ? "bg-warning" : "bg-success");
    if (cuerpo) {
        cuerpo.textContent = mensaje;
    }
    toastBootstrap.show();
}

function inicializarSeccionLibros() {
    mostrarVistaListado();
    cargarEditorialesLibro();
    traerLibros();
}

async function cargarEditorialesLibro() {
    const select = document.querySelector("#select_editorial_bd");
    if (!select) return;

    const res = await gestorLibros.obtenerEditoriales();
    if (!res.ok || !res.datos || !res.datos.ok) return;

    const inputIdEditorial = document.querySelector("#id_editorial");
    const valorActual = inputIdEditorial ? inputIdEditorial.value : select.value;

    select.innerHTML = "<option value=''>Seleccionar editorial desde BD...</option>";
    (res.datos.datos || []).forEach((ed) => {
        const opt = document.createElement("option");
        opt.value = ed.id_editorial;
        opt.textContent = ed.nombre_editorial || ed.nombre || `Editorial #${ed.id_editorial}`;
        select.appendChild(opt);
    });

    if (valorActual) {
        select.value = valorActual;
    }
}

const formBusquedaLibros = document.querySelector("#formBusquedaLibros");
if (formBusquedaLibros) {
    formBusquedaLibros.addEventListener("submit", function (evento) {
        evento.preventDefault();
        let criterio = document.querySelector("#criterioLibros").value;
        let busqueda = document.querySelector("#busquedaLibros").value.trim();
        let filtroEspanolEl = document.querySelector("#filtroEspanol");
        let estaEspanol = filtroEspanolEl ? filtroEspanolEl.value : "";
        traerLibros(busqueda, criterio, estaEspanol);
    });
}

const filtroEspanolEl = document.querySelector("#filtroEspanol");
if (filtroEspanolEl) {
    filtroEspanolEl.addEventListener("change", function () {
        let criterio = document.querySelector("#criterioLibros").value;
        let busqueda = document.querySelector("#busquedaLibros").value.trim();
        traerLibros(busqueda, criterio, filtroEspanolEl.value);
    });
}

const btnLimpiarLibros = document.querySelector("#btnLimpiarLibros");
if (btnLimpiarLibros) {
    btnLimpiarLibros.addEventListener("click", function () {
        document.querySelector("#busquedaLibros").value = "";
        let filtroEl = document.querySelector("#filtroEspanol");
        if (filtroEl) filtroEl.value = "";
        traerLibros("", document.querySelector("#criterioLibros").value, "");
    });
}

const btnNuevoLibro = document.querySelector("#btnNuevoLibro");
if (btnNuevoLibro) {
    btnNuevoLibro.addEventListener("click", function () {
        mostrarVistaFormulario(null);
    });
}

const btnCancelarLibro = document.querySelector("#btnCancelarLibro");
if (btnCancelarLibro) {
    btnCancelarLibro.addEventListener("click", function () {
        mostrarVistaListado();
    });
}

const formLibro = document.querySelector("#formLibro");
if (formLibro) {
    formLibro.addEventListener("submit", guardarLibro);
}

const selectEditorialBd = document.querySelector("#select_editorial_bd");
if (selectEditorialBd) {
    selectEditorialBd.addEventListener("change", function () {
        const inputEditorial = document.querySelector("#id_editorial");
        if (inputEditorial && selectEditorialBd.value !== "") {
            inputEditorial.value = selectEditorialBd.value;
        }
    });
}

const cuerpoTablaLibros = document.querySelector("#cuerpoTablaLibros");
if (cuerpoTablaLibros) {
    cuerpoTablaLibros.addEventListener("click", function (evento) {
        let botonEstado = evento.target.closest(".btn-estado-libro");
        if (botonEstado) {
            evento.stopPropagation();
            let idLibro = botonEstado.getAttribute("data-id");
            let accion = botonEstado.getAttribute("data-accion");
            cambiarEstadoLibro(idLibro, accion);
            return;
        }

        let fila = evento.target.closest("tr[data-id]");
        if (fila) {
            let idLibro = fila.getAttribute("data-id");
            let libroEncontrado = null;
            for (let i = 0; i < listaLibros.length; i++) {
                if (String(listaLibros[i].id_libro) === String(idLibro)) {
                    libroEncontrado = listaLibros[i];
                    break;
                }
            }
            if (libroEncontrado) {
                mostrarVistaFormulario(libroEncontrado);
            }
        }
    });
}

async function traerLibros(busqueda = "", criterio = "titulo", estaEspanol = "") {
    let params = {};
    let tieneFiltro = false;

    if (busqueda !== "") {
        params.busqueda = busqueda;
        params.criterio = criterio;
        tieneFiltro = true;
    }

    if (estaEspanol !== "") {
        params.esta_espanol = estaEspanol;
        tieneFiltro = true;
    }

    let btnLimpiar = document.querySelector("#btnLimpiarLibros");
    if (btnLimpiar) {
        btnLimpiar.classList.toggle("d-none", !tieneFiltro);
    }

    let response = await gestorLibros.listar(params);
    procesarRespuestaLibros(response, tieneFiltro);
}

function procesarRespuestaLibros(response, esBusqueda) {
    let alertas = document.querySelector("#alertas-libros");

    if (!response.ok || !response.datos || !response.datos.ok) {
        let textoError = response.datos && response.datos.mensaje ? response.datos.mensaje : response.mensaje;
        if (alertas) {
            alertas.innerHTML = "<div class='alert alert-danger'>" + textoError + " (" + response.status + ")</div>";
        }
        mostrarToastLibro(textoError, "error");
        return;
    }

    listaLibros = (response.datos.datos || []).map((item) => new Libro(item));
    document.querySelector("#badgeTotalLibros").innerHTML = "Total: " + listaLibros.length;

    let tbody = document.querySelector("#cuerpoTablaLibros");
    if (listaLibros.length === 0) {
        let msg = esBusqueda
            ? "No hay libros registrados con ese criterio de búsqueda."
            : "No hay libros registrados.";
        tbody.innerHTML = "<tr><td colspan='10' class='text-center py-4 text-muted'>" + msg + "</td></tr>";
        return;
    }

    let htmlFilas = "";
    for (let i = 0; i < listaLibros.length; i++) {
        let libro = listaLibros[i];
        let esActivo = libro.estaActivo();
        let claseFila = esActivo ? "" : "table-secondary";

        let fotoHtml = libro.url_imagen
            ? "<img src='" + libro.url_imagen + "' alt='Portada' width='45' height='60' class='img-thumbnail object-fit-cover'>"
            : "<span class='badge bg-secondary'>Sin foto</span>";

        let estadoHtml = esActivo
            ? "<span class='badge bg-success'>Activo</span>"
            : "<span class='badge bg-danger'>Inactivo</span>";

        let fechaBajaHtml = esActivo
            ? "<em>NULL</em>"
            : "<em>" + libro.fecha_baja + "</em>";

        let espanolHtml = "<span class='badge bg-secondary'>Desconocido</span>";
        if (libro.esta_espanol !== null && libro.esta_espanol !== "") {
            espanolHtml = Number(libro.esta_espanol) === 1
                ? "<span class='badge bg-primary'>Sí</span>"
                : "<span class='badge bg-warning text-dark'>No</span>";
        }

        let editorialTexto = libro.nombre_editorial
            ? libro.nombre_editorial + " (" + libro.id_editorial + ")"
            : libro.id_editorial;

        let botonEstadoHtml = esActivo
            ? "<button type='button' class='btn btn-sm btn-outline-warning btn-estado-libro' data-id='" + libro.id_libro + "' data-accion='baja'>Baja</button>"
            : "<button type='button' class='btn btn-sm btn-outline-success btn-estado-libro' data-id='" + libro.id_libro + "' data-accion='alta'>Alta</button>";

        htmlFilas += "<tr class='" + claseFila + "' role='button' data-id='" + libro.id_libro + "' title='Haz clic en la fila para editar'>";
        htmlFilas += "<td>" + fotoHtml + "</td>";
        htmlFilas += "<td>" + libro.id_libro + "</td>";
        htmlFilas += "<td class='fw-bold'>" + libro.titulo + "</td>";
        htmlFilas += "<td>" + libro.isbn + "</td>";
        htmlFilas += "<td>" + (libro.anio_edicion ? libro.anio_edicion : "") + "</td>";
        htmlFilas += "<td><span class='badge bg-info text-dark'>" + editorialTexto + "</span></td>";
        htmlFilas += "<td>" + estadoHtml + "</td>";
        htmlFilas += "<td class='text-muted'>" + fechaBajaHtml + "</td>";
        htmlFilas += "<td>" + espanolHtml + "</td>";
        htmlFilas += "<td class='text-center text-nowrap'>" + botonEstadoHtml + "</td>";
        htmlFilas += "</tr>";
    }

    tbody.innerHTML = htmlFilas;
}

async function guardarLibro(evento) {
    evento.preventDefault();

    let form = document.querySelector("#formLibro");
    let formData = new FormData(form);

    let response = await gestorLibros.guardar(formData);
    let alertas = document.querySelector("#alertas-libros");

    if (!response.ok || !response.datos || !response.datos.ok) {
        let errorMsg = response.datos && response.datos.mensaje ? response.datos.mensaje : "Error al guardar el libro.";
        if (alertas) {
            alertas.innerHTML = "<div class='alert alert-warning'>" + errorMsg + "</div>";
        }
        mostrarToastLibro(errorMsg, "warning");
        return;
    }

    if (alertas) {
        alertas.innerHTML = "<div class='alert alert-success'>" + response.datos.mensaje + "</div>";
    }
    mostrarToastLibro(response.datos.mensaje, "success");
    mostrarVistaListado();
    let criterio = document.querySelector("#criterioLibros").value;
    let busqueda = document.querySelector("#busquedaLibros").value.trim();
    let filtroEl = document.querySelector("#filtroEspanol");
    let estaEspanol = filtroEl ? filtroEl.value : "";
    traerLibros(busqueda, criterio, estaEspanol);
}

async function cambiarEstadoLibro(idLibro, accion) {
    let response = await gestorLibros.cambiarEstado(idLibro, accion);
    let alertas = document.querySelector("#alertas-libros");

    if (!response.ok || !response.datos || !response.datos.ok) {
        let errorMsg = response.datos && response.datos.mensaje ? response.datos.mensaje : "No se pudo cambiar el estado.";
        if (alertas) {
            alertas.innerHTML = "<div class='alert alert-warning'>" + errorMsg + "</div>";
        }
        mostrarToastLibro(errorMsg, "warning");
        return;
    }

    if (alertas) {
        alertas.innerHTML = "<div class='alert alert-success'>" + response.datos.mensaje + "</div>";
    }
    mostrarToastLibro(response.datos.mensaje, "success");
    let criterio = document.querySelector("#criterioLibros").value;
    let busqueda = document.querySelector("#busquedaLibros").value.trim();
    let filtroEl = document.querySelector("#filtroEspanol");
    let estaEspanol = filtroEl ? filtroEl.value : "";
    traerLibros(busqueda, criterio, estaEspanol);
}

function mostrarVistaListado() {
    document.querySelector("#vista-formulario-libro").classList.add("d-none");
    document.querySelector("#vista-listado-libros").classList.remove("d-none");
}

async function mostrarVistaFormulario(libro) {
    await cargarEditorialesLibro();
    let alertas = document.querySelector("#alertas-libros");
    if (alertas) {
        alertas.innerHTML = "";
    }
    document.querySelector("#formLibro").reset();

    const selectEd = document.querySelector("#select_editorial_bd");

    if (libro) {
        document.querySelector("#tituloFormularioLibro").innerHTML = "Editar Libro (ID: " + libro.id_libro + ")";
        document.querySelector("#btnGuardarLibro").textContent = "Actualizar Cambios";
        document.querySelector("#id_libro").value = libro.id_libro;
        document.querySelector("#titulo").value = libro.titulo;
        document.querySelector("#id_editorial").value = libro.id_editorial;
        if (selectEd) selectEd.value = libro.id_editorial;
        document.querySelector("#isbn").value = libro.isbn;
        document.querySelector("#anio_edicion").value = libro.anio_edicion ? libro.anio_edicion : "";
        document.querySelector("#fecha_baja").value = libro.fecha_baja ? libro.fecha_baja.substring(0, 10) : "";
        document.querySelector("#esta_espanol").value = Number(libro.esta_espanol) === 1 ? "1" : "0";

        if (libro.url_imagen) {
            document.querySelector("#avisoImagenActual").classList.remove("d-none");
        } else {
            document.querySelector("#avisoImagenActual").classList.add("d-none");
        }
    } else {
        document.querySelector("#tituloFormularioLibro").innerHTML = "Formulario de Nuevo Libro";
        document.querySelector("#btnGuardarLibro").textContent = "Guardar Libro";
        document.querySelector("#id_libro").value = "";
        if (selectEd) selectEd.value = "";
        document.querySelector("#esta_espanol").value = "1";
        document.querySelector("#avisoImagenActual").classList.add("d-none");
    }

    document.querySelector("#vista-listado-libros").classList.add("d-none");
    document.querySelector("#vista-formulario-libro").classList.remove("d-none");
}
