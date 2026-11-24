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

    if (empty($editorial->id_editorial) || empty($editorial->id_pais) || empty($editorial->nombre_comercial) || empty($editorial->contacto)) {
        throw new Exception("Faltan campos obligatorios");
    }

    $conexion = obtenerConexion();

    $sql = "UPDATE editorial_carlos SET id_pais = ?, nombre_comercial = ?, contacto = ?, url_imagen = ?, edita_espanol = ?, anio_origen = ? WHERE id_editorial = ?;";
    $stmt = $conexion->prepare($sql);

    $idPais = intval($editorial->id_pais);
    $nombre = trim($editorial->nombre_comercial);
    $contacto = trim($editorial->contacto);

    $urlimagen = "";
    if (isset($editorial->url_imagen)) {
        $urlimagen = trim($editorial->url_imagen);
    }

    if (($_FILES["imagen"]["error"] ?? null) === UPLOAD_ERR_OK) {
        $nombreArchivo = basename($_FILES["imagen"]["name"]);
        if (move_uploaded_file($_FILES["imagen"]["tmp_name"], "../img/editoriales/$nombreArchivo")) {
            $urlimagen = "img/editoriales/$nombreArchivo";
        }
    }

    $edita_espanol = 0;
    if (!empty($editorial->edita_espanol)) {
        $edita_espanol = 1;
    }

    $anno_origen = intval($editorial->anio_origen);
    $idEditorial = intval($editorial->id_editorial);

    $stmt->bind_param("isssiii", $idPais, $nombre, $contacto, $urlimagen, $edita_espanol, $anno_origen, $idEditorial);
    $stmt->execute();

    $stmt->close();

    responder(null, true, "Editorial modificada correctamente", $conexion);
} catch (mysqli_sql_exception $e) {
    responder(null, false, "Error en la base de datos: " . $e->getMessage(), null);
} catch (Exception $e) {
    responder(null, false, "Error: " . $e->getMessage(), null);
}
