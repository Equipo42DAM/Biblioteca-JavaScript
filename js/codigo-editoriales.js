"use strict";

// MAIN
var oGestorEditorial = new GestorEditorial();
var listaEditoriales = [];
var paginaActual = 1;
var filasPorPagina = 10;

document.addEventListener("DOMContentLoaded", () => {
  cargarEditoriales();
  registrarEventosEditoriales();
});

function registrarEventosEditoriales() {
  // Enlace del menú SPA correspondiente a Editoriales (selector-nombres.js)
  document.querySelectorAll('[data-section="editoriales"]').forEach((enlace) => {
    enlace.addEventListener("click", () => {
      mostrarVistasEditoriales("vistaListadoEditoriales");
      cargarDesplegables();
      cargarEditoriales();
    });
  });

  // Botón principal de alta
  const btnNueva = document.getElementById("btnNuevaEditorial");
  if (btnNueva) {
    btnNueva.addEventListener("click", mostrarFormulario);
  }

  // Botones secundarios (volver a listado)
  const btnVolverAlta = document.getElementById("btnVolverAlta");
  if (btnVolverAlta) {
    btnVolverAlta.addEventListener("click", mostrarFormulario);
  }

  const btnVolverMod = document.getElementById("btnVolverMod");
  if (btnVolverMod) {
    btnVolverMod.addEventListener("click", mostrarFormulario);
  }

  // Delegación de eventos en la tabla para editar y borrar
  const tbody = document.getElementById("filasEditoriales");
  if (tbody) {
    tbody.addEventListener("click", (oEvento) => {
      const btnEditar = oEvento.target.closest(".btn-editar");
      const btnBorrar = oEvento.target.closest(".btn-borrar");

      if (btnEditar) {
        let idEditorial = btnEditar.dataset.id;
        prepararModificacion(idEditorial);
      } else if (btnBorrar) {
        let idEditorial = btnBorrar.dataset.id;
        let nombreEditorial = btnBorrar.dataset.nombre;
        prepararBaja(idEditorial, nombreEditorial);
      }
    });
  }

  // Envío del formulario de alta
  const frmAlta = document.getElementById("frmAltaEditorial");
  if (frmAlta) {
    frmAlta.addEventListener("submit", procesarAltaEditorial);
  }

  // Botón guardar cambios de modificación
  const btnConfirmarMod = document.getElementById("btnConfirmarMod");
  if (btnConfirmarMod) {
    btnConfirmarMod.addEventListener("click", procesarModificarEditorial);
  }

  // Botón confirmar baja en el modal
  const btnConfirmarBaja = document.getElementById("btnConfirmarBaja");
  if (btnConfirmarBaja) {
    btnConfirmarBaja.addEventListener("click", procesarBajaEditorial);
  }
}

// Función mostrar el formulario
function mostrarFormulario(oEvento) {
  let opcion = oEvento.currentTarget.id;

  switch (opcion) {
    case "btnNuevaEditorial":
      mostrarVistasEditoriales("vistaAltaEditorial");
      break;
    case "btnVolverAlta":
    case "btnVolverMod":
      mostrarVistasEditoriales("vistaListadoEditoriales");
      break;
  }
}

// Función ocultar los formularios
function ocultarFormulariosEditoriales() {
  document.getElementById("vistaListadoEditoriales").classList.add("d-none");
  document.getElementById("vistaAltaEditorial").classList.add("d-none");
  document.getElementById("vistaModificarEditorial").classList.add("d-none");
}

// Función mostrar vista según una id
function mostrarVistasEditoriales(idVistaAMostrar) {
  ocultarFormulariosEditoriales();
  const vista = document.getElementById(idVistaAMostrar);
  if (vista) {
    vista.classList.remove("d-none");
  }
}

// Función de cargar desplegables
async function cargarDesplegables() {
  let respuesta = await oGestorEditorial.getPaises();

  if (respuesta.ok) {
    let opciones = '<option value="" selected disabled>-- Selecciona un país --</option>';

    for (let pais of respuesta.datos) {
      let id = pais.id_pais ?? pais.idPais;
      let nombre = pais.nombre ?? pais.nombre_pais ?? pais.nombrePais;
      opciones += `<option value="${id}">${nombre}</option>`;
    }

    const selectAlta = document.getElementById("selectPaisAlta");
    const selectMod = document.getElementById("selectPaisMod");

    if (selectAlta) selectAlta.innerHTML = opciones;
    if (selectMod) selectMod.innerHTML = opciones;
  } else {
    alert("No se han podido cargar los países: " + respuesta.mensaje); 
  }
}

