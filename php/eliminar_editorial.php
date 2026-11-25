<?php
require_once('config.php');

try {
    if (empty($_POST["idEditorial"])) {
        throw new Exception("ID de editorial no proporcionado");
    }

    $idEditorial = intval($_POST["idEditorial"]);
    $conexion = obtenerConexion();

    $sql = "DELETE FROM editorial_carlos WHERE id_editorial = ?;";
    $stmt = $conexion->prepare($sql);
    $stmt->bind_param("i", $idEditorial);
    $stmt->execute();

    $stmt->close();

    responder(null, true, "Editorial eliminada correctamente", $conexion);
} catch (mysqli_sql_exception $e) {
    responder(null, false, "Error en la base de datos: " . $e->getMessage(), null);
} catch (Exception $e) {
    responder(null, false, "Error: " . $e->getMessage(), null);
}
