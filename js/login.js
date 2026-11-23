"use strict";

const IMG_USUARIO_DEF = "img/usuarios/U02.webp";
const $ = (id) => document.getElementById(id);
const pintarEn = (ids, fn) => ids.forEach((id) => { const el = $(id); if (el) fn(el); });

const notificar = (ok, mensaje) => {
    const fn = window.mostrarNotificacion || window.notificaciones;
    typeof fn === "function" ? fn({ ok, mensaje }) : alert(mensaje);
};

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

    if ($("frmCardPrestamo")?.classList.contains("d-none") && typeof mostrarListadoPrestamos === "function") {
        mostrarListadoPrestamos();
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

    const cerrarSesion = async () => { await cargarUsuarioNormal(true); togglePanelAdmin(false); };
    const clicks = {
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
        const id = e.target.closest("button")?.id;
        if (id && clicks[id]) clicks[id]();
    });

    document.addEventListener("keydown", async (e) => {
        if (e.key === "Enter" && (e.target.id === "passAdmin" || e.target.id === "passAdminMovil")) {
            e.preventDefault();
            await loginAdmin(e.target.id);
        }
    });
});