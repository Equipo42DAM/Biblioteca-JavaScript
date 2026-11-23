"use strict";

var oBiblioteca = new Biblioteca();
let listaPrestamos = [];
let idPrestamoEditando = null;

mostrarListadoPrestamos();

function registrarEventos() {
    document
        .querySelector("#mnuPrestamos")
        .addEventListener("click", mostrarListadoPrestamos);
    document
        .querySelector("#mnuMovilPrestamos")
        .addEventListener("click", mostrarListadoPrestamos);
    document
        .querySelector("#btnMostrarFrmPrestamo")
        .addEventListener("click", mostrarFormularios);
    document
        .querySelectorAll(".btnBajaPrestamo")
        .forEach((btn) => btn.addEventListener("click", cambiarEstadoPrestamo));
    document
        .querySelector("#lstTieneFianza")
        .addEventListener("change", comprobarFianza);
    document
        .querySelector("#btnGuardarPrestamo")
        .addEventListener("click", procesarPrestamo);
    document
        .querySelector("#btnCancelarPrestamo")
        .addEventListener("click", mostrarListadoPrestamos);
    document
        .querySelectorAll(".btn-editar")
        .forEach((btn) => btn.addEventListener("click", mostrarFormularios));
    document
        .querySelectorAll(".btn-reactivar")
        .forEach((btn) => btn.addEventListener("click", cambiarEstadoPrestamo));


}

function obtenerAccionBoton(boton, evento) {
    if (boton?.classList.contains("btn-editar")) return "btn-editar";
    if (boton?.classList.contains("btn-baja")) return "btn-baja";
    if (boton?.classList.contains("btn-reactivar")) return "btn-reactivar";
    if (boton?.classList.contains("btn-entregar")) return "btn-entregar";
    return boton?.id || evento.target.id || "";
}

function mostrarFormularios(oEvento) {
    let boton = oEvento.target.closest("a, button");
    let opcion = obtenerAccionBoton(boton, oEvento);
    let idPrestamo = boton?.dataset.id;

    ocultarFormularios();

    switch (opcion) {
        case "btnMostrarFrmPrestamo":
            idPrestamoEditando = null;
            frmPrestamo.reset();
            comprobarFianza();
            mostrarLibrosDisponibles();
            document.querySelector("#frmCardPrestamo").classList.remove("d-none");
            break;

        case "btn-editar": {
            const prestamo = listaPrestamos.find(
                (p) => String(p.idPrestamo) === String(idPrestamo)
            );
            if (!prestamo) break;

            idPrestamoEditando = prestamo.idPrestamo;
            cargarFormularioEdicion(prestamo);
            document.querySelector("#frmCardPrestamo").classList.remove("d-none");
            break;
        }
    }
}

function ocultarFormularios() {
    document.querySelector("#listadoPrestamos").innerHTML = "";
    document.querySelector("#listadoPrestamos").classList.remove("border");
    document.querySelector("#frmCardPrestamo").classList.add("d-none");
}

