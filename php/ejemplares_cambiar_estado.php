<?php
require_once("config.php");

$conexion = null;

try {
    $conexion = obtenerConexion();

    $idEjemplar = (int) ($_POST["idEjemplar"] ?? 0);
    $accion = $_POST["accion"] ?? "";

    if ($idEjemplar <= 0) {
        responder(null, false, "El ejemplar indicado no es válido", $conexion);
    }
    if (!in_array($accion, ["baja", "alta"], true)) {
        responder(null, false, "La acción solicitada no es válida", $conexion);
    }

    if ($accion === "baja") {
        // No se permite dar de baja un ejemplar con un préstamo pendiente
        $query = "UPDATE ejemplares_juanjo e SET e.fecha_baja = NOW()
                  WHERE e.id_ejemplar = ? AND e.fecha_baja IS NULL
                  AND NOT EXISTS (SELECT 1 FROM prestamos_juanjorpa p
                                  WHERE p.id_ejemplar = e.id_ejemplar
                                  AND p.fecha_baja IS NULL
                                  AND p.fecha_devolucion IS NULL)";
        $mensajeOk = "Ejemplar dado de baja";
        $mensajeError = "No se pudo dar de baja: el ejemplar no existe, ya está de baja o tiene un préstamo pendiente";
    } else {
        $query = "UPDATE ejemplares_juanjo SET fecha_baja = NULL
                  WHERE id_ejemplar = ? AND fecha_baja IS NOT NULL";
        $mensajeOk = "Ejemplar reactivado";
        $mensajeError = "No se pudo reactivar: el ejemplar no existe o ya está activo";
    }

    $stmt = $conexion->prepare($query);
    if (!$stmt) {
        responder(null, false, "Error al preparar la consulta: " . $conexion->error, $conexion);
    }

    $stmt->bind_param("i", $idEjemplar);
    $stmt->execute();
    $filas_afectadas = $stmt->affected_rows;

    if ($filas_afectadas > 0) {
        responder($filas_afectadas, true, $mensajeOk, $conexion);
    } else {
        responder(0, false, $mensajeError, $conexion);
    }

} catch (mysqli_sql_exception $e) {
    responder(null, false, "Error en la base de datos: " . $e->getMessage(), $conexion);
} catch (Exception $e) {
    responder(null, false, "Error general: " . $e->getMessage(), $conexion);
}

?>
