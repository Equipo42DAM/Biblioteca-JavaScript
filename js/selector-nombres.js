document.addEventListener("DOMContentLoaded", function () {
  // Diccionario de responsables
  const responsablesPorSeccion = {
    inicio: "Grupo 4",
    editoriales: "Carlos García",
    libros: "Manuel Orozco",
    ejemplares: "Juan José Lobo",
    prestamos: "Juan José Rodríguez-Prat"
  };

  // Diccionario de responsables según el requisito de tu proyecto
  const responsablesPorSeccionProyecto = {
    inicio: "Grupo 4",
    editoriales: "Carlos García",
    libros: "Manuel Orozco",
    ejemplares: "Juan José Lobo",
    prestamos: "Juan José Rodríguez-Prat",
  };

  const elementoResponsable = document.getElementById("nombre-responsable");


  function cambiarSeccion(seccionDeseada) {
    // Comprobar que la sección existe
    const seccionActivaHTML = document.getElementById(`sec-${seccionDeseada}`);

    if (!seccionActivaHTML) {
      seccionDeseada = "inicio";
    }

    document.querySelectorAll(".seccion-spa").forEach((sec) => {
      sec.classList.add("d-none");
    });
    document.getElementById(`sec-${seccionDeseada}`).classList.remove("d-none");

    document.querySelectorAll(".nav-link[data-section]").forEach((el) => {
      if (el.dataset.section === seccionDeseada) {
        el.classList.add("active", "bg-success");
        el.classList.remove("text-white");
      } else {
        el.classList.remove("active", "bg-success");
        el.classList.add("text-white");
      }
    });


    if (elementoResponsable) {
      elementoResponsable.textContent =
        responsablesPorSeccionProyecto[seccionDeseada] || responsablesPorSeccion[seccionDeseada] || "Bibliotecario en Turno";
    }
  }

  document.querySelectorAll("[data-section]").forEach((enlace) => {
    enlace.addEventListener("click", function (e) {
      e.preventDefault();

      const seccion = this.dataset.section;

      if (window.location.hash !== `#${seccion}`) {
        history.pushState(null, "", `#${seccion}`);

        if (elementoResponsable) {
          elementoResponsable.textContent = responsablesPorSeccion[seccion] || "Bibliotecario en Turno";
        }

      }

      cambiarSeccion(seccion);
    });
  });


  const seccionInicial = window.location.hash.substring(1) || "inicio";
  cambiarSeccion(seccionInicial);

  window.addEventListener("popstate", function () {
    const seccion = window.location.hash.substring(1) || "inicio";
    cambiarSeccion(seccion);
  });
});