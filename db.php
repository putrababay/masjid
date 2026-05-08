<?php
header("Content-Type: application/json; charset=utf-8");

$dbFile = __DIR__ . "/data/masjid-db.txt";

$defaultData = [
    "settings" => [
        "locationId" => "cfa0860e83a4c3a763a7e62d825349f7",
        "masjidName" => "MASJID AN-NUR SIDOARJO",
        "masjidAddress" => "Jl. Mojopahit No.666, Celep, Kabupaten Sidoarjo Jawa Timur",
        "qrisTitle" => "Infaq & Sedekah",
        "qrisImageUrl" => "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=DonasiMasjidAnNurSidoarjo",
        "qrisCaption" => "Scan QRIS a.n Masjid An-Nur",
        "mosqueId" => "MNR-SDA01",
        "capacity" => "800 Jamaah",
        "chairman" => "H. Ahmad Fulan",
        "secretary" => "Budi Santoso, ST",
        "treasurer" => "H. M. Mansur",
        "balanceStart" => "Rp 15.000.000",
        "income" => "Rp 5.500.000",
        "expense" => "Rp 2.150.000",
        "balanceEnd" => "Rp 18.350.000",
        "balanceUpdatedAt" => "10 Maret 2026",
        "runningTexts" => [
            "<b>Laporan Keuangan:</b> Saldo Kas Rp 18.350.000 (Per 20 Feb)",
            "<b>Agenda:</b> Kajian Ahad Pagi bersama Ust. Dr. Malik Aris di Ruang Utama",
            "Mohon menonaktifkan suara handphone saat memasuki area Shalat",
            "Jagalah kebersihan Masjid adalah sebagian dari Iman"
        ],
        "regularVideoId" => "F8121v_ER9M",
        "liveVideoId" => "_XgE09RZsB8",
        "slides" => [
            ["type" => "youtube", "value" => "F8121v_ER9M", "isLive" => false],
            ["type" => "youtube", "value" => "_XgE09RZsB8", "isLive" => true],
            ["type" => "image", "value" => "1.jpg"],
            ["type" => "image", "value" => "11.jpg"],
            ["type" => "image", "value" => "2.jpg"],
            ["type" => "image", "value" => "3.jpg"],
            ["type" => "image", "value" => "4.jpg"],
        ],
        "iqomahDurations" => [
            "subuh" => 25,
            "dzuhur" => 25,
            "ashar" => 5,
            "maghrib" => 20,
            "isya" => 25
        ],
        "prayerProvider" => "pemerintah",
        "khgt" => [
            "lat" => -7.4467,
            "lng" => 112.7181
        ]
    ]
];

function readDb(string $dbFile, array $defaultData): array
{
    if (!file_exists($dbFile)) {
        file_put_contents($dbFile, json_encode($defaultData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        return $defaultData;
    }

    $raw = file_get_contents($dbFile);
    $decoded = json_decode($raw, true);

    if (!is_array($decoded)) {
        return $defaultData;
    }

    return array_replace_recursive($defaultData, $decoded);
}

function writeDb(string $dbFile, array $data): bool
{
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }

    return file_put_contents($dbFile, $json, LOCK_EX) !== false;
}

$method = $_SERVER["REQUEST_METHOD"] ?? "GET";

if ($method === "GET") {
    echo json_encode(readDb($dbFile, $defaultData), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === "POST") {
    $payload = json_decode(file_get_contents("php://input"), true);

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(["ok" => false, "message" => "Payload tidak valid"]);
        exit;
    }

    $data = array_replace_recursive($defaultData, $payload);
    $ok = writeDb($dbFile, $data);

    if (!$ok) {
        http_response_code(500);
        echo json_encode(["ok" => false, "message" => "Gagal menyimpan database txt"]);
        exit;
    }

    echo json_encode(["ok" => true, "message" => "Data berhasil disimpan"]);
    exit;
}

http_response_code(405);
echo json_encode(["ok" => false, "message" => "Method tidak didukung"]);
