<?php
$host = 'localhost';
$dbname = 'notas';
$username = 'root';
$password = 'root';

// Creamos una nueva conexión con la bbdd
$conexion = new mysqli($host, $username, $password, $dbname);

// Si la conexión da error
if ($conexion->connect_error) {
    echo json_encode([
        "exito" => false,
        "mensaje" => "Error al conectarse con la base de datos"
    ]);
}

// Recibimos los objetos mediante POST
$id_pais = $_POST['selectPaisAlta'];
$nombre = $_POST['txtNombreAlta'];
$contacto = $_POST['txtContactoAlta'];
$chkPais = isset($_POST['checkPaisAlta']) ? 1 : 0;
$fecha_origen = $_POST['dateOrigenAlta'];

// Como imagen se pasa como archivo (_FILES), le agregamos una ruta predefinida
$rutaImagen = "";
if (isset($_FILES['imgEditorialAlta'])) {
    $destino = "img/editoriales/"; // MODIFICAR
    $nombre_imagen = basename($_FILES['imgEditorialAlta']['name']);
    $ruta = $destino . $nombre_imagen;

    // Movemos los archivos a la ruta especificada
    move_uploaded_file($_FILES['imgEditorialAlta']['tmp_name'], $ruta);
}

// Preparamos consulta sql
$sql = "INSERT INTO editorial_carlos(idPais, nombre, contacto, urlimagen, edita_espanol, anno_origen) 
        VALUES(?, ?, ?, ?, ?, ?)";

$sentencia = $conexion->prepare($sql);

// Enlazamos los parámetros con los valores traídos del POST
$sentencia->bind_param("isssii", $id_pais, $nombre, $contacto, $ruta, $chkPais, $fecha_origen);

// Si se logra ejecutar devolvemos el valor de éxito y su respectivo mensaje, ambos cambian si no se logra ejecutar
if ($sentencia->execute()) {
    echo json_encode([
        "exito" => true,
        "mensaje" => "Editorial guardada correctamente"
    ]);
} else {
    echo json_encode([
        "exito" => false,
        "mensaje" => "Error al guardar la editorial"
    ]);
}

$sentencia->close();
$conexion->close();