<?php
require_once("config.php");

// config.php desactiva las excepciones de mysqli; aquí las necesitamos para detectar fallos al guardar
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

$conexion = null;

try {
    $conexion = obtenerConexion();
    $ejemplar = json_decode($_POST["ejemplar"] ?? "", true);

    if (!is_array($ejemplar)) {
        responder(null, false, "Datos del ejemplar no válidos", $conexion);
    }

    $enteroPositivo = function ($valor) {
        if (!is_string($valor) && !is_int($valor)) {
            return false;
        }
        return filter_var($valor, FILTER_VALIDATE_INT, ["options" => ["min_range" => 1, "max_range" => 2147483647]]);
    };

    $idRaw = $ejemplar["idEjemplar"] ?? "";
    $id = ($idRaw === "" || $idRaw === null) ? 0 : $enteroPositivo($idRaw);
    $idLibro = $enteroPositivo($ejemplar["idLibro"] ?? "");
    $idEstado = $enteroPositivo($ejemplar["idEstado"] ?? "");
    $numeroCopia = $enteroPositivo($ejemplar["numeroCopia"] ?? "");
    $codigo = trim((string) ($ejemplar["codigoBarras"] ?? ""));
    $signatura = trim((string) ($ejemplar["signatura"] ?? ""));
    $signatura = $signatura !== "" ? $signatura : null;
    $imagen = trim((string) ($ejemplar["urlImagen"] ?? ""));
    $imagen = $imagen !== "" ? $imagen : null;
    $referencia = !empty($ejemplar["esReferencia"]) && (string) $ejemplar["esReferencia"] !== "0" ? 1 : 0;

    if ($id === false || $idLibro === false || $idEstado === false || $numeroCopia === false
        || !preg_match('/^.{1,50}$/us', $codigo)
        || !preg_match('/^.{0,50}$/us', $signatura ?? "")
        || !preg_match('/^.{0,255}$/us', $imagen ?? "")) {
        responder(null, false, "Revisa los campos obligatorios y sus valores. El número de copia debe ser positivo", $conexion);
    }

    // Ejemplar actual (si se edita) y si tiene historial de préstamos
    $stmt = $conexion->prepare(
        "SELECT e.id_libro, EXISTS(SELECT 1 FROM prestamos_juanjorpa p WHERE p.id_ejemplar = e.id_ejemplar) AS tiene_prestamos
         FROM ejemplares_juanjo e WHERE e.id_ejemplar = ?"
    );
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $actual = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($id && !$actual) {
        responder(null, false, "El ejemplar que intentas editar no existe", $conexion);
    }
    if ($actual && (int) $actual["id_libro"] !== $idLibro && (int) $actual["tiene_prestamos"] === 1) {
        responder(null, false, "No se puede cambiar el libro de un ejemplar con historial de préstamos", $conexion);
    }

    $libroActual = $actual ? (int) $actual["id_libro"] : 0;
    $stmt = $conexion->prepare("SELECT id_libro FROM libros_manuel WHERE id_libro = ? AND (fecha_baja IS NULL OR id_libro = ?)");
    $stmt->bind_param("ii", $idLibro, $libroActual);
    $stmt->execute();
    $libroValido = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $stmt = $conexion->prepare("SELECT id_estado FROM estados_ejemplar WHERE id_estado = ?");
    $stmt->bind_param("i", $idEstado);
    $stmt->execute();
    $estadoValido = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$libroValido || !$estadoValido) {
        responder(null, false, "Selecciona un libro disponible y un estado válidos", $conexion);
    }

    try {
        if ($id) {
            $stmt = $conexion->prepare(
                "UPDATE ejemplares_juanjo e SET id_libro = ?, id_estado = ?, codigo_barras = ?, signatura = ?,
                 numero_copia = ?, es_referencia = ?, url_imagen = ?
                 WHERE id_ejemplar = ? AND (id_libro = ? OR NOT EXISTS
                     (SELECT 1 FROM prestamos_juanjorpa p WHERE p.id_ejemplar = e.id_ejemplar))"
            );
            $stmt->bind_param("iissiisii", $idLibro, $idEstado, $codigo, $signatura, $numeroCopia, $referencia, $imagen, $id, $idLibro);
        } else {
            $stmt = $conexion->prepare(
                "INSERT INTO ejemplares_juanjo (id_libro, id_estado, codigo_barras, signatura, numero_copia, es_referencia, url_imagen)
                 VALUES (?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->bind_param("iissiis", $idLibro, $idEstado, $codigo, $signatura, $numeroCopia, $referencia, $imagen);
        }
        $stmt->execute();
        $nuevoId = $id ? $id : $stmt->insert_id;
        $filas = $stmt->affected_rows;
        $stmt->close();

        // Una fila sin cambios también devuelve 0 filas afectadas
        if ($id && $filas === 0) {
            $comprobar = $conexion->prepare("SELECT id_libro FROM ejemplares_juanjo WHERE id_ejemplar = ?");
            $comprobar->bind_param("i", $id);
            $comprobar->execute();
            $guardado = $comprobar->get_result()->fetch_assoc();
            $comprobar->close();
            if (!$guardado || (int) $guardado["id_libro"] !== $idLibro) {
                responder(null, false, "No se pudo actualizar el ejemplar: no existe o tiene historial de préstamos", $conexion);
            }
        }

        responder($nuevoId, true, $id ? "Ejemplar actualizado" : "Ejemplar creado", $conexion);
    } catch (mysqli_sql_exception $e) {
        if ($e->getCode() === 1062) {
            responder(null, false, "Ya existe un ejemplar con ese código de barras", $conexion);
        } elseif ($e->getCode() === 1452) {
            responder(null, false, "El libro o el estado seleccionado ya no existe", $conexion);
        }
        throw $e;
    }

} catch (mysqli_sql_exception $e) {
    responder(null, false, "Error en la base de datos: " . $e->getMessage(), $conexion);
} catch (Exception $e) {
    responder(null, false, "Error general: " . $e->getMessage(), $conexion);
}
?>
