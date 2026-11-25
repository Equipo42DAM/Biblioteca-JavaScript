async function peticionAjax(url, metodo = "GET", datos = null) {
    const metodoUpper = metodo.toUpperCase();
    const opciones = { method: metodoUpper };
    const urlFinal = new URL(url, window.location.href);

    if (metodoUpper === "GET" && datos) {
        Object.keys(datos).forEach((clave) => {
            const valor = datos[clave];
            if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
                urlFinal.searchParams.set(clave, valor);
            }
        });
    } else if (metodoUpper !== "GET" && datos) {
        opciones.body = datos;
    }

    const respuesta = await fetch(urlFinal, opciones);
    let json = null;

    try {
        json = await respuesta.json();
    } catch (e) {
        json = null;
    }

    return {
        ok: respuesta.ok,
        status: respuesta.status,
        datos: json,
        mensaje: respuesta.ok ? "OK" : `Error HTTP (${respuesta.status})`
    };
}
"use strict";

const rutaBackend = "http://localhost:8082/php/";
/**
 * Realiza peticiones AJAX de tipo GET
 * @param {string} url 
 * @param {FormData} parametros - Objeto FormData con los parámetros de la llamada 
 * @returns {Object} response
 */
async function peticionGET(url, parametros = new FormData()) {
    let response;

    try {
        // Construimos la URL completa
        let oURL = new URL(rutaBackend);
        oURL.pathname += url;

        // Añadimos los parámetros del FormData
        for (let [clave, valor] of parametros) {
            oURL.searchParams.append(clave, valor);
        }

        // Hacemos la petición
        const respuestaServidor = await fetch(oURL, { method: "GET" });

        if (respuestaServidor.ok) {
            response = await respuestaServidor.json();
        } else {
            console.error("Error al acceder al servidor. Status:", respuestaServidor.status);
            response = {
                ok: false,
                mensaje: `Error HTTP: ${respuestaServidor.status}`,
                datos: null
            };
        }

    } catch (error) {
        // Error de conexión o fetch (no hay respuesta del servidor)
        console.error("No se pudo conectar con el servidor:", error);
        response = {
            ok: false,
            mensaje: "No se pudo conectar con el servidor. Verifique su conexión o que el servidor esté disponible.",
            datos: null
        };
    }

    return response;
}

/**
 * Realiza peticiones AJAX de tipo POST
 * @param {string} url 
 * @param {FormData} parametros - Objeto FormData con los parámetros de la llamada 
 * @returns {Object} response
 */
async function peticionPOST(url, parametros) {
    let response;

    try {
        // Construimos la URL completa
        let oURL = new URL(rutaBackend);
        oURL.pathname += url;

        // Hacemos la petición (request)
        const respuestaServidor = await fetch(oURL, {
            body: parametros,
            method: "POST"
        });

        if (respuestaServidor.ok) {
            response = await respuestaServidor.json();
        } else {
            console.error("Error al acceder al servidor. Status:", respuestaServidor.status);
            response = {
                ok: false,
                mensaje: `Error HTTP: ${respuestaServidor.status}`,
                datos: null
            };
        }

    } catch (error) {
        // Error de conexión o fetch (no hay respuesta del servidor)
        console.error("No se pudo conectar con el servidor:", error);
        response = {
            ok: false,
            mensaje: "No se pudo conectar con el servidor. Verifique su conexión o que el servidor esté disponible.",
            datos: null
        };
    }

    return response;
}
