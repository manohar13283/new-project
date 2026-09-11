<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/otp_handler.php';

startAdminSession();

if (currentAdmin()) {
    header('Location: /admin/dashboard.php');
    exit;
}

$errors = [];
$info = null;
$step = ($_GET['step'] ?? 'email') === 'otp' ? 'otp' : 'email';
$email = trim((string) ($_SESSION['otp_login_email'] ?? ''));

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'request_otp') {
    if (!verifyCsrfToken($_POST['csrf_token'] ?? null)) {
        $errors[] = 'Invalid session token. Please refresh and try again.';
    } else {
        $submittedEmail = filter_var(trim((string) ($_POST['email'] ?? '')), FILTER_VALIDATE_EMAIL);
        if (!$submittedEmail) {
            $errors[] = 'Please enter a valid email address.';
        } else {
            $admin = findAdminByEmail($submittedEmail);
            if (!$admin || $admin['status'] !== 'active') {
                // Same message whether the account exists or not, to avoid leaking account existence.
                $errors[] = 'If this email belongs to an active admin account, an OTP has been sent.';
            } else {
                $result = generateAndSendOtp($submittedEmail);
                if (!$result['success']) {
                    $errors[] = $result['message'];
                } else {
                    $_SESSION['otp_login_email'] = $submittedEmail;
                    logAdminActivity($admin['id'], 'otp_requested', 'auth', 'Admin requested login OTP');
                    header('Location: /admin/login.php?step=otp');
                    exit;
                }
            }
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'resend_otp') {
    if (!verifyCsrfToken($_POST['csrf_token'] ?? null) || !$email) {
        $errors[] = 'Session expired. Please start again.';
        $step = 'email';
    } else {
        $result = generateAndSendOtp($email);
        if (!$result['success']) {
            $errors[] = $result['message'];
        } else {
            $info = 'A new OTP has been sent to your email.';
        }
        $step = 'otp';
    }
}

if ($step === 'otp' && !$email) {
    header('Location: /admin/login.php');
    exit;
}

$csrfToken = generateCsrfToken();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login — My Union Canteen</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<div class="container">
  <div class="row justify-content-center align-items-center" style="min-height:100vh;">
    <div class="col-12 col-sm-8 col-md-5 col-lg-4">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h4 class="card-title mb-1">🔐 Admin Login</h4>
          <p class="text-muted small mb-4">My Union Canteen — Admin Portal</p>

          <?php foreach ($errors as $error): ?>
            <div class="alert alert-danger py-2"><?= htmlspecialchars($error) ?></div>
          <?php endforeach; ?>
          <?php if ($info): ?>
            <div class="alert alert-success py-2"><?= htmlspecialchars($info) ?></div>
          <?php endif; ?>

          <?php if ($step !== 'otp'): ?>
            <form method="post" action="/admin/login.php">
              <input type="hidden" name="action" value="request_otp">
              <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">
              <div class="mb-3">
                <label class="form-label">Email address</label>
                <input type="email" name="email" class="form-control" required autofocus placeholder="you@company.com">
              </div>
              <button type="submit" class="btn btn-dark w-100">Send OTP →</button>
            </form>
          <?php else: ?>
            <p class="small text-muted">Enter the code sent to <strong><?= htmlspecialchars($email) ?></strong></p>
            <div id="otpAlert"></div>
            <form id="otpForm">
              <input type="hidden" id="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">
              <div class="mb-3">
                <label class="form-label">6-digit OTP</label>
                <input type="text" id="otpInput" class="form-control text-center" style="letter-spacing:8px; font-size:24px;" maxlength="6" inputmode="numeric" pattern="\d{6}" placeholder="000000" required autofocus>
              </div>
              <div class="mb-3 text-center small text-muted">
                ⏱️ OTP expires in <span id="otpTimer">300</span>s
              </div>
              <button type="submit" class="btn btn-dark w-100 mb-2">Verify & Login →</button>
            </form>
            <form method="post" action="/admin/login.php?step=otp" class="text-center">
              <input type="hidden" name="action" value="resend_otp">
              <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">
              <button type="submit" class="btn btn-link btn-sm">📤 Resend OTP</button>
            </form>
            <div class="text-center">
              <a href="/admin/login.php" class="small">Change email</a>
            </div>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </div>
</div>

<?php if ($step === 'otp'): ?>
<script>
(function () {
  var remaining = 300;
  var timerEl = document.getElementById('otpTimer');
  var alertBox = document.getElementById('otpAlert');

  var timerId = setInterval(function () {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(timerId);
      timerEl.textContent = '0';
      showAlert('warning', 'OTP expired. Please resend.');
      return;
    }
    timerEl.textContent = String(remaining);
  }, 1000);

  function showAlert(type, message) {
    alertBox.innerHTML = '';
    var div = document.createElement('div');
    div.className = 'alert alert-' + type + ' py-2';
    div.textContent = message;
    alertBox.appendChild(div);
  }

  document.getElementById('otpForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var otp = document.getElementById('otpInput').value.trim();
    var csrfToken = document.getElementById('csrf_token').value;
    alertBox.innerHTML = '';

    fetch('/admin/api/verify_otp_ajax.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp: otp, csrf_token: csrfToken })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          window.location.href = data.redirect || '/admin/dashboard.php';
        } else {
          showAlert('danger', data.message || 'Verification failed.');
        }
      })
      .catch(function () {
        showAlert('danger', 'Something went wrong. Please try again.');
      });
  });
})();
</script>
<?php endif; ?>
</body>
</html>
