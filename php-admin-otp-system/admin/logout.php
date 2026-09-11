<?php

declare(strict_types=1);

require_once __DIR__ . '/../includes/auth.php';

$admin = currentAdmin();
if ($admin) {
    logAdminActivity((int) $admin['id'], 'logout', 'auth', 'Admin logged out');
}

destroyAdminSession();
header('Location: /admin/login.php');
exit;
