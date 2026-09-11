<?php

declare(strict_types=1);

/**
 * Sends an HTML email via PHP's mail(). This relies on a local MTA being
 * configured and is a stand-in for local/dev use — mirroring the backend's
 * own OTP stub (backend/src/auth/otp.service.ts, which logs instead of
 * sending real SMS). Swap for a real SMTP provider (PHPMailer + SMTP, SES,
 * SendGrid, etc.) before production use.
 */
function sendEmail(string $toEmail, string $subject, string $htmlBody): bool
{
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . (getenv('MAIL_FROM') ?: 'no-reply@myunioncanteen.local'),
        'X-Mailer: PHP/' . phpversion(),
    ];

    $sent = @mail($toEmail, $subject, $htmlBody, implode("\r\n", $headers));

    if (!$sent) {
        error_log('[email.php] Failed to send email to ' . $toEmail . ' - subject: ' . $subject);
    }

    return $sent;
}

function buildOtpEmailHtml(string $otp, int $validMinutes): string
{
    $safeOtp = htmlspecialchars($otp, ENT_QUOTES, 'UTF-8');
    $groupedOtp = implode(' ', str_split($safeOtp));

    return <<<HTML
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background:#0f172a; color:#fff; padding:16px 24px;">
        <h2 style="margin:0; font-size:18px;">My Union Canteen — Admin Login</h2>
      </div>
      <div style="padding:24px; text-align:center;">
        <p style="color:#334155; margin-top:0;">OTP Verification</p>
        <p style="color:#64748b; font-size:14px;">Your One-Time Password is:</p>
        <div style="font-size:32px; letter-spacing:8px; font-weight:bold; color:#0f172a; margin:16px 0;">{$groupedOtp}</div>
        <p style="color:#94a3b8; font-size:13px;">Valid for {$validMinutes} minutes only.</p>
        <p style="color:#94a3b8; font-size:12px;">If you didn't request this, please ignore this email.</p>
      </div>
    </div>
    HTML;
}
