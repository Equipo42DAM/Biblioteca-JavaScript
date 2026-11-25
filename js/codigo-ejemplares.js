"use strict";

const oGestionEjemplares = new GestionEjemplares();
let listaEjemplares = [];
let idEjemplarEditando = null;
let busquedaEjemplares = "";

function escaparHtml(valor) {
    const div = document.createElement("div");
    div.textContent = valor ?? "";
    return div.innerHTML.replace(/"/g, "&quot;");
}

// Prepara el contenedor de la sección (sustituye el marcador de posición del HTML)
function prepararSeccionEjemplares() {
    const seccion = document.querySelector("#sec-ejemplares");
    if (!seccion) return null;

    let cont = document.querySelector("#contenidoEjemplares");
    if (!cont) {
        seccion.innerHTML = `
            <div class="border-bottom border-dark-subtle pb-2 mb-3">
                <h2 class="h4 fw-bold text-dark mb-0">
                    <i class="bi bi-qr-code-scan text-success me-2"></i>
                    Mantenimiento de Ejemplares
                </h2>
                <p class="text-muted mb-0">Registro y control de las copias de la biblioteca.</p>
            </div>
            <div id="contenidoEjemplares"></div>
        `;
        cont = document.querySelector("#contenidoEjemplares");
    }
    return cont;
}

async function mostrarListadoEjemplares() {
    const cont = prepararSeccionEjemplares();
    if (!cont) return;

    idEjemplarEditando = null;
    const respuesta = await oGestionEjemplares.listadoEjemplares(busquedaEjemplares);
    const filas = respuesta.datos ?? [];

    listaEjemplares = filas.map(
        (f) =>
            new Ejemplar(
                f.id_ejemplar,
                f.id_libro,
                f.id_estado,
                f.codigo_barras,
                f.signatura ?? "",
                f.numero_copia,
                f.es_referencia,
                f.url_imagen ?? "",
                f.fecha_baja,
                f.titulo,
                f.isbn,
                f.nombre_estado,
                f.prestado
            )
    );

    const cuerpo = listaEjemplares.map((e) => {
        const deBaja = e.fechaBaja !== null;
        const situacion = deBaja
            ? `<span class="badge bg-secondary">De baja</span>`
            : Number(e.prestado) === 1
                ? `<span class="badge bg-warning text-dark">Prestado</span>`
                : `<span class="badge bg-success">Activo</span>`;
        const botonEstado = deBaja
            ? `<button type="button" class="btn btn-success btn-sm btn-reactivar-ejemplar" data-id="${e.idEjemplar}" title="Reactivar"><i class="bi bi-arrow-counterclockwise"></i></button>`
            : `<button type="button" class="btn btn-danger btn-sm btn-baja-ejemplar" data-id="${e.idEjemplar}" title="${Number(e.prestado) === 1 ? "Tiene un préstamo pendiente" : "Dar de baja"}" ${Number(e.prestado) === 1 ? "disabled" : ""}><i class="bi bi-archive"></i></button>`;

        return `
            <tr>
                <td class="text-center">${e.idEjemplar}</td>
                <td>${escaparHtml(e.tituloLibro)}<br><small class="text-muted">${escaparHtml(e.isbn)}</small></td>
                <td>${escaparHtml(e.codigoBarras)}</td>
                <td>${escaparHtml(e.signatura)}</td>
                <td class="text-center">${e.numeroCopia}</td>
                <td>${escaparHtml(e.nombreEstado)}</td>
                <td class="text-center">${Number(e.esReferencia) === 1 ? "Sí" : "No"}</td>
                <td class="text-center">${situacion}</td>
                <td class="text-nowrap">
                    <button type="button" class="btn btn-warning btn-sm btn-editar-ejemplar" data-id="${e.idEjemplar}" title="Editar"><i class="bi bi-pencil-square"></i></button>
                    ${botonEstado}
                </td>
            </tr>
        `;
    }).join("");

    cont.innerHTML = `
        <div class="d-flex flex-wrap gap-2 mb-3">
            <button type="button" class="btn btn-success shadow" id="btnNuevoEjemplar">
                <i class="bi bi-plus-circle me-1"></i> Nuevo Ejemplar
            </button>
            <input class="form-control flex-grow-1 w-auto" id="txtBuscarEjemplar" placeholder="Título, ISBN, código o signatura" value="${escaparHtml(busquedaEjemplares)}">
            <button type="button" class="btn btn-primary" id="btnBuscarEjemplar">Buscar</button>
            ${busquedaEjemplares !== "" ? `<button type="button" class="btn btn-outline-secondary" id="btnLimpiarBusquedaEjemplar">Limpiar</button>` : ""}
            <span class="badge bg-secondary align-self-center">Total: ${listaEjemplares.length}</span>
        </div>
        <div class="table-responsive rounded border">
            ${!respuesta.ok || listaEjemplares.length === 0
                ? `<div class="alert alert-info text-center mb-0" role="alert">${escaparHtml(respuesta.mensaje || "No se encontraron ejemplares.")}</div>`
                : `<table class="table table-striped table-hover align-middle small mb-0">
                    <thead class="table-dark">
                        <tr>
                            <th class="text-center">ID</th><th>Libro</th><th>Código</th><th>Signatura</th>
                            <th class="text-center">Copia</th><th>Conservación</th><th class="text-center">Referencia</th>
                            <th class="text-center">Situación</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>${cuerpo}</tbody>
                </table>`}
        </div>
    `;

    registrarEventosEjemplares();
}

function registrarEventosEjemplares() {
    document.querySelector("#btnNuevoEjemplar").addEventListener("click", () => mostrarFormularioEjemplar(null));
    document.querySelector("#btnBuscarEjemplar").addEventListener("click", buscarEjemplares);
    document.querySelector("#txtBuscarEjemplar").addEventListener("keydown", (e) => {
        if (e.key === "Enter") buscarEjemplares();
    });
    document.querySelector("#btnLimpiarBusquedaEjemplar")?.addEventListener("click", () => {
        busquedaEjemplares = "";
        mostrarListadoEjemplares();
    });
    document.querySelectorAll(".btn-editar-ejemplar").forEach((b) =>
        b.addEventListener("click", () => mostrarFormularioEjemplar(b.dataset.id)));
    document.querySelectorAll(".btn-baja-ejemplar").forEach((b) =>
        b.addEventListener("click", () => cambiarEstadoEjemplar(b.dataset.id, "baja")));
    document.querySelectorAll(".btn-reactivar-ejemplar").forEach((b) =>
        b.addEventListener("click", () => cambiarEstadoEjemplar(b.dataset.id, "alta")));
}

function buscarEjemplares() {
    busquedaEjemplares = document.querySelector("#txtBuscarEjemplar").value.trim();
    mostrarListadoEjemplares();
}

async function mostrarFormularioEjemplar(idEjemplar) {
    const cont = prepararSeccionEjemplares();
    const ejemplar = idEjemplar !== null
        ? listaEjemplares.find((e) => String(e.idEjemplar) === String(idEjemplar))
        : null;
    if (idEjemplar !== null && !ejemplar) return;

    const respuesta = await oGestionEjemplares.catalogos();
    if (!respuesta.ok) {
        notificaciones(respuesta);
        return;
    }
    const { libros, estados } = respuesta.datos;
    idEjemplarEditando = ejemplar ? ejemplar.idEjemplar : null;

    const optionsLibros = libros
        .filter((l) => l.fecha_baja === null || String(l.id_libro) === String(ejemplar?.idLibro))
        .map((l) => `<option value="${l.id_libro}" ${String(l.id_libro) === String(ejemplar?.idLibro) ? "selected" : ""}>${escaparHtml(l.titulo)} (ID: ${l.id_libro})${l.fecha_baja !== null ? " - De baja" : ""}</option>`)
        .join("");
    const optionsEstados = estados
        .map((s) => `<option value="${s.id_estado}" ${String(s.id_estado) === String(ejemplar?.idEstado) ? "selected" : ""}>${escaparHtml(s.nombre_estado)}</option>`)
        .join("");

    cont.innerHTML = `
        <div class="card shadow-lg mx-auto">
            <div class="card-header d-flex justify-content-center align-items-center bg-dark">
                <h5 class="card-title mb-0 text-light">${ejemplar ? "Editar ejemplar" : "Nuevo ejemplar"}</h5>
            </div>
            <div class="card-body bg-light">
                <form id="frmEjemplar" name="frmEjemplar" novalidate>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label for="lstLibroEjemplar" class="form-label fw-bold">Libro *</label>
                            <select class="form-select" id="lstLibroEjemplar" name="lstLibroEjemplar" required>
                                <option value="">Selecciona un libro</option>${optionsLibros}
                            </select>
                            <div class="form-text">No se puede cambiar el libro si el ejemplar tiene historial de préstamos.</div>
                        </div>
                        <div class="col-md-6">
                            <label for="lstEstadoEjemplar" class="form-label fw-bold">Estado de conservación *</label>
                            <select class="form-select" id="lstEstadoEjemplar" name="lstEstadoEjemplar" required>
                                <option value="">Selecciona un estado</option>${optionsEstados}
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="codigoBarras" class="form-label fw-bold">Código de barras *</label>
                            <input class="form-control" id="codigoBarras" name="codigoBarras" maxlength="50" required value="${escaparHtml(ejemplar?.codigoBarras)}">
                        </div>
                        <div class="col-md-4">
                            <label for="signatura" class="form-label fw-bold">Signatura</label>
                            <input class="form-control" id="signatura" name="signatura" maxlength="50" value="${escaparHtml(ejemplar?.signatura)}">
                        </div>
                        <div class="col-md-4">
                            <label for="numeroCopia" class="form-label fw-bold">Número de copia *</label>
                            <input type="number" class="form-control" id="numeroCopia" name="numeroCopia" min="1" required value="${ejemplar ? ejemplar.numeroCopia : 1}">
                        </div>
                        <div class="col-md-8">
                            <label for="urlImagenEjemplar" class="form-label fw-bold">Ruta o URL de la imagen</label>
                            <input class="form-control" id="urlImagenEjemplar" name="urlImagenEjemplar" maxlength="255" value="${escaparHtml(ejemplar?.urlImagen)}">
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" id="esReferencia" name="esReferencia" ${Number(ejemplar?.esReferencia) === 1 ? "checked" : ""}>
                                <label class="form-check-label" for="esReferencia">Ejemplar de referencia</label>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex justify-content-end gap-2 mt-4">
                        <button type="button" id="btnCancelarEjemplar" class="btn btn-dark">Cancelar</button>
                        <button type="submit" id="btnGuardarEjemplar" class="btn btn-success">Guardar ejemplar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.querySelector("#btnCancelarEjemplar").addEventListener("click", mostrarListadoEjemplares);
    document.querySelector("#frmEjemplar").addEventListener("submit", procesarEjemplar);
}

async function procesarEjemplar(evento) {
    evento.preventDefault();
    const frm = document.querySelector("#frmEjemplar");

    const idLibro = frm.lstLibroEjemplar.value;
    const idEstado = frm.lstEstadoEjemplar.value;
    const codigo = frm.codigoBarras.value.trim();
    const copia = frm.numeroCopia.value.trim();

    if (!idLibro || !idEstado || !codigo || !copia || Number(copia) < 1) {
        notificaciones({ ok: false, mensaje: "Revisa los campos obligatorios. El número de copia debe ser positivo." });
        return;
    }

    const oEjemplar = new Ejemplar(
        idEjemplarEditando,
        idLibro,
        idEstado,
        codigo,
        frm.signatura.value.trim(),
        copia,
        frm.esReferencia.checked ? 1 : 0,
        frm.urlImagenEjemplar.value.trim()
    );

    const respuesta = await oGestionEjemplares.guardarEjemplar(oEjemplar);
    notificaciones(respuesta);

    if (respuesta?.ok) {
        await mostrarListadoEjemplares();
    }
}

// Muestra el modal de confirmación y devuelve una promesa con true/false
function confirmarEstadoEjemplar(ejemplar, accion) {
    return new Promise((resolve) => {
        const esAlta = accion === "alta";
        let modalEl = document.querySelector("#modalEstadoEjemplar");
        modalEl?.remove();

        modalEl = document.createElement("div");
        modalEl.id = "modalEstadoEjemplar";
        modalEl.className = "modal fade";
        modalEl.tabIndex = -1;
        modalEl.setAttribute("aria-hidden", "true");
        modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content shadow-sm">
                    <div class="modal-header bg-dark text-white">
                        <h2 class="modal-title fs-5">${esAlta ? "Reactivar ejemplar" : "Dar de baja ejemplar"}</h2>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <p>${esAlta ? "¿Confirmas que deseas reactivar este ejemplar?" : "¿Confirmas que deseas dar de baja este ejemplar?"}</p>
                        <p class="mb-0"><strong>${escaparHtml(ejemplar?.tituloLibro)}</strong><br>
                        <span class="text-muted">Código: ${escaparHtml(ejemplar?.codigoBarras)}</span></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn ${esAlta ? "btn-success" : "btn-danger"}" id="btnConfirmarEstadoEjemplar">${esAlta ? "Reactivar" : "Dar de baja"}</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);

        const modal = new bootstrap.Modal(modalEl);
        let confirmado = false;
        modalEl.querySelector("#btnConfirmarEstadoEjemplar").addEventListener("click", () => {
            confirmado = true;
            modal.hide();
        });
        modalEl.addEventListener("hidden.bs.modal", () => {
            modalEl.remove();
            resolve(confirmado);
        });
        modal.show();
    });
}

async function cambiarEstadoEjemplar(idEjemplar, accion) {
    const ejemplar = listaEjemplares.find((e) => String(e.idEjemplar) === String(idEjemplar));
    if (!(await confirmarEstadoEjemplar(ejemplar, accion))) return;

    const respuesta = await oGestionEjemplares.cambiarEstadoEjemplar(idEjemplar, accion);
    notificaciones(respuesta);

    if (respuesta?.ok) {
        await mostrarListadoEjemplares();
    }
}

function seccionEjemplaresVisible() {
    return !document.querySelector("#sec-ejemplares")?.classList.contains("d-none");
}

document.querySelectorAll('[data-section="ejemplares"]').forEach((enlace) =>
    enlace.addEventListener("click", mostrarListadoEjemplares));

// Al cambiar el rol (login/logout admin) se recarga el listado si está visible
const badgeRol = document.querySelector("#badgeRolActual");
if (badgeRol) {
    new MutationObserver(() => {
        if (seccionEjemplaresVisible() && document.querySelector("#frmEjemplar") === null) {
            mostrarListadoEjemplares();
        }
    }).observe(badgeRol, { childList: true, characterData: true, subtree: true });
}

// Si se entra directamente por #ejemplares
document.addEventListener("DOMContentLoaded", () => {
    if (seccionEjemplaresVisible()) {
        mostrarListadoEjemplares();
    }
});
