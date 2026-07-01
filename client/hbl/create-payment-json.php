<?php

use GuzzleHttp\Exception\GuzzleException;

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/src/api/Payment.php';

header('Content-Type: application/json');

$internalKey = getenv('HBL_INTERNAL_API_KEY') ?: '';
if ($internalKey !== '') {
    $requestKey = $_SERVER['HTTP_X_HBL_INTERNAL_KEY'] ?? '';
    if (!hash_equals($internalKey, $requestKey)) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Forbidden',
        ]);
        exit();
    }
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody, true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid JSON payload',
    ]);
    exit();
}

$requiredFields = [
    'input_currency',
    'input_amount',
    'input_3d',
    'success_url',
    'fail_url',
    'cancel_url',
    'backend_url',
];

foreach ($requiredFields as $field) {
    if (!array_key_exists($field, $payload) || !is_string($payload[$field]) || trim($payload[$field]) === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "Missing required field: {$field}",
        ]);
        exit();
    }
}

try {
    $merchantId = getenv('HBL_MERCHANT_ID') ?: '';
    $apiKey = getenv('HBL_API_KEY') ?: '';

    $payment = new Payment();
    $joseResponse = $payment->ExecuteFormJose(
        $merchantId,
        $apiKey,
        $payload['input_currency'],
        $payload['input_amount'],
        $payload['input_3d'],
        $payload['success_url'],
        $payload['fail_url'],
        $payload['cancel_url'],
        $payload['backend_url']
    );

    $response = json_decode($joseResponse, true);
    $paymentPageUrl = $response['response']['Data']['paymentPage']['paymentPageURL'] ?? null;

    if (!is_string($paymentPageUrl) || trim($paymentPageUrl) === '') {
        http_response_code(502);
        echo json_encode([
            'success' => false,
            'message' => 'Missing paymentPageURL',
        ]);
        exit();
    }

    echo json_encode([
        'success' => true,
        'paymentPageURL' => $paymentPageUrl,
    ]);
} catch (GuzzleException $e) {
    http_response_code(502);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
