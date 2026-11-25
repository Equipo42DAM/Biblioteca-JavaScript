<?php
declare(strict_types=1);
require_once("config.php");

$conexion = null;

try {
    $conexion = obtenerConexion();

    $rol = trim((string)($_POST["rol"] ?? $_GET["rol"] ?? "usuario"));
    $buscar = trim((string)($_POST["buscar"] ?? $_GET["buscar"] ?? ""));

    $sql = "SELECT
                e.id_ejemplar,
                e.id_libro,
                e.id_estado,
                e.codigo_barras,
                e.signatura,
                e.numero_copia,
                e.es_referencia,
                e.url_imagen,
                e.fecha_baja,
                l.titulo,
                l.isbn,
                s.nombre_estado,
                EXISTS(SELECT 1 FROM prestamos_juanjorpa p
                       WHERE p.id_ejemplar = e.id_ejemplar
                       AND p.fecha_baja IS NULL
                       AND p.fecha_devolucion IS NULL) AS prestado
            FROM ejemplares_juanjo e
            INNER JOIN libros_manuel l ON l.id_libro = e.id_libro
            INNER JOIN estados_ejemplar s ON s.id_estado = e.id_estado";

    $condiciones = [];
    $tipos = "";
    $params = [];

    if ($rol !== "admin") {
        $condiciones[] = "e.fecha_baja IS NULL";
    }

    if ($buscar !== "") {
        $condiciones[] = "(l.titulo LIKE ? OR e.codigo_barras LIKE ? OR e.signatura LIKE ? OR l.isbn LIKE ?)";
        $like = "%{$buscar}%";
        $tipos .= "ssss";
        array_push($params, $like, $like, $like, $like);
    }

    if ($condiciones) {
        $sql .= " WHERE " . implode(" AND ", $condiciones);
    }

    $sql .= " ORDER BY e.id_ejemplar DESC";

    $stmt = $conexion->prepare($sql);
    if (!$stmt) {
        throw new RuntimeException("Error al preparar la consulta: " . $conexion->error);
    }

    if ($params) {
        $stmt->bind_param($tipos, ...$params);
    }

    $stmt->execute();
    $resultado = $stmt->get_result();
    $ejemplares = $resultado ? $resultado->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();

    responder($ejemplares, true, "Datos recuperados correctamente", $conexion);

} catch (mysqli_sql_exception $e) {
    responder(null, false, "Error en la base de datos: " . $e->getMessage(), $conexion);
} catch (Throwable $e) {
    responder(null, false, "Error: " . $e->getMessage(), $conexion);
}
?>