// Función de cargar editoriales
async function cargarEditoriales() {
  let respuesta = await oGestorEditorial.getEditoriales();

  if (respuesta.ok) {
    listaEditoriales = [];


    // Va cargando cada editorial en la lista
    for (let ed of respuesta.datos) {
      let oEditorial = new Editorial(
        ed.id_editorial,
        ed.id_pais,
        ed.nombre_comercial,
        ed.contacto,
        ed.url_imagen,
        ed.edita_espanol,
        ed.anio_origen
      );

      listaEditoriales.push(oEditorial);
    }

    // El total de páginas para el pagination = longitud / filas (redondea al más alto)
    let totalPaginas = Math.ceil(listaEditoriales.length / filasPorPagina);
    if (totalPaginas === 0) {
      totalPaginas = 1;
    }
    if (paginaActual > totalPaginas) {
      paginaActual = totalPaginas;
    }

    annadirFila();
    renderizarPaginacion();
  } else {
    alert("No se han podido cargar las editoriales: " + respuesta.mensaje);
  }
}

// Función que añade una nueva fila en la tabla del listado de editoriales
function annadirFila() {
  const tbody = document.getElementById("filasEditoriales");
  tbody.innerHTML = "";

  const inicio = (paginaActual - 1) * filasPorPagina;
  const fin = inicio + filasPorPagina;
  const editorialesPagina = listaEditoriales.slice(inicio, fin);

  let filasHTML = "";

  for (let editorial of editorialesPagina) {
    let textoEspannol = "No";
    if (editorial.edita_espanol == 1) {
      textoEspannol = "Sí";
    }

    let nombre = editorial.nombre;
    if (!nombre) {
      nombre = "";
    }

    let contacto = editorial.contacto;
    if (!contacto) {
      contacto = "";
    }

    let anno = editorial.anno_origen;
    if (!anno) {
      anno = "";
    }

    let celdaImagen = '<span class="text-muted small">N/A</span>';
    if (editorial.urlimagen && editorial.urlimagen.trim() !== "") {
      celdaImagen = `<img src="${editorial.urlimagen}" alt="Logo ${nombre}" width="48" height="48" class="border rounded p-1 bg-white object-fit-contain">`;
    }

    filasHTML += `
			<tr>
				<td>${celdaImagen}</td>
				<td>${nombre}</td>
				<td>${contacto}</td>
				<td>${anno}</td>
				<td>${textoEspannol}</td>
				<td class="text-end">
					<button type="button" class="btn btn-warning btn-sm me-2 btn-editar" data-id="${editorial.idEditorial}" title="Modificar">
						<i class="bi bi-pencil-square"></i>
					</button>
					<button type="button" class="btn btn-danger btn-sm btn-borrar" data-id="${editorial.idEditorial}" data-nombre="${nombre}" title="Dar de baja">
						<i class="bi bi-trash"></i>
					</button>
				</td>
			</tr>
		`;
  }

  tbody.innerHTML = filasHTML;
}

// Función que actualiza la paginación
function renderizarPaginacion() {
  const ulPaginacion = document.getElementById("paginacionEditoriales");
  if (!ulPaginacion) {
    return;
  }

  // Redondeamos al valor más alto para calular el total de páginas
  const totalPaginas = Math.ceil(listaEditoriales.length / filasPorPagina);
  if (totalPaginas <= 1) {
    ulPaginacion.innerHTML = "";
    return;
  }

  // Muestra la página anterior como desactivada
  let claseAnterior = "page-item";
  if (paginaActual === 1) {
    claseAnterior += " disabled";
  }

  let html = `<li class="${claseAnterior}"><a class="page-link" href="#" data-pagina="${paginaActual - 1}">Anterior</a></li>`;

  // Muestra la página actual como activa
  for (let i = 1; i <= totalPaginas; i++) {
    let claseItem = "page-item";
    if (i === paginaActual) {
      claseItem += " active";
    }
    html += `<li class="${claseItem}"><a class="page-link" href="#" data-pagina="${i}">${i}</a></li>`;
  }

  // Muestra la página siguiente como desactivada
  let claseSiguiente = "page-item";
  if (paginaActual === totalPaginas) {
    claseSiguiente += " disabled";
  }

  html += `<li class="${claseSiguiente}"><a class="page-link" href="#" data-pagina="${paginaActual + 1}">Siguiente</a></li>`;

  ulPaginacion.innerHTML = html;

  ulPaginacion.onclick = (oEvento) => {
    oEvento.preventDefault();
    const enlace = oEvento.target.closest("a.page-link");
    if (!enlace) {
      return;
    }

    const nuevaPagina = parseInt(enlace.dataset.pagina);

    // Actualiza la página y concatena las filas
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas && nuevaPagina !== paginaActual) {
      paginaActual = nuevaPagina;
      annadirFila();
      renderizarPaginacion();
    }
  };
}

