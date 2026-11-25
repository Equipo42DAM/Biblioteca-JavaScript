<?php

declare(strict_types=1);
require_once("config.php");

$conexion = null;

try {
    $conexion = obtenerConexion();
    $rol = trim((string)($_POST["rol"] ?? $_GET["rol"] ?? "usuario"));
    $esAdmin = ($rol === "admin");

    $tablasConBaja = [
        "editorial_carlos",
        "libros_manuel",
        "ejemplares_juanjo",
        "prestamos_juanjorpa",
        "usuarios"
    ];

    $tablasSinBaja = [
        "paises",
        "estados_ejemplar"
    ];

    $resumen = [];

    foreach ($tablasSinBaja as $tabla) {
        $sql = "SELECT COUNT(*) AS total FROM {$tabla}";
        $res = $conexion->query($sql);
        $resumen[$tabla] = (int)($res?->fetch_assoc()["total"] ?? 0);
    }

    foreach ($tablasConBaja as $tabla) {
        $sql = $esAdmin
            ? "SELECT COUNT(*) AS total FROM {$tabla}"
            : "SELECT COUNT(*) AS total FROM {$tabla} WHERE fecha_baja IS NULL";
        $res = $conexion->query($sql);
        $resumen[$tabla] = (int)($res?->fetch_assoc()["total"] ?? 0);
    }

    responder($resumen, true, "Resumen cargado", $conexion);
} catch (mysqli_sql_exception $e) {
    responder(null, false, "Error en BD: " . $e->getMessage(), $conexion);
} catch (Throwable $e) {
    responder(null, false, "Error: " . $e->getMessage(), $conexion);
}
?>