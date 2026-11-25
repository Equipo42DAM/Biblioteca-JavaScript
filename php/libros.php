<?php
require_once __DIR__ . '/config.php';

$conexion = obtenerConexion();
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $accion = $_GET['accion'] ?? 'listar';

    if ($accion === 'editoriales') {
        $resEd = $conexion->query("SELECT * FROM editorial_carlos ORDER BY 1 ASC");
        if (!$resEd) {
            responder(null, false, "Error al cargar editoriales: " . $conexion->error, $conexion);
        }
        $editoriales = [];
        while ($ed = $resEd->fetch_assoc()) {
            $id = $ed['id_editorial'] ?? reset($ed);
            $nombre = $ed['nombre_editorial'] ?? $ed['nombre'] ?? ('Editorial #' . $id);
            $editoriales[] = [
                'id_editorial' => $id,
                'nombre_editorial' => $nombre
            ];
        }
        responder($editoriales, true, "OK", $conexion);
    }

    $busqueda = isset($_GET['busqueda']) ? trim($_GET['busqueda']) : '';
    $criterio = isset($_GET['criterio']) ? $_GET['criterio'] : 'titulo';
    $filtroEspanol = isset($_GET['esta_espanol']) ? trim($_GET['esta_espanol']) : '';

    $columnasPermitidas = [
        'titulo' => 'l.titulo',
        'isbn' => 'l.isbn',
        'anio_edicion' => 'l.anio_edicion'
    ];
    $columnaFiltro = $columnasPermitidas[$criterio] ?? 'l.titulo';

    $sql = "SELECT l.id_libro, l.id_editorial, l.titulo, l.isbn, l.anio_edicion,
                   l.fecha_baja, l.esta_espanol, l.url_imagen
            FROM libros_manuel l";

    $condiciones = [];
    $tipos = "";
    $params = [];

    if ($busqueda !== '') {
        $condiciones[] = "$columnaFiltro LIKE ?";
        $tipos .= "s";
        $params[] = '%' . $busqueda . '%';
    }

    if ($filtroEspanol !== '' && ($filtroEspanol === '0' || $filtroEspanol === '1')) {
        $condiciones[] = "l.esta_espanol = ?";
        $tipos .= "i";
        $params[] = intval($filtroEspanol);
    }

    if (count($condiciones) > 0) {
        $sql .= " WHERE " . implode(" AND ", $condiciones);
    }

    $sql .= " ORDER BY l.id_libro ASC";

    $stmt = $conexion->prepare($sql);
    if (!$stmt) {
        responder(null, false, "Error al preparar consulta: " . $conexion->error, $conexion);
    }

    if ($tipos !== "") {
        $stmt->bind_param($tipos, ...$params);
    }

    $stmt->execute();
    $resultado = $stmt->get_result();

    if (!$resultado) {
        responder(null, false, "Error al ejecutar consulta: " . $conexion->error, $conexion);
    }

    $libros = [];
    while ($fila = $resultado->fetch_assoc()) {
        if (!empty($fila['url_imagen'])) {
            $rutaFisica = __DIR__ . '/../' . ltrim($fila['url_imagen'], '/');
            if (!file_exists($rutaFisica)) {
                $fila['url_imagen'] = null;
            }
        }
        $libros[] = $fila;
    }

    responder($libros, true, "OK", $conexion);
}

