"use strict";

// Instanciamos un nuevo gestor de editoriales
const gestorEditorial = new GestorEditorial();
var listaEditoriales = []; // Creamos una lista de editoriales donde se añadirá cada registro
const filasPorPagina = 6;
let paginaActual = 1;

// Nos aseguramos de que el HTML está cargado antes de comenzar a trabajar con él
document.addEventListener("DOMContentLoaded", () => {

    // Declaramos las vistas de las diferentes acciones
    const vistaListadoEditoriales = document.getElementById("vistaListadoEditoriales");
    const vistaAltaEditorial = document.getElementById("vistaAltaEditorial");
    const vistaModificarEditorial = document.getElementById("vistaModificarEditorial");

    function ocultarTodo() {
        vistaListadoEditoriales.classList.add("d-none");
        vistaAltaEditorial.classList.add("d-none");
        vistaModificarEditorial.classList.add("d-none");
    }

    // Función que muestra la vista del registro deseado pasado por parámetro
    function mostrarVista(idVistaAMostrar) {
        ocultarTodo();
        document.getElementById(idVistaAMostrar).classList.remove("d-none");
    }

    // Función que añade un nuevo registro de tabla
    function annadirFila() {
        const tbody = document.getElementById("filasEditoriales");
        tbody.innerHTML = "";

        // Declaramos constantes referentes a la paginación y el número de filas por página
        const inicio = (paginaActual - 1) * filasPorPagina;
        const fin = inicio + filasPorPagina;
        const editorialesPagina = listaEditoriales.slice(inicio, fin);

        let filasHTML = "";

        // Por cada página, inserta esta editorial
        editorialesPagina.forEach(editorial => {

            // Conversión del booleano a String en una ternaria | variables con control de nulos
            let textoEspannol = editorial.isEdita_espanol() == 1 ? "Sí" : "No";
            let celdaImagen = "";
            let nombre = editorial.getNombre() || "";
            let contacto = editorial.getContacto() || "";
            let anno = editorial.getAnno_origen() || "";

            // Si la encuentra y no es nula
            if (editorial.getUrlimagen() && editorial.getUrlimagen().trim() !== "") {
                celdaImagen = `<img src="${editorial.getUrlimagen()}" 
                                    alt="Logo ${editorial.getNombre()}" 
                                    class="img-thumbnail img-miniatura-tabla">`;
            } else {
                celdaImagen = `<span class="text-muted small">N/A</span>`; // No aplicable
            }

            filasHTML += `
            <tr>
                <td>${celdaImagen}</td>
                <td>${nombre}</td>
                <td>${contacto}</td>
                <td>${anno}</td>
                <td>${textoEspannol}</td>
                <td class="text-end">
                    <button type="button" class="btn btn-warning btn-sm me-2 btn-editar" id="btnModificarEditorial" title="Modificar">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button type="button" class="btn btn-danger btn-sm btn-borrar" id="btnBajaEditorial" data-nombre="${nombre}" title="Dar de baja">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        });

        tbody.innerHTML = filasHTML;
    }

    // BOTONES PRINCIPALES (alta, modificar, baja)
    const btnAlta = document.getElementById("btnNuevaEditorial");
    btnAlta.addEventListener("click", () => {
        mostrarVista("vistaAltaEditorial");
    });

    const btnModificarEditorial = document.getElementById("btnModificarEditorial");
    btnModificarEditorial.addEventListener("click", () => {
        mostrarVista("vistaModificarEditorial");
    });

    const btnBajaEditorial = document.getElementById("btnBajaEditorial");
    btnBajaEditorial.addEventListener("click", () => {
        mostrarVista("modalBaja");
    });

    // BOTONES SECUNDARIOS (volver a listado)
    const btnVolverAlta = document.getElementById("btnVolverAlta");
    btnVolverAlta.addEventListener("click", () => {
        mostrarVista("vistaListadoEditoriales");
    });

    const btnVolverMod = document.getElementById("btnVolverMod");
    btnVolverMod.addEventListener("click", () => {
        mostrarVista("vistaListadoEditoriales");
    });

    const btnDenegarBaja = document.getElementById("btnDenegarBaja");
    btnDenegarBaja.addEventListener("click", () => {
        mostrarVista("vistaListadoEditoriales");
    });

    // Procesamos la creación de una nueva editorial
    frmAltaEditorial.addEventListener("submit", async (evento) => {
        evento.preventDefault(); // Evita recargar página

        const datosNuevaEditorial = new FormData(frmAltaEditorial);

        try {
            const exito = await gestorEditorial.altaEditorial(datosNuevaEditorial);

            if (exito) {
                frmAltaEditorial.reset();
                mostrarVista("vistaListadoEditoriales");
                
            } else {
                console.error("La operación ha fallado");
            }
        } catch (error) {
            console.error("Error al procesar el alta: " + error);
        }
    });



});