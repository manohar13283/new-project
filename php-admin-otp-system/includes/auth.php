<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/permissions.php';

const SESSION_TIMEOUT_SECONDS = 30 * 60;

function startAdminSession(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

/**
 * Returns the logged-in admin from the session, or null if not logged in or
 * the session has timed out (30 minutes of inactivity).
 */
function currentAdmin(): ?array
{
    startAdminSession();

    if (empty($_SESSION['admin_id'])) {
        return null;
    }

    if (isset($_SESSION['admin_last_activity']) && (time() - $_SESSION['admin_last_activity']) > SESSION_TIMEOUT_SECONDS) {
        destroyAdminSession();
        return null;
    }

    $_SESSION['admin_last_activity'] = time();

    return [
        'id' => $_SESSION['admin_id'],
        'email' => $_SESSION['admin_email'],
        'name' => $_SESSION['admin_name'],
        'role' => $_SESSION['admin_role'],
        'permissions' => $_SESSION['admin_permissions'] ?? [],
    ];
}

function requireAdminLogin(): array
{
    $admin = currentAdmin();
    if (!$admin) {
        header('Location: /admin/login.php');
        exit;
    }

    return $admin;
}

function requireSuperAdmin(): array
{
    $admin = requireAdminLogin();
    if ($admin['role'] !== 'super_admin') {
        http_response_code(403);
        exit('Forbidden: Super Admin access only.');
    }

    return $admin;
}

function destroyAdminSession(): void
{
    startAdminSession();
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }

    session_destroy();
}

/**
 * Establishes the logged-in session for a verified admin, rotates the
 * session id, and records the login on the admin_users row.
 */
function establishAdminSession(array $admin): void
{
    startAdminSession();
    session_regenerate_id(true);

    $_SESSION['admin_id'] = (int) $admin['id'];
    $_SESSION['admin_email'] = $admin['email'];
    $_SESSION['admin_name'] = $admin['name'];
    $_SESSION['admin_role'] = $admin['role'];
    $_SESSION['admin_permissions'] = getAdminPermissions($admin);
    $_SESSION['admin_last_activity'] = time();

    $pdo = getDBConnection();
    $stmt = $pdo->prepare('UPDATE admin_users SET last_login = NOW(), login_count = login_count + 1 WHERE id = :id');
    $stmt->execute(['id' => $admin['id']]);
}

function findAdminByEmail(string $email): ?array
{
    $pdo = getDBConnection();
    $stmt = $pdo->prepare('SELECT * FROM admin_users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $row = $stmt->fetch();

    return $row ?: null;
}

function logAdminActivity(?int $adminId, string $action, string $module, string $description): void
{
    $pdo = getDBConnection();
    $stmt = $pdo->prepare(
        'INSERT INTO admin_activity_log (admin_id, action, module, description, ip_address, created_at)
         VALUES (:admin_id, :action, :module, :description, :ip, NOW())'
    );
    $stmt->execute([
        'admin_id' => $adminId,
        'action' => $action,
        'module' => $module,
        'description' => $description,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    ]);
}

function generateCsrfToken(): string
{
    startAdminSession();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

function verifyCsrfToken(?string $token): bool
{
    startAdminSession();

    return !empty($token) && !empty($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}
