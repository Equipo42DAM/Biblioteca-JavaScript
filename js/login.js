"use strict";

const IMG_USUARIO_DEF = "img/usuarios/U02.webp";
const $ = (id) => document.getElementById(id);
const pintarEn = (ids, fn) => ids.forEach((id) => { const el = $(id); if (el) fn(el); });

const notificar = (ok, mensaje) => {
    const fn = window.mostrarNotificacion || window.notificaciones;
    typeof fn === "function" ? fn({ ok, mensaje }) : alert(mensaje);
};

function mostrarInicio() {
    document.querySelectorAll(".seccion-spa").forEach((sec) => {
        if (sec.id !== "sec-inicio") sec.classList.add("d-none");
    });

    const listado = document.querySelector("#listadoPrestamos");
    if (listado) {
        listado.innerHTML = "";
        listado.classList.remove("border");
    }
    document.querySelector("#frmCardPrestamo")?.classList.add("d-none");
    $("sec-inicio")?.classList.remove("d-none");
    renderizarInicio();
}

async function postLogin(campos) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(campos)) fd.append(k, v);
    const res = await peticionPOST("login.php", fd);
    return typeof res === "string" ? JSON.parse(res) : res;
}

function togglePanelAdmin(abrir, modo = "escritorio") {
    pintarEn(["passAdmin", "passAdminMovil"], (i) => { i.value = ""; });
    $("panelLoginAdmin")?.classList.toggle("d-none", !abrir || modo !== "escritorio");
    $("panelLoginAdminMovil")?.classList.toggle("d-none", !abrir || modo !== "movil");
    if (abrir) $((modo === "movil" ? "passAdminMovil" : "passAdmin"))?.focus();
}

function establecerSesion(usuarioObj) {
    const rol = usuarioObj.rol || "usuario";
    sessionStorage.setItem("usuario", JSON.stringify({ ...usuarioObj, rol }));
    sessionStorage.setItem("rol", rol);
    aplicarEstadoSesion();

    if ($("sec-prestamos") && !$("sec-prestamos").classList.contains("d-none") &&
        $("frmCardPrestamo")?.classList.contains("d-none") &&
        typeof mostrarListadoPrestamos === "function") {
        mostrarListadoPrestamos();
    }

    if ($("sec-inicio") && !$("sec-inicio").classList.contains("d-none") && typeof renderizarInicio === "function") {
        renderizarInicio();
    }
}

async function loginAdmin(inputId) {
    const input = $(inputId);
    const password = input?.value.trim() || "";
    if (!password) {
        notificar(false, "Introduce la contraseña de administrador");
        return input?.focus();
    }

    try {
        const data = await postLogin({ username: "admin", password });
        if (data?.ok && data.datos) {
            establecerSesion({ ...data.datos, rol: "admin" });
            togglePanelAdmin(false);
            notificar(true, data.mensaje || "Modo administrador activado");
        } else {
            notificar(false, data?.mensaje || "Contraseña de administrador incorrecta");
        }
    } catch (err) {
        console.error("Error en login admin:", err);
        notificar(false, "Error de comunicación con el servidor");
    }
}

async function cargarUsuarioNormal(notificarCierre = false) {
    const fallback = { username: "usuario", nombre_completo: "Usuario", rol: "usuario", url_imagen: IMG_USUARIO_DEF };
    try {
        const data = await postLogin({ accion: "usuario_defecto" });
        const base = data?.ok && data.datos ? data.datos : fallback;
        establecerSesion({ ...base, rol: "usuario", url_imagen: base.url_imagen || IMG_USUARIO_DEF });
        if (notificarCierre) notificar(true, "Sesión de administrador cerrada");
    } catch (err) {
        console.error("Error al recuperar usuario normal:", err);
        establecerSesion(fallback);
        if (notificarCierre) notificar(false, "Error al cerrar la sesión");
    }
}

function syncBtnCerrar(contenedorId, btnId, esAdmin, html, extraClass = "") {
    const cont = $(contenedorId);
    const btn = $(btnId);
    if (!cont) return;

    if (!esAdmin) return btn?.remove();
    if (btn) return;

    const nuevo = Object.assign(document.createElement("button"), {
        type: "button",
        id: btnId,
        className: `btn btn-outline-danger btn-sm ${extraClass}`.trim(),
        title: "Cerrar sesión",
        innerHTML: html
    });
    cont.appendChild(nuevo);
}

function aplicarEstadoSesion() {
    const raw = sessionStorage.getItem("usuario");
    if (!raw) return;

    const u = JSON.parse(raw);
    const rol = sessionStorage.getItem("rol") || u.rol || "usuario";
    const esAdmin = rol === "admin";
    const nombre = u.nombre_completo || u.username || "Usuario";
    const img = u.url_imagen || (esAdmin ? "" : IMG_USUARIO_DEF);

    pintarEn(["badgeRolActual", "badgeRolMovil"], (el) => {
        el.textContent = rol;
        el.className = esAdmin ? "badge bg-success" : "badge bg-secondary";
    });
    pintarEn(["nombreUsuarioActual", "nombreUsuarioMovil"], (el) => { el.textContent = nombre; });
    pintarEn(["avatarUsuarioActual", "avatarUsuarioMovil"], (el) => { el.src = img; el.alt = nombre; });

    syncBtnCerrar("contenedorAccionesSesion", "btnCerrarSesion", esAdmin, '<i class="bi bi-box-arrow-right me-1"></i> Cerrar sesión');
    syncBtnCerrar("contenedorAccionesMovil", "btnCerrarSesionMovil", esAdmin, '<i class="bi bi-box-arrow-right"></i>', "py-0 px-2");
}

