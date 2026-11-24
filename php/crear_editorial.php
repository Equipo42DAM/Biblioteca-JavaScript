<?php
require_once('config.php');

try {
    if (empty($_POST["editorial"])) {
        throw new Exception("Datos de editorial no proporcionados");
    }

    $editorial = json_decode($_POST["editorial"]);

    if ($editorial === null) {
        throw new Exception("JSON inválido");
    }

    if (empty($editorial->id_pais) || empty($editorial->nombre_comercial) || empty($editorial->contacto) || empty($editorial->anio_origen)) {
        throw new Exception("Faltan campos obligatorios");
    }

    $conexion = obtenerConexion();

    $sql = "INSERT INTO editorial_carlos (id_pais, nombre_comercial, contacto, url_imagen, edita_espanol, anio_origen) VALUES (?, ?, ?, ?, ?, ?);";
    $stmt = $conexion->prepare($sql);

    $id_pais = intval($editorial->id_pais);
    $nombre_comercial = trim($editorial->nombre_comercial);
    $contacto = trim($editorial->contacto);

    $url_imagen = "";
    if (isset($editorial->url_imagen)) {
        $url_imagen = trim($editorial->url_imagen);
    }

    $edita_espanol = 0;
    if (!empty($editorial->edita_espanol)) {
        $edita_espanol = 1;
    }

    $anio_origen = intval($editorial->anio_origen);

    $stmt->bind_param("isssii", $id_pais, $nombre_comercial, $contacto, $url_imagen, $edita_espanol, $anio_origen);
    $stmt->execute();

    $stmt->close();

    responder(null, true, "Editorial dada de alta correctamente", $conexion);
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() == 1062) {
        responder(null, false, "Ya existe una editorial con ese nombre", null);
    } else {
        responder(null, false, "Error en la base de datos: " . $e->getMessage(), null);
    }
} catch (Exception $e) {
    responder(null, false, "Error: " . $e->getMessage(), null);
}
