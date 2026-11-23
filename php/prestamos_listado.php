<?php
declare(strict_types=1);
require_once("config.php");

$conexion = null;

try {
    $conexion = obtenerConexion();

    $rol = trim((string)($_POST["rol"] ?? $_GET["rol"] ?? "usuario"));
    $buscar = trim((string)($_POST["buscar"] ?? $_GET["buscar"] ?? ""));

    $sql = "SELECT
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
            INNER JOIN ejemplares_juanjo e ON p.id_ejemplar = e.id_ejemplar
            INNER JOIN libros_manuel l ON e.id_libro = l.id_libro";

    $condiciones = [];
    $tipos = "";
    $params = [];

    if ($rol !== "admin") {
        $condiciones[] = "p.fecha_baja IS NULL AND p.fecha_devolucion IS NULL";
    }

    if ($buscar !== "") {
        $condiciones[] = "(l.titulo LIKE ? OR p.observaciones LIKE ? OR CAST(p.id_prestamo AS CHAR) LIKE ?)";
        $like = "%{$buscar}%";
        $tipos .= "sss";
        array_push($params, $like, $like, $like);
    }

    if ($condiciones) {
        $sql .= " WHERE " . implode(" AND ", $condiciones);
    }

    $sql .= " ORDER BY p.id_prestamo ASC";

    $stmt = $conexion->prepare($sql);
    if (!$stmt) {
        throw new RuntimeException("Error al preparar la consulta: " . $conexion->error);
    }

    if ($params) {
        $stmt->bind_param($tipos, ...$params);
    }

    $stmt->execute();
    $resultado = $stmt->get_result();
    $prestamos = $resultado ? $resultado->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();

    responder($prestamos, true, "Datos recuperados correctamente", $conexion);

} catch (mysqli_sql_exception $e) {
    responder(null, false, "Error en la base de datos: " . $e->getMessage(), $conexion);
} catch (Throwable $e) {
    responder(null, false, "Error: " . $e->getMessage(), $conexion);
}
?>