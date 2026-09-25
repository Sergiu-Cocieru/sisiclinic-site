<?php
// SISI Clinic website: contact form handler (runs on the GoDaddy hosting, PHP 8.3).
// Sends the question by email to the clinic. Stores nothing except a short-lived,
// hashed per-IP counter used to stop spam floods.
declare(strict_types=1);

const TO = 'contact@sisiclinic.co.uk';
const FROM = 'website@sisiclinic.co.uk';
const OK_URL = '/message-sent/';
const BACK_URL = '/contact/';
const MAX_PER_HOUR = 5;

function back(string $reason): never {
    header('Location: ' . BACK_URL . '?error=' . rawurlencode($reason) . '#contact-form', true, 303);
    exit;
}
function clean(string $s, int $max): string {
    $s = trim(str_replace(["\r", "\0"], '', $s));
    return mb_substr($s, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: ' . BACK_URL, true, 303);
    exit;
}

// Honeypot and timing: bots fill hidden fields and submit instantly
if (!empty($_POST['website'])) { header('Location: ' . OK_URL, true, 303); exit; }
$t = (int)($_POST['t'] ?? 0);
if ($t === 0 || time() - $t < 3 || time() - $t > 7200) back('timeout');

// Simple rate limit per IP (hashed), kept for one hour in the system temp folder
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$bucket = sys_get_temp_dir() . '/sisi-contact-' . hash('sha256', $ip . date('YmdH'));
$count = is_file($bucket) ? (int)file_get_contents($bucket) : 0;
if ($count >= MAX_PER_HOUR) back('limit');
@file_put_contents($bucket, (string)($count + 1), LOCK_EX);

$name = clean((string)($_POST['name'] ?? ''), 80);
$email = clean((string)($_POST['email'] ?? ''), 120);
$phone = clean((string)($_POST['phone'] ?? ''), 30);
$message = clean((string)($_POST['message'] ?? ''), 2000);

if ($name === '' || $message === '' || mb_strlen($message) < 5) back('missing');
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) back('email');
$name = str_replace("\n", ' ', $name);
$phone = str_replace("\n", ' ', $phone);

$subject = '=?UTF-8?B?' . base64_encode('Website question from ' . $name) . '?=';
$body = "New question from the SISI Clinic website\n\n"
      . "Name: {$name}\nEmail: {$email}\nPhone: " . ($phone ?: '-') . "\n\n"
      . "Message:\n{$message}\n\n"
      . "--\nReply to this email to answer. Sent " . gmdate('j M Y H:i') . " UTC.\n";
$headers = [
    'From' => 'SISI Clinic website <' . FROM . '>',
    'Reply-To' => $email,
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
    'X-Mailer' => 'sisiclinic.co.uk',
];

if (!mail(TO, $subject, $body, $headers, '-f' . FROM)) back('send');

header('Location: ' . OK_URL, true, 303);
exit;
