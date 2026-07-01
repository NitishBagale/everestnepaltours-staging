<?php

use GuzzleHttp\Exception\GuzzleException;

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/src/api/Payment.php';
require_once __DIR__ . '/src/api/Inquiry.php';
require_once __DIR__ . '/src/api/VoidRequest.php';
require_once __DIR__ . '/src/api/Settlement.php';
require_once __DIR__ . '/src/api/Refund.php';
try {
    $merchantId = $_POST['merchant_id'] ?? getenv('HBL_MERCHANT_ID') ?: '';
    $apiKey = $_POST['api_key'] ?? getenv('HBL_API_KEY') ?: '';

    //ExecuteFormJose($mid,$api_key,$curr,$amt,$threeD,$success_url,$failed_url,$cancel_url,$backend_url): string
    $payment = new Payment();  
    //echo "Payment jose request \n ";
    $joseResponse = $payment->ExecuteFormJose($merchantId,$apiKey,$_POST['input_currency'],$_POST['input_amount'],$_POST['input_3d'],$_POST['success_url'],$_POST['fail_url'],$_POST['cancel_url'],$_POST['backend_url'],);
    //echo "Response data : <pre>\n";
    //var_dump(json_decode($joseResponse));
    $response_obj = json_decode($joseResponse);
    //echo $response_obj->response->Data->paymentPage->paymentPageURL;
    header("Location: ".$response_obj->response->Data->paymentPage->paymentPageURL);
    exit();
   // echo "\n";

} catch (GuzzleException $e) {
    echo '\n Message: ' . $e->getMessage();
    echo '\n Trace: ' . $e->getTraceAsString();
} catch (Exception $e) {
    echo '\n Message: ' . $e->getMessage();
    echo '\n Trace: ' . $e->getTraceAsString();
}
