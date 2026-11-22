const URL_ENDPOINT_LIBROS = "php/libros.php";
let listaLibros = [];

// =========================================================================
// 1. NAVEGACIÓN ENTRE SECCIONES (SPA)
// =========================================================================
let enlacesMenu = document.querySelectorAll("[data-section]");
for (let i = 0; i < enlacesMenu.length; i++) {
    enlacesMenu[i].addEventListener("click", function (evento) {
        evento.preventDefault();
        let seccion = enlacesMenu[i].getAttribute("data-section");
        mostrarSeccion(seccion);
    });
}

function mostrarSeccion(nombreSeccion) {
    let secciones = document.querySelectorAll(".seccion-spa");
    for (let i = 0; i < secciones.length; i++) {
        if (secciones[i].id === "sec-" + nombreSeccion) {
            secciones[i].classList.remove("d-none");
        } else {
            secciones[i].classList.add("d-none");
        }
    }

    for (let i = 0; i < enlacesMenu.length; i++) {
        if (enlacesMenu[i].getAttribute("data-section") === nombreSeccion) {
            enlacesMenu[i].classList.add("active");
        } else {
            enlacesMenu[i].classList.remove("active");
        }
    }

    if (nombreSeccion === "libros") {
        mostrarVistaListado();
        traerLibros();
    }
}

// =========================================================================
// 2. EVENTOS DE LIBROS (BÚSQUEDA, FORMULARIO Y TABLA)
// =========================================================================
document.querySelector("#formBusquedaLibros").addEventListener("submit", function (evento) {
    evento.preventDefault();
    let criterio = document.querySelector("#criterioLibros").value;
    let busqueda = document.querySelector("#busquedaLibros").value.trim();
    traerLibros(busqueda, criterio);
});

document.querySelector("#btnLimpiarLibros").addEventListener("click", function () {
    document.querySelector("#busquedaLibros").value = "";
    traerLibros("", document.querySelector("#criterioLibros").value);
});

document.querySelector("#btnNuevoLibro").addEventListener("click", function () {
    mostrarVistaFormulario(null);
});

document.querySelector("#btnCancelarLibro").addEventListener("click", function () {
    mostrarVistaListado();
});

document.querySelector("#formLibro").addEventListener("submit", guardarLibro);

