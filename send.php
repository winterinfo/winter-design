<?php

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

require __DIR__ . '/PHPMailer/Exception.php';
require __DIR__ . '/PHPMailer/PHPMailer.php';
require __DIR__ . '/PHPMailer/SMTP.php';

header('Content-Type: application/json; charset=utf-8');

function respond(bool $ok, string $message, int $status): void
{
    http_response_code($status);

    echo json_encode(
        $ok
            ? ['ok' => true]
            : ['ok' => false, 'error' => $message],
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

function logTelegramError(int $httpCode, string $responseBody): void
{
    $line = sprintf(
        "[%s] HTTP: %s; Response: %s\n",
        date('Y-m-d H:i:s'),
        (string) $httpCode,
        $responseBody !== '' ? $responseBody : '(empty)'
    );

    @file_put_contents(
        __DIR__ . '/telegram-error.log',
        $line,
        FILE_APPEND | LOCK_EX
    );
}

function sendTelegramNotification(
    string $botToken,
    string $chatId,
    string $text
): bool {
    if ($botToken === '' || $chatId === '') {
        logTelegramError(0, 'Telegram: не указан токен бота или chat_id.');
        return false;
    }

    $url = "https://api.telegram.org/bot{$botToken}/sendMessage";

    $postData = http_build_query([
        'chat_id' => $chatId,
        'text' => $text,
        'parse_mode' => 'HTML',
        'disable_web_page_preview' => 'true',
    ]);

    $response = false;
    $httpCode = 0;

    // Основной способ — cURL.
    if (function_exists('curl_init')) {
        $curl = curl_init($url);

        curl_setopt($curl, CURLOPT_RESOLVE, [
            'api.telegram.org:443:149.154.167.220'
        ]);

        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/x-www-form-urlencoded',
            ],
        ]);

        $response = curl_exec($curl);
        $httpCode = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $curlError = curl_error($curl);

        curl_close($curl);

        if ($response === false) {
            logTelegramError(
                $httpCode,
                'cURL error: ' . ($curlError !== '' ? $curlError : 'unknown')
            );
            return false;
        }
    } else {
        // Запасной способ, если cURL недоступен.
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' =>
                    "Content-Type: application/x-www-form-urlencoded\r\n" .
                    "Content-Length: " . strlen($postData) . "\r\n",
                'content' => $postData,
                'timeout' => 15,
                'ignore_errors' => true,
            ],
        ]);

        $response = @file_get_contents($url, false, $context);

        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $headerLine) {
                if (preg_match('/^HTTP\/\S+\s+(\d+)/', $headerLine, $matches)) {
                    $httpCode = (int) $matches[1];
                    break;
                }
            }
        }

        if ($response === false) {
            logTelegramError($httpCode, 'file_get_contents failed');
            return false;
        }
    }

    $payload = json_decode((string) $response, true);

    if (!is_array($payload) || empty($payload['ok'])) {
        logTelegramError($httpCode, (string) $response);
        return false;
    }

    return true;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Метод не поддерживается.', 405);
}

$name = trim($_POST['name'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$email = trim($_POST['email'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $phone === '' || $message === '') {
    respond(false, 'Заполните все поля формы.', 422);
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Укажите корректный email.', 422);
}

$telegramBotToken = '8846985435:AAEbAfoan-c4_k595uh6o0O7HhT1VeXUNks';
$telegramChatId = '868837415';

$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = 'smtp.timeweb.ru';
    $mail->SMTPAuth = true;

    $mail->Username = 'winterinfo@winter2014.tw1.ru';

    // Вставь между кавычками пароль от ящика Timeweb.
    $mail->Password = '100265WinterSlava';

    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    $mail->CharSet = 'UTF-8';

    $mail->setFrom(
        'winterinfo@winter2014.tw1.ru',
        'WINTER.DESIGN'
    );

    $mail->addAddress('winterinfo@yandex.ru');

    // При нажатии «Ответить» письмо уйдёт посетителю сайта.
    if ($email !== '') {
        $mail->addReplyTo($email, $name);
    }

    $mail->isHTML(false);
    $mail->Subject = 'Новая заявка с сайта WINTER.DESIGN';

    $mail->Body =
        "Новая заявка с сайта WINTER.DESIGN\n\n" .
        "Имя: {$name}\n" .
        "Телефон: {$phone}\n" .
        "Email: " . ($email !== "" ? $email : "не указан") . "\n\n" .
        "Сообщение:\n{$message}\n";

    $mail->send();

    $safeName = htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safePhone = htmlspecialchars($phone, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeMessage = htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    $telegramText =
        "<b>Новая заявка с сайта WINTER.DESIGN</b>\n\n" .
        "Имя: {$safeName}\n" .
        "Телефон: {$safePhone}\n";

    if ($email !== '') {
        $safeEmail = htmlspecialchars($email, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $telegramText .= "Email: {$safeEmail}\n";
    }

    $telegramText .= "\nСообщение:\n{$safeMessage}";

    // Ошибка Telegram не отменяет успешно отправленную заявку по почте.
    sendTelegramNotification(
        $telegramBotToken,
        $telegramChatId,
        $telegramText
    );

    respond(true, '', 200);

} catch (Exception $e) {
    error_log('PHPMailer error: ' . $mail->ErrorInfo);

    respond(
        false,
        'Не удалось отправить заявку. Ошибка SMTP: ' . $mail->ErrorInfo,
        500
    );
}
