"use strict";

// MAIN
var oGestorEditorial = new GestorEditorial();
var listaEditoriales = [];
var paginaActual = 1;
var filasPorPagina = 10;

document.addEventListener("DOMContentLoaded", () => {
  registrarEventos();
});

function registrarEventos() {
  // Enlace del menú SPA correspondiente a Editoriales (gestionado junto a selector-nombres.js)
  document.querySelectorAll('[data-section="editoriales"]').forEach((enlace) => {
    enlace.addEventListener("click", () => {
      mostrarVista("vistaListadoEditoriales");
      cargarEditoriales();
    });
  });

  // Botón principal de alta
  document
    .getElementById("btnNuevaEditorial")
    .addEventListener("click", mostrarFormulario);

  // Botones secundarios (volver a listado)
  document
    .getElementById("btnVolverAlta")
    .addEventListener("click", mostrarFormulario);
  document
    .getElementById("btnVolverMod")
    .addEventListener("click", mostrarFormulario);
  document
    .getElementById("btnDenegarBaja")
    .addEventListener("click", mostrarFormulario);

  // Delegación de eventos para los botones dinámicos de la tabla (modificar / baja)
  document
    .getElementById("filasEditoriales")
    .addEventListener("click", (oEvento) => {
      if (oEvento.target.closest(".btn-editar")) {
        cargarDesplegables();
        mostrarVista("vistaModificarEditorial");
      } else if (oEvento.target.closest(".btn-borrar")) {
        mostrarVista("modalBaja");
      }
    });

  // Formulario de alta
  frmAltaEditorial.addEventListener("submit", procesarAltaEditorial);
}

function mostrarFormulario(oEvento) {
  let opcion = oEvento.currentTarget.id;

  switch (opcion) {
    case "btnNuevaEditorial":
      cargarDesplegables();
      mostrarVista("vistaAltaEditorial");
      break;
    case "btnVolverAlta":
    case "btnVolverMod":
    case "btnDenegarBaja":
      mostrarVista("vistaListadoEditoriales");
      break;
  }
}

function ocultarFormularios() {
  document.getElementById("vistaListadoEditoriales").classList.add("d-none");
  document.getElementById("vistaAltaEditorial").classList.add("d-none");
  document.getElementById("vistaModificarEditorial").classList.add("d-none");
}

function mostrarVista(idVistaAMostrar) {
  ocultarFormularios();
  document.getElementById(idVistaAMostrar).classList.remove("d-none");
}

async function cargarDesplegables() {
  let respuesta = await oGestorEditorial.getPaises();
  let options = "";

  if (respuesta.ok) {
    for (let pais of respuesta.datos) {
      options += `<option value="${pais.idPais}">${pais.nombrePais}</option>`;
    }

    if (frmAltaEditorial.idPais) {
      frmAltaEditorial.idPais.innerHTML = options;
    }
    if (typeof frmModificarEditorial !== "undefined" && frmModificarEditorial.idPais) {
      frmModificarEditorial.idPais.innerHTML = options;
    }
  } else {
    alert("No se han podido cargar los países: " + respuesta.mensaje);
  }
}

async function cargarEditoriales() {
  let respuesta = await oGestorEditorial.getEditoriales();

  if (respuesta.ok) {
    listaEditoriales = respuesta.datos.map(
      (ed) =>
        new Editorial(
          ed.idPais,
          ed.nombre,
          ed.contacto,
          ed.urlimagen,
          ed.edita_espanol,
          ed.anno_origen,
        ),
    );
    annadirFila();
  } else {
    alert("No se han podido cargar las editoriales: " + respuesta.mensaje);
  }
}

function annadirFila() {
  const tbody = document.getElementById("filasEditoriales");
  tbody.innerHTML = "";

  const inicio = (paginaActual - 1) * filasPorPagina;
  const fin = inicio + filasPorPagina;
  const editorialesPagina = listaEditoriales.slice(inicio, fin);

  let filasHTML = "";

  for (let editorial of editorialesPagina) {
    let textoEspannol = editorial.edita_espanol == 1 ? "Sí" : "No";
    let celdaImagen = "";
    let nombre = editorial.nombre || "";
    let contacto = editorial.contacto || "";
    let anno = editorial.anno_origen || "";

    if (editorial.urlimagen && editorial.urlimagen.trim() !== "") {
      celdaImagen = `<img src="${editorial.urlimagen}" 
                          alt="Logo ${nombre}" 
                          class="img-thumbnail img-miniatura-tabla">`;
    } else {
      celdaImagen = `<span class="text-muted small">N/A</span>`;
    }

    filasHTML += `
      <tr>
        <td>${celdaImagen}</td>
        <td>${nombre}</td>
        <td>${contacto}</td>
        <td>${anno}</td>
        <td>${textoEspannol}</td>
        <td class="text-end">
          <button type="button" class="btn btn-warning btn-sm me-2 btn-editar" title="Modificar">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button type="button" class="btn btn-danger btn-sm btn-borrar" data-nombre="${nombre}" title="Dar de baja">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }

  tbody.innerHTML = filasHTML;
}

async function procesarAltaEditorial(oEvento) {
  oEvento.preventDefault();

  let datosForm = new FormData(frmAltaEditorial);
  let idPais = datosForm.get("idPais") || "";
  let nombre = (datosForm.get("nombre") || "").trim();
  let contacto = (datosForm.get("contacto") || "").trim();
  let urlimagen = (datosForm.get("urlimagen") || "").trim();
  let edita_espanol = datosForm.get("edita_espanol") ? 1 : 0;
  let anno_origen = (datosForm.get("anno_origen") || "").trim();

  let oEditorial = new Editorial(
    idPais,
    nombre,
    contacto,
    urlimagen,
    edita_espanol,
    anno_origen,
  );

  let respuesta = await oGestorEditorial.altaEditorial(oEditorial);

  alert(respuesta.mensaje);

  if (respuesta.ok) {
    frmAltaEditorial.reset();
    mostrarVista("vistaListadoEditoriales");
    cargarEditoriales();
  }
}