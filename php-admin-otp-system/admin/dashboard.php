<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';

$admin = requireAdminLogin();
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard — My Union Canteen Admin</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<nav class="navbar navbar-dark bg-dark px-3">
  <span class="navbar-brand">My Union Canteen — Admin</span>
  <div class="d-flex align-items-center text-white">
    <span class="me-3 small">👤 <?= htmlspecialchars($admin['name']) ?> (<?= htmlspecialchars($admin['role']) ?>)</span>
    <a href="/admin/logout.php" class="btn btn-outline-light btn-sm">Logout</a>
  </div>
</nav>
<div class="container py-4">
  <h4>Welcome, <?= htmlspecialchars($admin['name']) ?> 👋</h4>
  <p class="text-muted">You are logged in as <strong><?= htmlspecialchars($admin['role']) ?></strong>.</p>
  <?php if ($admin['role'] === 'super_admin'): ?>
    <a href="/admin/super_admin/index.php" class="btn btn-dark">⚙️ Go to Admin Management</a>
  <?php endif; ?>
</div>
</body>
</html>