document.querySelector("#cuerpoTablaLibros").addEventListener("click", function (evento) {
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

// =========================================================================
// 3. PETICIONES FETCH AL SERVIDOR (GET / POST)
// =========================================================================
async function traerLibros(busqueda = "", criterio = "titulo") {
    let oURL = new URL(URL_ENDPOINT_LIBROS, window.location.href);

    if (busqueda !== "") {
        oURL.searchParams.set("busqueda", busqueda);
        oURL.searchParams.set("criterio", criterio);
        document.querySelector("#btnLimpiarLibros").classList.remove("d-none");
    } else {
        document.querySelector("#btnLimpiarLibros").classList.add("d-none");
    }

    let respuestaServidor = await fetch(oURL, { method: "GET" });
    let response;

    if (!respuestaServidor.ok) {
        console.error("Error al acceder al servidor (STATUS != 200..299).");
        response = {
            ok: false,
            mensaje: "Error al acceder al servidor (STATUS != 200..299).",
            status: respuestaServidor.status,
            datos: null
        };
    } else {
        response = {
            ok: true,
            mensaje: "OK",
            status: respuestaServidor.status,
            datos: await respuestaServidor.json()
        };
    }

    procesarRespuestaLibros(response, busqueda !== "");
}

function procesarRespuestaLibros(response, esBusqueda) {
    let alertas = document.querySelector("#alertas-libros");

    if (!response.ok || !response.datos || !response.datos.ok) {
        let textoError = response.datos && response.datos.mensaje ? response.datos.mensaje : response.mensaje;
        alertas.innerHTML = "<div class='alert alert-danger'>" + textoError + " (" + response.status + ")</div>";
        return;
    }

    listaLibros = response.datos.datos || [];
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
        let esActivo = !libro.fecha_baja;
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

        let botonHtml = esActivo
            ? "<button type='button' class='btn btn-sm btn-outline-danger btn-estado-libro' data-id='" + libro.id_libro + "' data-accion='baja'>Dar de Baja</button>"
            : "<button type='button' class='btn btn-sm btn-outline-success btn-estado-libro' data-id='" + libro.id_libro + "' data-accion='alta'>Dar de Alta</button>";

        htmlFilas += "<tr class='" + claseFila + "' role='button' data-id='" + libro.id_libro + "' title='Haz clic en la fila para editar'>";
        htmlFilas += "<td>" + fotoHtml + "</td>";
        htmlFilas += "<td>" + libro.id_libro + "</td>";
        htmlFilas += "<td class='fw-bold'>" + libro.titulo + "</td>";
        htmlFilas += "<td>" + libro.isbn + "</td>";
        htmlFilas += "<td>" + (libro.anio_edicion ? libro.anio_edicion : "") + "</td>";
        htmlFilas += "<td><span class='badge bg-info text-dark'>ID: " + libro.id_editorial + "</span></td>";
        htmlFilas += "<td>" + estadoHtml + "</td>";
        htmlFilas += "<td class='text-muted'>" + fechaBajaHtml + "</td>";
        htmlFilas += "<td>" + espanolHtml + "</td>";
        htmlFilas += "<td class='text-center'>" + botonHtml + "</td>";
        htmlFilas += "</tr>";
    }

    tbody.innerHTML = htmlFilas;
}

async function guardarLibro(evento) {
    evento.preventDefault();

    let form = document.querySelector("#formLibro");
    let formData = new FormData(form);
    formData.append("accion", "guardar");

    let respuestaServidor = await fetch(URL_ENDPOINT_LIBROS, {
        method: "POST",
        body: formData
    });

    let response = {
        ok: respuestaServidor.ok,
        status: respuestaServidor.status,
        datos: await respuestaServidor.json()
    };

    let alertas = document.querySelector("#alertas-libros");
    if (!response.ok || !response.datos || !response.datos.ok) {
        let errorMsg = response.datos && response.datos.mensaje ? response.datos.mensaje : "Error al guardar el libro.";
        alertas.innerHTML = "<div class='alert alert-warning'>" + errorMsg + "</div>";
        return;
    }

    alertas.innerHTML = "<div class='alert alert-success'>" + response.datos.mensaje + "</div>";
    mostrarVistaListado();
    traerLibros(document.querySelector("#busquedaLibros").value.trim(), document.querySelector("#criterioLibros").value);
}

async function cambiarEstadoLibro(idLibro, accion) {
    let textoConfirm = accion === "baja"
        ? "¿Estás seguro de dar de baja este libro?"
        : "¿Deseas dar de alta este libro de nuevo?";

    if (!confirm(textoConfirm)) {
        return;
    }

    let formData = new FormData();
    formData.append("accion", accion);
    formData.append("id_libro", idLibro);

    let respuestaServidor = await fetch(URL_ENDPOINT_LIBROS, {
        method: "POST",
        body: formData
    });

    let response = {
        ok: respuestaServidor.ok,
        status: respuestaServidor.status,
        datos: await respuestaServidor.json()
    };

    let alertas = document.querySelector("#alertas-libros");
    if (!response.ok || !response.datos || !response.datos.ok) {
        let errorMsg = response.datos && response.datos.mensaje ? response.datos.mensaje : "No se pudo cambiar el estado.";
        alertas.innerHTML = "<div class='alert alert-warning'>" + errorMsg + "</div>";
        return;
    }

    alertas.innerHTML = "<div class='alert alert-success'>" + response.datos.mensaje + "</div>";
    traerLibros(document.querySelector("#busquedaLibros").value.trim(), document.querySelector("#criterioLibros").value);
}

// =========================================================================
// 4. CAMBIO DE VISTA (LISTADO / FORMULARIO)
// =========================================================================
function mostrarVistaListado() {
    document.querySelector("#vista-formulario-libro").classList.add("d-none");
    document.querySelector("#vista-listado-libros").classList.remove("d-none");
}

function mostrarVistaFormulario(libro) {
    document.querySelector("#alertas-libros").innerHTML = "";
    document.querySelector("#formLibro").reset();

    if (libro) {
        document.querySelector("#tituloFormularioLibro").innerHTML = "Editar Libro (ID: " + libro.id_libro + ")";
        document.querySelector("#btnGuardarLibro").textContent = "Actualizar Cambios";
        document.querySelector("#id_libro").value = libro.id_libro;
        document.querySelector("#titulo").value = libro.titulo;
        document.querySelector("#id_editorial").value = libro.id_editorial;
        document.querySelector("#isbn").value = libro.isbn;
        document.querySelector("#anio_edicion").value = libro.anio_edicion ? libro.anio_edicion : "";
        document.querySelector("#fecha_baja").value = libro.fecha_baja ? libro.fecha_baja : "";
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
        document.querySelector("#esta_espanol").value = "1";
        document.querySelector("#avisoImagenActual").classList.add("d-none");
    }

    document.querySelector("#vista-listado-libros").classList.add("d-none");
    document.querySelector("#vista-formulario-libro").classList.remove("d-none");
}

mostrarSeccion("inicio");