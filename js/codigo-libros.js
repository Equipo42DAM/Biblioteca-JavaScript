"use strict";

function mostrarSeccion(nombreSeccion) {
    const secciones = document.querySelectorAll(".seccion-spa");
    secciones.forEach((sec) => {
        sec.classList.toggle("d-none", sec.id !== "sec-" + nombreSeccion);
    });

    const enlaces = document.querySelectorAll("[data-section]");
    enlaces.forEach((enlace) => {
        enlace.classList.toggle("active", enlace.getAttribute("data-section") === nombreSeccion);
    });

    if (nombreSeccion === "libros" && typeof inicializarSeccionLibros === "function") {
        inicializarSeccionLibros();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const enlacesMenu = document.querySelectorAll("[data-section]");
    enlacesMenu.forEach((enlace) => {
        enlace.addEventListener("click", (evento) => {
            evento.preventDefault();
            const seccion = enlace.getAttribute("data-section");
            mostrarSeccion(seccion);
        });
    });

    mostrarSeccion("inicio");
});
