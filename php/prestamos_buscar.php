<?php
require_once("config.php");

try {
    $conexion = obtenerConexion();

    $busqueda = trim($_POST["busqueda"] ?? "");
    $rol = $_POST["rol"] ?? "usuario";

    $query = "SELECT
                p.id_prestamo,
                p.id_ejemplar,
                l.titulo AS titulo_libro,
                p.fecha_prestamo,
                p.fecha_limite,
                p.fecha_devolucion,
                p.observaciones,
                p.importe_fianza,
                p.tiene_fianza,
                p.url_imagen,
                p.fecha_baja
              FROM prestamos_juanjorpa p
              LEFT JOIN ejemplares_juanjo e ON p.id_ejemplar = e.id_ejemplar
              LEFT JOIN libros_manuel l ON e.id_libro = l.id_libro
              WHERE 1=1";

    $tipos = "";
    $parametros = [];

    if ($rol !== "admin") {
        $query .= " AND p.fecha_baja IS NULL AND p.fecha_devolucion IS NULL";
    }

    if ($busqueda !== "") {
        $like = "%" . $busqueda . "%";
        $query .= " AND (l.titulo LIKE ? OR p.observaciones LIKE ? OR CAST(p.id_prestamo AS CHAR) LIKE ?)";
        $tipos .= "sss";
        $parametros[] = $like;
        $parametros[] = $like;
        $parametros[] = $like;
    }

    $query .= " ORDER BY p.id_prestamo DESC";

    $stmt = $conexion->prepare($query);
    if (!$stmt) {
        responder(null, false, "Error al preparar la consulta: " . $conexion->error, $conexion);
    }

    if (!empty($parametros)) {
        $stmt->bind_param($tipos, ...$parametros);
    }

    $stmt->execute();
    $resultado = $stmt->get_result();

    $filas = [];
    while ($fila = $resultado->fetch_assoc()) {
        $filas[] = $fila;
    }

    $stmt->close();

    responder($filas, true, "Búsqueda realizada correctamente", $conexion);

} catch (mysqli_sql_exception $e) {
    responder(null, false, "Error en la base de datos: " . $e->getMessage(), $conexion ?? null);
} catch (Exception $e) {
    responder(null, false, "Error general: " . $e->getMessage(), $conexion ?? null);
}
?>