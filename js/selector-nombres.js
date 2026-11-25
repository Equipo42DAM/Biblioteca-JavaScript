(function () {
  const CLAVE_SECCION = "biblioteca_ohara_seccion";

  const responsablesPorSeccion = {
    inicio: "Grupo 4",
    editoriales: "Carlos García",
    libros: "Manuel Orozco",
    ejemplares: "Juan José Lobo",
    prestamos: "Juan José Rodríguez-Prat"
  };

  function resolverSeccion(candidata) {
    return candidata && document.getElementById(`sec-${candidata}`)
      ? candidata
      : "inicio";
  }

  function obtenerSeccionGuardada() {
    const desdeHash = window.location.hash.replace(/^#/, "").trim();
    if (desdeHash && document.getElementById(`sec-${desdeHash}`)) {
      return desdeHash;
    }

    const desdeStorage = sessionStorage.getItem(CLAVE_SECCION);
    if (desdeStorage && document.getElementById(`sec-${desdeStorage}`)) {
      return desdeStorage;
    }

    return "inicio";
  }

  function limpiarFormatosSecciones(seccionActiva) {
    // Limpia préstamos al salir de la sección
    if (seccionActiva !== "prestamos") {
      const listadoPrestamos = document.getElementById("listadoPrestamos");
      if (listadoPrestamos) {
        listadoPrestamos.innerHTML = "";
        listadoPrestamos.classList.remove("border");
      }
      document.getElementById("frmCardPrestamo")?.classList.add("d-none");
      document.getElementById("frmPrestamo")?.reset();
    }

    // Limpia editoriales al salir de la sección
    if (seccionActiva !== "editoriales") {
      document.getElementById("vistaAltaEditorial")?.classList.add("d-none");
      document.getElementById("vistaModificarEditorial")?.classList.add("d-none");
      document.getElementById("vistaListadoEditoriales")?.classList.remove("d-none");
      document.getElementById("frmAltaEditorial")?.reset();
      document.getElementById("frmModificarEditorial")?.reset();
    }

    // Limpia libros al salir de la sección
    if (seccionActiva !== "libros") {
      const alertasLibros = document.getElementById("alertas-libros");
      if (alertasLibros) alertasLibros.innerHTML = "";
      document.getElementById("vista-formulario-libro")?.classList.add("d-none");
      document.getElementById("vista-listado-libros")?.classList.remove("d-none");
      document.getElementById("formLibro")?.reset();
    }
  }

  function actualizarResponsable(seccion) {
    const elResponsable = document.getElementById("nombre-responsable");
    if (!elResponsable) return;

    const seccionValida = responsablesPorSeccion[seccion] ? seccion : "inicio";
    elResponsable.textContent = responsablesPorSeccion[seccionValida];
  }

  function sincronizarMenu(seccionActiva) {
    document.querySelectorAll(".nav-link").forEach((enlace) => {
      enlace.classList.remove("active", "bg-success");
      if (enlace.dataset.section) {
        enlace.classList.add("text-white");
      }
    });

    document.querySelectorAll(`.nav-link[data-section="${seccionActiva}"]`).forEach((enlace) => {
      enlace.classList.remove("text-white");
      enlace.classList.add("active", "bg-success");
    });
  }

  function cambiarSeccion(seccionDeseada, actualizarHash = false) {
    const seccionValida = resolverSeccion(seccionDeseada);

    sessionStorage.setItem(CLAVE_SECCION, seccionValida);

    if (actualizarHash && window.location.hash !== `#${seccionValida}`) {
      history.replaceState(null, "", `#${seccionValida}`);
    }

    document.querySelectorAll(".seccion-spa").forEach((sec) => {
      sec.classList.toggle("d-none", sec.id !== `sec-${seccionValida}`);
    });

    limpiarFormatosSecciones(seccionValida);
    sincronizarMenu(seccionValida);
    actualizarResponsable(seccionValida);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-section]").forEach((enlace) => {
      enlace.addEventListener("click", function (e) {
        e.preventDefault();
        this.blur();
        cambiarSeccion(this.dataset.section, true);
      });
    });

    cambiarSeccion(obtenerSeccionGuardada(), false);
  });

  window.addEventListener("hashchange", function () {
    cambiarSeccion(obtenerSeccionGuardada(), false);
  });

  window.cambiarSeccionSPA = cambiarSeccion;
  window.actualizarResponsableSeccion = actualizarResponsable;
})();