async function mostrarListadoPrestamos() {
    ocultarFormularios();
    let respuesta = await oBiblioteca.listadoPrestamos();

    const tabla = document.querySelector("#listadoPrestamos");
    const filas = respuesta.datos ?? [];
    tabla.classList.add("border");
    if (!respuesta.ok || filas.length === 0) {
        tabla.innerHTML = `
            <div class="alert alert-info text-center" role="alert">
                ${respuesta.mensaje || "No hay préstamos para mostrar."}
            </div>
        `;
        return;
    }

    const prestamos = filas.map(
        (fila) =>
            new Prestamo(
                fila.id_prestamo,
                fila.id_ejemplar,
                fila.titulo_libro,
                fila.fecha_prestamo,
                fila.fecha_limite,
                fila.fecha_devolucion,
                fila.observaciones,
                fila.importe_fianza,
                fila.tiene_fianza,
                fila.url_imagen,
                fila.fecha_baja
            )
    )

    const cuerpoTabla = prestamos.map(
        (p) => `
            <tr>
                <td class="text-center" style="width: 65px;">
                    ${p.urlImagen
                ? `<img src="${p.urlImagen}" alt="${p.tituloLibro ?? ""}" width="50" height="50" class="rounded object-fit-cover d-block mx-auto">`
                : `<span class="text-muted">-</span>`
            }
                </td>
                <td class="text-center">${p.idPrestamo ?? ""}</td>
                <td>${p.tituloLibro ?? ""}</td>
                <td class="text-center">${p.tieneFianza ? "<i class='bi bi-check-circle-fill text-success'></i>" : "<i class='bi bi-x-circle-fill text-danger'></i>"}</td>
                <td class="text-nowrap text-end">${p.importeFianza && p.tieneFianza ? `${p.importeFianza} €` : "-"}</td>
                <td>${p.observaciones ?? ""}</td>
                <td class="text-nowrap">${p.fechaPrestamo ?? ""}</td>
                <td class="text-nowrap">${p.fechaLimite ?? ""}</td>
                <td class="text-nowrap">${p.fechaDevolucion ?? "-"}</td>
                <td class="text-nowrap">${p.fechaBaja ?? "-"}</td>
                <td class="text-nowrap">
                    <button type="button" class="btn btn-warning btn-sm btn-editar" data-id="${p.idPrestamo}" title="Editar">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    ${p.fechaDevolucion === null ?
                `<button type="button" class="btn btn-primary btn-sm btn-entregar" data-id="${p.idPrestamo}" title="Entregar"><i class="bi bi-box-arrow-in-down"></i></button>` :
                ``
            }
                    ${p.fechaBaja === null ?
                `<button type="button" class="btn btn-danger btn-sm btn-baja btnBajaPrestamo" data-id="${p.idPrestamo}" title="Dar de baja"><i class="bi bi-archive"></i></button>` :
                `<button type="button" class="btn btn-success btn-sm btn-reactivar" data-id="${p.idPrestamo}" title="Reactivar"><i class="bi bi-arrow-counterclockwise"></i></button>`
            }
                </td>
            </tr>
        `
    ).join("");

    listaPrestamos = prestamos;

    tabla.innerHTML = `
        <div class="table-responsive">
            <table class="table table-striped table-hover border-dark-subtle align-middle small mb-0">
                <thead class="table-dark">
                    <tr>
                        <th class="text-center" style="width: 65px;">Imagen</th>
                        <th class="text-center">ID</th>
                        <th>Libro</th>
                        <th class="text-center">Fianza</th>
                        <th class="text-end">Importe</th>
                        <th>Observaciones</th>
                        <th class="text-nowrap">Préstamo</th>
                        <th class="text-nowrap">Límite</th>
                        <th class="text-nowrap">Devolución</th>
                        <th class="text-nowrap">Baja</th>
                        <th class="text-nowrap">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${cuerpoTabla}
                </tbody>
            </table>
        </div>
    `;
    registrarEventos();
}

async function cambiarEstadoPrestamo(oEvento) {
    let boton = oEvento.target.closest("button");
    let idPrestamo = boton.dataset.id;
    if (!idPrestamo) return;

    let respuesta = await oBiblioteca.cambiarEstadoPrestamo(idPrestamo);
    notificaciones(respuesta?.mensaje);

    if (respuesta?.ok) {
        await mostrarListadoPrestamos();
    }
}

async function mostrarLibrosDisponibles(idEjemplarSeleccionado = null) {
    let respuesta = await oBiblioteca.librosDisponibles();
    let options = "";

    const filas = respuesta.datos ?? [];
    if (!respuesta.ok || filas.length === 0) {
        options = `<option value="">No hay libros disponibles</option>`;
        frmPrestamo.lstTituloLibro.innerHTML = options;
        return;
    }

    const libros = filas.map(
        (fila) =>
            new LibrosDisponibles(
                fila.id_libro,
                fila.titulo_libro,
                fila.id_ejemplar,
                fila.disponibles,
            )
    )

    //Filtramos para que no me liste los libros que no tienen ejemplares
    const optionsLibros = libros
        .filter((l) => Number(l.disponibles) !== 0)
        .map((l) => `<option value="${l.idEjemplar}">${l.tituloLibro} - (${l.disponibles} Disponibles)</option>`).join("");

    frmPrestamo.lstTituloLibro.innerHTML = optionsLibros;

    if (idEjemplarSeleccionado !== null && idEjemplarSeleccionado !== undefined) {
        const valorBuscado = String(idEjemplarSeleccionado);
        const existeOpcion = Array.from(frmPrestamo.lstTituloLibro.options).some(
            (opt) => opt.value === valorBuscado
        );

        if (existeOpcion) {
            frmPrestamo.lstTituloLibro.value = valorBuscado;
        }
    }
}

async function comprobarFianza() {
    let option = frmPrestamo.lstTieneFianza.value;
    frmPrestamo.importeFianza.disabled = option === "0" ? true : false;
}

