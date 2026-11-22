    document.addEventListener("DOMContentLoaded", function () {
      // Diccionario de responsables
      const responsablesPorSeccion = {
        inicio: "Grupo 4",
        editoriales: "Carlos García",
        libros: "Manuel Orozco",
        ejemplares: "Juan José Lobo",
        prestamos: "Juan José Rodríguez-Prat"
      };

      const elementoResponsable = document.getElementById("nombre-responsable");

      // Función para cambiar de sección de manera dinámica en la SPA
      function cambiarSeccion(seccionDeseada) {
        // 1. Ocultar todas las secciones añadiendo la clase d-none de Bootstrap
        document.querySelectorAll(".seccion-spa").forEach(sec => {
          sec.classList.add("d-none");
        });

        // 2. Mostrar la sección seleccionada quitando la clase d-none
        const seccionActivaHTML = document.getElementById(`sec-${seccionDeseada}`);
        if (seccionActivaHTML) {
          seccionActivaHTML.classList.remove("d-none");
        }

        // 3. Gestionar los estilos 'active' y colores en los botones del menú (tanto en desktop como mobile)
        document.querySelectorAll("[data-section]").forEach(el => {
          if (el.getAttribute("data-section") === seccionDeseada) {
            el.classList.add("active", "bg-success", "text-white");
            el.classList.remove("text-white");
          } else {
            el.classList.remove("active", "bg-success");
            el.classList.add("text-white");
          }
        });

        // 4. Actualizar dinámicamente el nombre del responsable según el diccionario
        if (elementoResponsable) {
          elementoResponsable.textContent = responsablesPorSeccion[seccionDeseada] || "Bibliotecario en Turno";
        }
      }

      // 5. Asignar el evento 'click' a todos los enlaces del menú que tengan el atributo data-section
      document.querySelectorAll("[data-section]").forEach(enlace => {
        enlace.addEventListener("click", function (e) {
          e.preventDefault(); // Evita que la página recargue o salte al `#`
          const seccion = this.getAttribute("data-section");
          cambiarSeccion(seccion);
        });
      });

      // Inicializar por defecto en la sección "inicio" al cargar la página
      cambiarSeccion("inicio");
    });