document.addEventListener("DOMContentLoaded", async () => {
    if (!sessionStorage.getItem("usuario") || !sessionStorage.getItem("rol")) {
        await cargarUsuarioNormal(false);
    } else {
        aplicarEstadoSesion();
    }

    if ($("sec-inicio") && !$("sec-inicio").classList.contains("d-none")) {
        renderizarInicio();
    }

    const cerrarSesion = async () => { await cargarUsuarioNormal(true); togglePanelAdmin(false); };
    const clicks = {
        mnuInicio: mostrarInicio,
        mnuMovilInicio: mostrarInicio,
        btnAbrirSesionAdmin: () => togglePanelAdmin(true, "escritorio"),
        btnAbrirSesionAdminMovil: () => togglePanelAdmin(true, "movil"),
        btnCancelarAdmin: () => togglePanelAdmin(false),
        btnCancelarAdminMovil: () => togglePanelAdmin(false),
        btnConfirmarAdmin: () => loginAdmin("passAdmin"),
        btnConfirmarAdminMovil: () => loginAdmin("passAdminMovil"),
        btnCerrarSesion: cerrarSesion,
        btnCerrarSesionMovil: cerrarSesion
    };

    document.addEventListener("click", (e) => {
        const id = e.target.closest("button, a")?.id;
        if (id && clicks[id]) clicks[id]();
    });

    document.addEventListener("keydown", async (e) => {
        if (e.key === "Enter" && (e.target.id === "passAdmin" || e.target.id === "passAdminMovil")) {
            e.preventDefault();
            await loginAdmin(e.target.id);
        }
    });
});

async function obtenerResumenTablas(rol) {
    try {
        const fd = new FormData();
        fd.append("rol", rol);
        const res = await peticionPOST("resumen_inicio.php", fd);
        const data = typeof res === "string" ? JSON.parse(res) : res;
        if (data?.ok && data.datos) return data.datos;
    } catch (_) {
        // Fallback si aún no existe resumen_inicio.php
    }

    const respPrestamos = await oBiblioteca.listadoPrestamos().catch(() => null);
    const totalPrestamos = respPrestamos?.datos?.length ?? 0;

    return {
        paises: "-",
        editorial_carlos: "-",
        libros_manuel: "-",
        estados_ejemplar: "-",
        ejemplares_juanjo: "-",
        prestamos_juanjorpa: totalPrestamos,
        usuarios: "-"
    };
}

async function renderizarInicio() {
    const seccion = document.getElementById("sec-inicio");
    if (!seccion) return;

    let cont = document.getElementById("contenidoInicio");
    if (!cont) {
        cont = document.createElement("div");
        cont.id = "contenidoInicio";
        seccion.appendChild(cont);
    }

    const rol = sessionStorage.getItem("rol") || "usuario";
    const esAdmin = rol === "admin";
    const r = await obtenerResumenTablas(rol);

    const tarjetas = [
        { tabla: "editorial_carlos", titulo: "Editoriales", icono: "bi-building", alcance: esAdmin ? "Total" : "Activas" },
        { tabla: "paises", titulo: "Países", icono: "bi-globe-europe-africa", alcance: "Catálogo" },
        { tabla: "libros_manuel", titulo: "Libros", icono: "bi-book", alcance: esAdmin ? "Total" : "Activos" },
        { tabla: "ejemplares_juanjo", titulo: "Ejemplares", icono: "bi-upc-scan", alcance: esAdmin ? "Total" : "Activos" },
        { tabla: "estados_ejemplar", titulo: "Estados", icono: "bi-bookmark-check", alcance: "Catálogo" },
        { tabla: "prestamos_juanjorpa", titulo: "Préstamos", icono: "bi-arrow-left-right", alcance: esAdmin ? "Total" : "Activos" },
        { tabla: "usuarios", titulo: "Usuarios", icono: "bi-people", alcance: esAdmin ? "Total" : "Activos" }
    ];

    cont.innerHTML = `
        <div class="container-fluid min-vh-75 d-flex align-items-center justify-content-center py-4">
            <div class="w-100">
                <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-7 g-2 justify-content-center align-items-center">
                    ${tarjetas.map((t) => `
                        <div class="col">
                            <div class="card h-100 border border-2 border-success bg-white shadow-sm rounded-3 overflow-hidden">
                                <div class="card-header bg-dark text-white text-center fw-semibold py-2 px-1 small">
                                    ${t.titulo}
                                </div>
                                <div class="card-body d-flex flex-column align-items-center justify-content-center text-center py-3 px-2">
                                    <span class="badge rounded-circle bg-success text-white p-2 mb-2">
                                        <i class="bi ${t.icono} fs-5"></i>
                                    </span>
                                    <div class="fs-2 fw-bold text-dark lh-1 mb-2">${r[t.tabla] ?? 0}</div>
                                    <div class="small text-secondary text-break">${t.tabla}</div>
                                </div>
                                <div class="card-footer bg-light text-muted text-center small py-1 px-2">
                                    ${t.alcance}
                                </div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>
        </div>
    `;
}