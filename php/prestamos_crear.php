<?php
require_once("config.php");
try {
    $conexion = obtenerConexion();
    $prestamo = json_decode($_POST['prestamo'], true);

    if (!is_array($prestamo)) {
        responder(null, false, "Datos del préstamo no válidos", $conexion);
    }

    $query = "INSERT INTO prestamos_juanjorpa 
              (id_ejemplar, fecha_prestamo, fecha_limite, tiene_fianza, importe_fianza, url_imagen, observaciones) 
              VALUES (?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conexion->prepare($query);
    if (!$stmt) {
        responder(null, false, "Error al preparar la consulta: " . $conexion->error, $conexion);
    }

    $stmt->bind_param(
        "issidss",
        $prestamo['idEjemplar'],
        $prestamo['fechaPrestamo'],
        $prestamo['fechaLimite'],
        $prestamo['tieneFianza'],
        $prestamo['importeFianza'],
        $prestamo['urlImagen'],
        $prestamo['observaciones']
    );

    if ($stmt->execute()) {
        $nuevo_id = $conexion->insert_id;
        $filas_afectadas = $stmt->affected_rows;
    } else {
        $nuevo_id = 0;
        $filas_afectadas = 0;
    }

    $stmt->close();

    $ok = $filas_afectadas > 0;
    $mensaje = $ok ? "Guardado el nuevo préstamo" : "No se ha registrado el nuevo préstamo";

    responder($nuevo_id, $ok, $mensaje, $conexion);
    
} catch (mysqli_sql_exception $e) {
    // Errores específicos de mysqli
    responder(null, false, "Error en la base de datos: " . $e->getMessage(), $conexion ?? null);
} catch (Exception $e) {
    // Captura cualquier otra excepción / error inesperado
    responder(null, false, "Error general: " . $e->getMessage(), $conexion ?? null);
}