// Esta funciona procesa los datos del formulario para registrar un prestamos
// El formulario es compartido para editar y nuevo
async function procesarPrestamo(event) {
    if(event) event.preventDefault();

    const prestamoActual = idPrestamoEditando
        ? listaPrestamos.find((p) => String(p.idPrestamo) === String(idPrestamoEditando))
        : null;

    let idEjemplar = frmPrestamo.lstTituloLibro.value.trim();
    let fianza = frmPrestamo.lstTieneFianza.value.trim();
    let importeRaw = parseFloat(frmPrestamo.importeFianza.value.trim());
    let importe = (fianza === "1" && !Number.isNaN(importeRaw)) ? importeRaw : 0;
    let fechaPrestamo = frmPrestamo.fechaPrestamo.value.trim();
    let limite = frmPrestamo.fechaLimite.value.trim();

    const archivoImagen =
        frmPrestamo.urlImagen && frmPrestamo.urlImagen.type === "file"
            ? frmPrestamo.urlImagen.files?.[0] ?? null
            : null;

    let imagenIntroducida =
        frmPrestamo.urlImagen && frmPrestamo.urlImagen.type !== "file"
            ? frmPrestamo.urlImagen.value.trim()
            : "";
    let imagen = imagenIntroducida || (prestamoActual?.urlImagen ?? "");

    let observaciones = frmPrestamo.observaciones.value.trim();

    const oPrestamo = new Prestamo(
        idPrestamoEditando,
        idEjemplar,
        prestamoActual?.tituloLibro ?? "",
        fechaPrestamo,
        limite,
        prestamoActual?.fechaDevolucion ?? null,
        observaciones,
        importe,
        fianza,
        imagen,
        prestamoActual?.fechaBaja ?? null
    );

    if (idPrestamoEditando !== null) {
        await editarPrestamo(idPrestamoEditando, oPrestamo);
        return;
    }

    let respuesta = await oBiblioteca.crearPrestamo(oPrestamo, archivoImagen);

    notificaciones(respuesta.mensaje);

    if (respuesta?.ok) {
        frmPrestamo.reset();
        window.history.replaceState({}, "", window.location.pathname);
    }

    await mostrarListadoPrestamos();
}

async function cargarFormularioEdicion(prestamo) {
    await mostrarLibrosDisponibles(prestamo.idEjemplar);

    frmPrestamo.lstTieneFianza.value = prestamo.tieneFianza ? "1" : "0";
    comprobarFianza();
    frmPrestamo.importeFianza.value = prestamo.importeFianza ?? 0;
    frmPrestamo.fechaPrestamo.value = prestamo.fechaPrestamo ? String(prestamo.fechaPrestamo).slice(0, 10) : "";
    frmPrestamo.fechaLimite.value = prestamo.fechaLimite ? String(prestamo.fechaLimite).slice(0, 10) : "";

    if (frmPrestamo.urlImagen && frmPrestamo.urlImagen.type !== "file") {
        frmPrestamo.urlImagen.value = prestamo.urlImagen ?? "";
    }

    frmPrestamo.observaciones.value = prestamo.observaciones ?? "";
}

async function editarPrestamo(idPrestamo, datosPrestamo) {
    if (!idPrestamo) return;

    const prestamoActual = listaPrestamos.find(
        (p) => String(p.idPrestamo) === String(idPrestamo)
    );

    try {
        const urlFinal = await oBiblioteca.resolverUrlImagenEdicion(
            frmPrestamo.urlImagen,
            prestamoActual?.urlImagen ?? "",
            idPrestamo
        );

        if (datosPrestamo instanceof FormData) {
            datosPrestamo.set("urlImagen", urlFinal);
        } else if (datosPrestamo && typeof datosPrestamo === "object") {
            datosPrestamo.urlImagen = urlFinal;
        }

        const respuesta = await oBiblioteca.modificarPrestamo(datosPrestamo);
        notificaciones(respuesta?.mensaje ?? "Operación completada");

        if (respuesta?.ok) {
            idPrestamoEditando = null;
            frmPrestamo.reset();
            window.history.replaceState({}, "", window.location.pathname);
            await mostrarListadoPrestamos();
        }
    } catch (error) {
        notificaciones(error?.message || "Error al guardar los cambios");
    }
}

function notificaciones(mensaje) {
  let contenedor = document.getElementById("contenedorToasts");
  let status = mensaje.ok ? "success" : "danger";

  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "contenedorToasts";
    contenedor.className = "toast-container position-fixed top-0 end-0 p-3";
    contenedor.style.zIndex = "1100";
    document.body.appendChild(contenedor);
  }

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center text-bg-${status} border-0`;
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${mensaje}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
    </div>
  `;

  contenedor.appendChild(toastEl);

  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();

  // Limpiar del DOM cuando desaparezca
  toastEl.addEventListener("hidden.bs.toast", () => {
    toastEl.remove();
  });
}