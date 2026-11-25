<?php
header("Content-Type: application/json; charset=utf-8");

require_once "config.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["ok" => false, "mensaje" => "Método no permitido"]);
    exit;
}

$password = $_POST["password"] ?? "";

if ($password === "") {
    echo json_encode(["ok" => false, "mensaje" => "Introduce la contraseña"]);
    exit;
}

try {
    $mysqli = obtenerConexion();

    $stmt = $mysqli->prepare(
        "SELECT id_usuario, username, nombre_completo, rol, url_imagen, password
         FROM usuarios
         WHERE username = 'admin'
         LIMIT 1"
    );
    $stmt->execute();

    $resultado = $stmt->get_result();
    $admin = $resultado ? $resultado->fetch_assoc() : null;

    if (!is_array($admin)) {
        echo json_encode(["ok" => false, "mensaje" => "Contraseña incorrecta"]);
        exit;
    }

    $passGuardada = (string) ($admin["password"] ?? "");
    if ($passGuardada === "" || $passGuardada !== $password) {
        echo json_encode(["ok" => false, "mensaje" => "Contraseña incorrecta"]);
        exit;
    }

    unset($admin["password"]);
    $admin["rol"] = "admin";

    echo json_encode([
        "ok" => true,
        "mensaje" => "Modo admin activado",
        "datos" => $admin
    ]);
} catch (Throwable $e) {
    echo json_encode([
        "ok" => false,
        "mensaje" => "Error en el servidor: " . $e->getMessage()
    ]);
}
?>