"use strict";

var oBiblioteca = new Biblioteca();

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
        .querySelector("#btnBajaPrestamo")
        .addEventListener("click", darDeBajaPrestamo);
    document
        .querySelector("#lstTieneFianza")
        .addEventListener("change", comprobarFianza);

}

function mostrarFormularios(oEvento) {
    let opcion = oEvento.target.closest("a, button")?.id || oEvento.target.id;
    ocultarFormularios();

    switch(opcion){
        case "btnMostrarFrmPrestamo":
            mostrarLibrosDisponibles();
            document.querySelector("#frmCardPrestamo").classList.remove("d-none");
            break;

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
                <td>
                    <img src="${p.urlImagen || ""}" alt="${p.tituloLibro}" width="50" height="50"/>
                    <td>${p.idPrestamo}</td>
                    <td>${p.tituloLibro ?? ""}</td>
                    <td>${p.tieneFianza ? "<i class='bi bi-check-circle-fill text-success'></i>" : "<i class='bi bi-x-circle-fill text-danger'></i>"}</td>
                    <td>${p.importeFianza && p.tieneFianza ? p.importeFianza : "-"}</td>
                    <td>${p.observaciones ?? ""}</td>
                    <td>${p.fechaPrestamo ?? ""}</td>
                    <td>${p.fechaLimite ?? ""}</td>
                    <td>${p.fechaDevolucion ?? "-"}</td>
                    <td>${p.fechaBaja ?? "-"}</td>
                    <td class="text-nowrap">
                        <button type="button" class="btn btn-warning btn-sm" data-id="${p.idPrestamo}" id="btnEditarPrestamo" title="Editar">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                        ${p.fechaDevolucion === null ?
                            `<button type="button" class="btn btn-primary btn-sm btn-entregar" data-id="${p.idPrestamo}" id="btnEntregarPrestamo" title="Entregar"><i class="bi bi-box-arrow-in-down"></i></button>`:
                            ``
                        }
                        ${p.fechaBaja === null ?
                            `<button type="button" class="btn btn-danger btn-sm btn-baja" data-id="${p.idPrestamo}" id="btnBajaPrestamo" title="Dar de baja"><i class="bi bi-archive"></i></button>` :
                            `<button type="button" class="btn btn-success btn-sm btn-reactivar" data-id="${p.idPrestamo}" id="btnReactivarPrestamo" title="Reactivar"><i class="bi bi-arrow-counterclockwise"></i></button>` 
                        }
                    </td>
                </td>
            </tr>
        `
    ).join("");

    tabla.innerHTML = `
        <table class="table table-striped border-dark-subtle align-middle small">
            <thead class="table-dark">
                <tr>
                    <th>Portada</th>
                    <th>ID</th>
                    <th>Libro</th>
                    <th>Fianza</th>
                    <th>Importe</th>
                    <th>Observaciones</th>
                    <th>Préstamo</th>
                    <th>Límite</th>
                    <th>Devolución</th>
                    <th>Baja</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${cuerpoTabla}
            </tbody>
        </table>
    `;
    registrarEventos();
}

async function darDeBajaPrestamo(oEvento) {
    let boton = oEvento.target.closest("button");
    let idPrestamo = boton.dataset.id;
    if (!idPrestamo) return;

    let respuesta = await oBiblioteca.cambiarEstadoPrestamo(idPrestamo);
    alert(respuesta?.mensaje);

    if (respuesta?.ok) {
        await mostrarListadoPrestamos();
    }
}

async function mostrarLibrosDisponibles() {
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

    const optionsLibros = libros.map(
        (l) => `<option value="${l.idEjemplar}">${l.tituloLibro + " - (" + l.disponibles + " Disponibles)"}</option>`).join("");

    frmPrestamo.lstTituloLibro.innerHTML = optionsLibros;
}

async function comprobarFianza() {
    let option = frmPrestamo.lstTieneFianza.value;
    frmPrestamo.importeFianza.disabled = option === "0" ? true : false;        
}
