<?php
declare(strict_types=1);
require_once("config.php");

$conexion = null;

try {
    $conexion = obtenerConexion();

    $libros = $conexion
        ->query("SELECT id_libro, titulo, fecha_baja FROM libros_manuel ORDER BY titulo, id_libro")
        ->fetch_all(MYSQLI_ASSOC);
    $estados = $conexion
        ->query("SELECT id_estado, nombre_estado FROM estados_ejemplar ORDER BY nombre_estado")
        ->fetch_all(MYSQLI_ASSOC);

    responder(["libros" => $libros, "estados" => $estados], true, "Datos recuperados correctamente", $conexion);

} catch (mysqli_sql_exception $e) {
    responder(null, false, "Error en la base de datos: " . $e->getMessage(), $conexion);
} catch (Throwable $e) {
    responder(null, false, "Error: " . $e->getMessage(), $conexion);
}
?>
