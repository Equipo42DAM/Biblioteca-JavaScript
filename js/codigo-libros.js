"use strict";

function activarSeccionLibrosSiCorresponde(nombreSeccion) {
    if (nombreSeccion === "libros" && typeof inicializarSeccionLibros === "function") {
        inicializarSeccionLibros();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('[data-section="libros"]').forEach((enlace) => {
        enlace.addEventListener("click", () => {
            activarSeccionLibrosSiCorresponde("libros");
        });
    });

    const hashActual = window.location.hash.replace(/^#/, "").trim();
    const guardado = sessionStorage.getItem("biblioteca_ohara_seccion");
    const seccionInicial = hashActual || guardado || "inicio";

    activarSeccionLibrosSiCorresponde(seccionInicial);
});