// Función de procesar el alta de editorial enviada
async function procesarAltaEditorial(oEvento) {
  oEvento.preventDefault();

  const frmAlta = document.getElementById("frmAltaEditorial");

  let idPais = document.getElementById("selectPaisAlta").value.trim();
  let nombre = document.getElementById("txtNombreAlta").value.trim();
  let contacto = document.getElementById("txtContactoAlta").value.trim();
  let anno_origen = document.getElementById("dateOrigenAlta").value.trim();

  let edita_espanol = 0;
  if (document.getElementById("checkPaisAlta").checked) {
    edita_espanol = 1;
  }

  let inputImagen = document.getElementById("imgEditorialAlta");
  let urlimagen = "";
  if (inputImagen && inputImagen.files && inputImagen.files.length > 0) {
    urlimagen = "img/editoriales/" + inputImagen.files[0].name;
  }

  let oEditorial = new Editorial(
    null,
    idPais,
    nombre,
    contacto,
    urlimagen,
    edita_espanol,
    anno_origen
  );

  let respuesta = await oGestorEditorial.altaEditorial(oEditorial);

  alert(respuesta.mensaje);

  if (respuesta.ok) {
    frmAlta.reset();
    mostrarVistasEditoriales("vistaListadoEditoriales");
    await cargarEditoriales();
  }
}

// Función para 
function prepararModificacion(idEditorial) {
  let editorialEncontrada = null;

  for (let ed of listaEditoriales) {
    if (ed.idEditorial == idEditorial) {
      editorialEncontrada = ed;
      break;
    }
  }

  if (!editorialEncontrada) {
    return;
  }

  document.getElementById("idEditorialMod").value = editorialEncontrada.idEditorial;
  document.getElementById("txtNombreMod").value = editorialEncontrada.nombre;
  document.getElementById("txtContactoMod").value = editorialEncontrada.contacto;
  document.getElementById("selectPaisMod").value = editorialEncontrada.idPais;
  document.getElementById("dateOrigenMod").value = editorialEncontrada.anno_origen;

  if (editorialEncontrada.edita_espanol == 1) {
    document.getElementById("checkPaisMod").checked = true;
  } else {
    document.getElementById("checkPaisMod").checked = false;
  }

  const imgPrevia = document.getElementById("imgPreviaMod");

  if (editorialEncontrada.urlimagen && editorialEncontrada.urlimagen.trim() !== "") {
    let ruta = editorialEncontrada.urlimagen.trim();
    if (!ruta.startsWith("http") && !ruta.includes("/")) {
      ruta = "img/editoriales/" + ruta;
    }
    imgPrevia.src = ruta;
    imgPrevia.dataset.actual = editorialEncontrada.urlimagen.trim();
    imgPrevia.classList.remove("d-none");
  } else {
    imgPrevia.src = "";
    imgPrevia.dataset.actual = "";
    imgPrevia.classList.add("d-none");
  }

  document.getElementById("imgEditorialMod").value = "";

  mostrarVistasEditoriales("vistaModificarEditorial");
}

// Función que procesa la modificación de la editorial
async function procesarModificarEditorial() {
  let idEditorial = document.getElementById("idEditorialMod").value.trim();
  let idPais = document.getElementById("selectPaisMod").value.trim();
  let nombre = document.getElementById("txtNombreMod").value.trim();
  let contacto = document.getElementById("txtContactoMod").value.trim();
  let anno_origen = document.getElementById("dateOrigenMod").value.trim();

  let edita_espanol = 0;

  if (document.getElementById("checkPaisMod").checked) {
    edita_espanol = 1;
  }

  let inputImagen = document.getElementById("imgEditorialMod");
  let imgPrevia = document.getElementById("imgPreviaMod");
  let urlimagen = imgPrevia.dataset.actual;

  if (!urlimagen) {
    urlimagen = "";
  }

  if (inputImagen && inputImagen.files && inputImagen.files.length > 0) {
    urlimagen = "img/editoriales/" + inputImagen.files[0].name;
  }

  let oEditorial = new Editorial(
    idEditorial,
    idPais,
    nombre,
    contacto,
    urlimagen,
    edita_espanol,
    anno_origen
  );

  let archivo = (inputImagen && inputImagen.files.length > 0) ? inputImagen.files[0] : null;
  let respuesta = await oGestorEditorial.modificarEditorial(oEditorial, archivo);

  alert(respuesta.mensaje);

  if (respuesta.ok) {
    mostrarVistasEditoriales("vistaListadoEditoriales");
    await cargarEditoriales();
  }
}

// Función que prepara la solicitud de baja de editorial
function prepararBaja(idEditorial, nombreEditorial) {
  document.getElementById("idEditorialBaja").value = idEditorial;
  document.getElementById("nombreEditorialBaja").textContent = nombreEditorial;

  const modalElemento = document.getElementById("modalBaja");
  const modal = bootstrap.Modal.getOrCreateInstance(modalElemento);

  modal.show();
}

// Función que procesa la baja de editorial, una vez confirmada en el modal
async function procesarBajaEditorial() {
  let idEditorial = document.getElementById("idEditorialBaja").value.trim();

  let respuesta = await oGestorEditorial.bajaEditorial(idEditorial);

  const modalElemento = document.getElementById("modalBaja");
  const modal = bootstrap.Modal.getOrCreateInstance(modalElemento);

  modal.hide();

  alert(respuesta.mensaje);

  if (respuesta.ok) {
    await cargarEditoriales();
  }
}