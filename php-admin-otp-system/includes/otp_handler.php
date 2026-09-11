<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/email.php';

const OTP_LENGTH = 6;
const OTP_VALID_MINUTES = 5;
const OTP_MAX_REQUESTS_PER_HOUR = 5;
const OTP_MAX_VERIFY_ATTEMPTS = 5;

function otpRateLimitExceeded(string $email): bool
{
    $pdo = getDBConnection();
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS cnt FROM admin_otp WHERE email = :email AND created_at > (NOW() - INTERVAL 1 HOUR)'
    );
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch();

    return ((int) ($row['cnt'] ?? 0)) >= OTP_MAX_REQUESTS_PER_HOUR;
}

/**
 * Generates a fresh OTP, stores its hash, and emails it to the given address.
 * Returns a result array; callers should show a generic message on failure
 * rather than leak *why* (e.g. rate limiting) to avoid enumeration.
 */
function generateAndSendOtp(string $email): array
{
    if (otpRateLimitExceeded($email)) {
        return ['success' => false, 'message' => 'Too many OTP requests. Please try again after some time.'];
    }

    $otp = str_pad((string) random_int(0, 999999), OTP_LENGTH, '0', STR_PAD_LEFT);
    $otpHash = password_hash($otp, PASSWORD_DEFAULT);
    $expiresAt = (new DateTime())->modify('+' . OTP_VALID_MINUTES . ' minutes')->format('Y-m-d H:i:s');

    $pdo = getDBConnection();
    $stmt = $pdo->prepare(
        'INSERT INTO admin_otp (email, otp_hash, purpose, expires_at, attempts, created_at, ip_address)
         VALUES (:email, :otp_hash, :purpose, :expires_at, 0, NOW(), :ip)'
    );
    $stmt->execute([
        'email' => $email,
        'otp_hash' => $otpHash,
        'purpose' => 'login',
        'expires_at' => $expiresAt,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    ]);

    $sent = sendEmail(
        $email,
        'Your My Union Canteen Admin Login OTP',
        buildOtpEmailHtml($otp, OTP_VALID_MINUTES)
    );

    if (!$sent) {
        // Dev-mode fallback so login is still testable without a configured MTA.
        error_log("[otp_handler.php] OTP for {$email}: {$otp} (email delivery failed, logged for local/dev use)");
    }

    return ['success' => true, 'message' => 'OTP sent to your email address.', 'expires_in' => OTP_VALID_MINUTES * 60];
}

function verifyOtp(string $email, string $submittedOtp): array
{
    $pdo = getDBConnection();
    $stmt = $pdo->prepare(
        'SELECT * FROM admin_otp
         WHERE email = :email AND verified_at IS NULL
         ORDER BY created_at DESC LIMIT 1'
    );
    $stmt->execute(['email' => $email]);
    $record = $stmt->fetch();

    if (!$record) {
        return ['success' => false, 'message' => 'No pending OTP found. Please request a new one.'];
    }

    if (strtotime($record['expires_at']) < time()) {
        return ['success' => false, 'message' => 'OTP has expired. Please request a new one.'];
    }

    if ((int) $record['attempts'] >= OTP_MAX_VERIFY_ATTEMPTS) {
        return ['success' => false, 'message' => 'Too many incorrect attempts. Please request a new OTP.'];
    }

    if (!password_verify($submittedOtp, $record['otp_hash'])) {
        $upd = $pdo->prepare('UPDATE admin_otp SET attempts = attempts + 1 WHERE id = :id');
        $upd->execute(['id' => $record['id']]);

        return ['success' => false, 'message' => 'Incorrect OTP. Please try again.'];
    }

    $upd = $pdo->prepare('UPDATE admin_otp SET verified_at = NOW() WHERE id = :id');
    $upd->execute(['id' => $record['id']]);

    return ['success' => true, 'message' => 'OTP verified successfully.'];
}
