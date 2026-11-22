<?php
require_once __DIR__ . '/config.php';

$conexion = obtenerConexion();
$metodo = $_SERVER['REQUEST_METHOD'];

// =========================================================================
// GET: LISTAR O BUSCAR LIBROS
// =========================================================================
if ($metodo === 'GET') {
    $busqueda = isset($_GET['busqueda']) ? trim($_GET['busqueda']) : '';
    $criterio = isset($_GET['criterio']) ? $_GET['criterio'] : 'titulo';

    if ($busqueda !== '') {
        $columna = ($criterio === 'anio_edicion') ? 'anio_edicion' : 'titulo';
        $like = '%' . $busqueda . '%';

        $stmt = $conexion->prepare(
            "SELECT id_libro, id_editorial, titulo, isbn, anio_edicion, fecha_baja, esta_espanol, url_imagen
             FROM libros_manuel
             WHERE $columna LIKE ?
             ORDER BY id_libro ASC"
        );

        if (!$stmt) {
            responder(null, false, "Error al preparar la búsqueda: " . $conexion->error, $conexion);
        }

        $stmt->bind_param("s", $like);
        $stmt->execute();
        $resultado = $stmt->get_result();
    } else {
        $resultado = $conexion->query(
            "SELECT id_libro, id_editorial, titulo, isbn, anio_edicion, fecha_baja, esta_espanol, url_imagen
             FROM libros_manuel
             ORDER BY id_libro ASC"
        );
    }

    if (!$resultado) {
        responder(null, false, "Error en la consulta: " . $conexion->error, $conexion);
    }

    $libros = [];
    while ($fila = $resultado->fetch_assoc()) {
        if (!empty($fila['url_imagen'])) {
            $rutaRelativa = ltrim($fila['url_imagen'], '/');
            $rutaFisica = __DIR__ . '/../' . $rutaRelativa;
            if (!file_exists($rutaFisica)) {
                $fila['url_imagen'] = null;
            }
        }
        $libros[] = $fila;
    }

    responder($libros, true, "OK", $conexion);
}

// =========================================================================
// POST: GUARDAR, EDITAR, DAR DE BAJA O DAR DE ALTA
// =========================================================================
if ($metodo === 'POST') {
    $accion = $_POST['accion'] ?? 'guardar';

    if ($accion === 'baja' || $accion === 'alta') {
        $id_libro = intval($_POST['id_libro'] ?? 0);
        if ($id_libro <= 0) {
            responder(null, false, "Falta el ID del libro.", $conexion);
        }

        $fecha_baja = ($accion === 'baja') ? date('Y-m-d') : null;

        $stmt = $conexion->prepare("UPDATE libros_manuel SET fecha_baja = ? WHERE id_libro = ?");
        if (!$stmt) {
            responder(null, false, "Error al preparar el cambio de estado: " . $conexion->error, $conexion);
        }

        $stmt->bind_param("si", $fecha_baja, $id_libro);
        if (!$stmt->execute()) {
            responder(null, false, "Error al actualizar el estado: " . $stmt->error, $conexion);
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
    $esta_espanol = (isset($_POST['esta_espanol']) && $_POST['esta_espanol'] !== '') ? intval($_POST['esta_espanol']) : 0;

    if ($titulo === '' || $id_editorial === '' || $isbn === '') {
        responder(null, false, "Por favor, completa los campos obligatorios (*).", $conexion);
    }

    $id_editorial_int = intval($id_editorial);
    $anio_edicion = ($anio_edicion_raw !== '') ? intval($anio_edicion_raw) : null;
    $fecha_baja = ($fecha_baja_raw !== '') ? $fecha_baja_raw : null;

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
            responder(null, false, "Error al preparar la actualización: " . $conexion->error, $conexion);
        }

        $stmt->bind_param(
            "sisssisi",
            $titulo,
            $id_editorial_int,
            $isbn,
            $anio_edicion,
            $fecha_baja,
            $esta_espanol,
            $ruta_imagen,
            $id_libro_int
        );

        if (!$stmt->execute()) {
            responder(null, false, "Error al actualizar el libro: " . $stmt->error, $conexion);
        }

        responder(null, true, "Libro actualizado correctamente.", $conexion);
    }

    $stmt = $conexion->prepare(
        "INSERT INTO libros_manuel
            (titulo, id_editorial, isbn, anio_edicion, fecha_baja, esta_espanol, url_imagen)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    if (!$stmt) {
        responder(null, false, "Error al preparar el alta: " . $conexion->error, $conexion);
    }

    $stmt->bind_param(
        "sisssis",
        $titulo,
        $id_editorial_int,
        $isbn,
        $anio_edicion,
        $fecha_baja,
        $esta_espanol,
        $ruta_imagen
    );

    if (!$stmt->execute()) {
        responder(null, false, "Error al guardar el libro: " . $stmt->error, $conexion);
    }

    responder(["id_libro" => $conexion->insert_id], true, "Libro guardado correctamente.", $conexion);
}

responder(null, false, "Método no permitido.", $conexion);