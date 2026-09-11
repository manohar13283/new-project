<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/otp_handler.php';

header('Content-Type: application/json');
startAdminSession();

$payload = json_decode((string) file_get_contents('php://input'), true) ?: [];

if (!verifyCsrfToken($payload['csrf_token'] ?? null)) {
    http_response_code(419);
    echo json_encode(['success' => false, 'message' => 'Session expired. Please refresh and try again.']);
    exit;
}

$email = $_SESSION['otp_login_email'] ?? null;
$otp = preg_replace('/\D/', '', (string) ($payload['otp'] ?? ''));

if (!$email || strlen($otp) !== OTP_LENGTH) {
    echo json_encode(['success' => false, 'message' => 'Invalid request. Please start over.']);
    exit;
}

$result = verifyOtp($email, $otp);
if (!$result['success']) {
    echo json_encode(['success' => false, 'message' => $result['message']]);
    exit;
}

$admin = findAdminByEmail($email);
if (!$admin || $admin['status'] !== 'active') {
    echo json_encode(['success' => false, 'message' => 'Account not found or inactive.']);
    exit;
}

establishAdminSession($admin);
unset($_SESSION['otp_login_email']);
logAdminActivity((int) $admin['id'], 'login', 'auth', 'Admin login via OTP');

$redirect = $admin['role'] === 'super_admin' ? '/admin/super_admin/index.php' : '/admin/dashboard.php';

echo json_encode(['success' => true, 'message' => 'Login successful.', 'redirect' => $redirect]);
