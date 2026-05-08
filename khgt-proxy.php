<?php
header("Content-Type: application/json; charset=utf-8");

$lat = isset($_GET["lat"]) ? trim((string) $_GET["lat"]) : "";
$lng = isset($_GET["lng"]) ? trim((string) $_GET["lng"]) : "";
$date = isset($_GET["date"]) ? trim((string) $_GET["date"]) : "";

if ($lat === "" || $lng === "" || $date === "") {
    http_response_code(400);
    echo json_encode(["ok" => false, "message" => "Parameter lat/lng/date wajib diisi"]);
    exit;
}

$targetUrl = "https://khgt.muhammadiyah.or.id/prayer?lat=" . urlencode($lat)
    . "&long=" . urlencode($lng)
    . "&date=" . urlencode($date);

$context = stream_context_create([
    "http" => [
        "method" => "GET",
        "timeout" => 20,
        "header" => "User-Agent: Mozilla/5.0\r\nAccept: application/json\r\n"
    ]
]);

$result = @file_get_contents($targetUrl, false, $context);
if ($result === false) {
    http_response_code(502);
    echo json_encode(["ok" => false, "message" => "Gagal menghubungi server KHGT"]);
    exit;
}

$decoded = json_decode($result, true);
if (!is_array($decoded) || !isset($decoded["times"])) {
    http_response_code(502);
    echo json_encode(["ok" => false, "message" => "Response KHGT tidak valid"]);
    exit;
}

echo json_encode(["ok" => true, "data" => $decoded], JSON_UNESCAPED_UNICODE);