if ($metodo === 'POST') {
    $accion = $_POST['accion'] ?? 'guardar';

    if ($accion === 'baja' || $accion === 'alta') {
        $id_libro = intval($_POST['id_libro'] ?? 0);
        if ($id_libro <= 0) {
            responder(null, false, "Falta el ID del libro.", $conexion);
        }

        $fecha_baja = ($accion === 'baja') ? date('Y-m-d H:i:s') : null;

        $stmt = $conexion->prepare("UPDATE libros_manuel SET fecha_baja = ? WHERE id_libro = ?");
        if (!$stmt) {
            responder(null, false, "Error al preparar el cambio de estado: " . $conexion->error, $conexion);
        }

        $stmt->bind_param("si", $fecha_baja, $id_libro);
        if (!$stmt->execute()) {
            responder(null, false, "Error al actualizar el estado: " . $conexion->error, $conexion);
        }

        $msg = ($accion === 'baja') ? "Libro dado de baja correctamente." : "Libro dado de alta correctamente.";
        responder(null, true, $msg, $conexion);
    }

    $id_libro = trim($_POST['id_libro'] ?? '');
    $titulo = trim($_POST['titulo'] ?? '');
    $id_editorial = trim($_POST['id_editorial'] ?? '');
    $isbn = trim($_POST['isbn'] ?? '');
    $anio_edicion_raw = trim($_POST['anio_edicion'] ?? '');
    $fecha_baja_raw = trim($_POST['fecha_baja'] ?? '');
    $esta_espanol = (isset($_POST['esta_espanol']) && $_POST['esta_espanol'] !== '') ? intval($_POST['esta_espanol']) : 1;

    if ($titulo === '' || $id_editorial === '') {
        responder(null, false, "Completa los campos obligatorios (*).", $conexion);
    }

    $id_editorial_int = intval($id_editorial);
    $isbn_val = ($isbn !== '') ? $isbn : null;
    $anio_edicion = ($anio_edicion_raw !== '') ? intval($anio_edicion_raw) : null;
    $fecha_baja = null;
    if ($fecha_baja_raw !== '') {
        $fecha_baja = (strlen($fecha_baja_raw) === 10) ? ($fecha_baja_raw . ' 00:00:00') : $fecha_baja_raw;
    }

    $ruta_imagen = null;
    if ($id_libro !== '') {
        $id_libro_int = intval($id_libro);
        $stmt_img = $conexion->prepare("SELECT url_imagen FROM libros_manuel WHERE id_libro = ?");
        if ($stmt_img) {
            $stmt_img->bind_param("i", $id_libro_int);
            $stmt_img->execute();
            $res_img = $stmt_img->get_result();
            if ($fila_img = $res_img->fetch_assoc()) {
                $ruta_imagen = $fila_img['url_imagen'];
            }
        }
    }

    if (isset($_FILES['url_imagen']) && $_FILES['url_imagen']['error'] === UPLOAD_ERR_OK) {
        $carpetaFisica = __DIR__ . '/../img/libros/';
        if (!file_exists($carpetaFisica)) {
            mkdir($carpetaFisica, 0777, true);
        }

        $nombreArchivo = time() . '_' . basename($_FILES['url_imagen']['name']);
        $archivoRutaFisica = $carpetaFisica . $nombreArchivo;

        if (move_uploaded_file($_FILES['url_imagen']['tmp_name'], $archivoRutaFisica)) {
            $ruta_imagen = 'img/libros/' . $nombreArchivo;
        }
    }

    if ($id_libro !== '') {
        $id_libro_int = intval($id_libro);
        $stmt = $conexion->prepare(
            "UPDATE libros_manuel
             SET titulo = ?, id_editorial = ?, isbn = ?, anio_edicion = ?, fecha_baja = ?, esta_espanol = ?, url_imagen = ?
             WHERE id_libro = ?"
        );
        if (!$stmt) {
            responder(null, false, "Error al preparar actualización: " . $conexion->error, $conexion);
        }

        $stmt->bind_param(
            "sisssisi",
            $titulo,
            $id_editorial_int,
            $isbn_val,
            $anio_edicion,
            $fecha_baja,
            $esta_espanol,
            $ruta_imagen,
            $id_libro_int
        );

        if (!$stmt->execute()) {
            responder(null, false, "Error al actualizar libro: " . $stmt->error, $conexion);
        }

        responder(null, true, "Libro actualizado correctamente.", $conexion);
    }

    $stmt = $conexion->prepare(
        "INSERT INTO libros_manuel
            (titulo, id_editorial, isbn, anio_edicion, fecha_baja, esta_espanol, url_imagen)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    if (!$stmt) {
        responder(null, false, "Error al preparar alta: " . $conexion->error, $conexion);
    }

    $stmt->bind_param(
        "sisssis",
        $titulo,
        $id_editorial_int,
        $isbn_val,
        $anio_edicion,
        $fecha_baja,
        $esta_espanol,
        $ruta_imagen
    );

    if (!$stmt->execute()) {
        responder(null, false, "Error al guardar libro: " . $stmt->error, $conexion);
    }

    responder(["id_libro" => $conexion->insert_id], true, "Libro guardado correctamente.", $conexion);
}

responder(null, false, "Método no permitido.", $conexion);