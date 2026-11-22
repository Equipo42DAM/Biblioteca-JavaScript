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