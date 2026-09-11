<?php

declare(strict_types=1);

const PERMISSIONS = [
    'view_users'           => 'View Users',
    'approve_reject_users' => 'Approve/Reject Users',
    'edit_users'           => 'Edit Users',
    'delete_users'         => 'Delete Users',
    'manage_user_data'     => 'Manage User Data',
    'view_documents'       => 'View Documents',
    'download_documents'   => 'Download Documents',
    'verify_documents'     => 'Verify Documents',
    'delete_documents'     => 'Delete Documents',
    'view_reports'         => 'View Reports',
    'export_data'          => 'Export Data',
    'view_audit_logs'      => 'View Audit Logs',
    'manage_admins'        => 'Manage Admins',
    'view_admin_activity'  => 'View Admin Activity',
    'system_settings'      => 'System Settings',
];

const ROLE_DEFAULT_PERMISSIONS = [
    'admin' => [
        'view_users', 'approve_reject_users', 'view_documents', 'download_documents',
        'verify_documents', 'view_reports', 'export_data', 'view_audit_logs',
    ],
    'supervisor' => [
        'view_users', 'approve_reject_users', 'view_documents', 'download_documents', 'view_reports',
    ],
    'viewer' => [
        'view_users', 'view_documents', 'view_reports', 'export_data',
    ],
];

/**
 * Resolves the effective permission list for an admin row: super_admin always
 * gets everything, an explicit `permissions` JSON column wins if set, otherwise
 * the role's default set applies.
 */
function getAdminPermissions(array $admin): array
{
    if (($admin['role'] ?? '') === 'super_admin') {
        return array_keys(PERMISSIONS);
    }

    $stored = $admin['permissions'] ?? null;
    if (is_string($stored)) {
        $decoded = json_decode($stored, true);
        if (is_array($decoded) && !empty($decoded)) {
            return $decoded;
        }
    } elseif (is_array($stored) && !empty($stored)) {
        return $stored;
    }

    return ROLE_DEFAULT_PERMISSIONS[$admin['role'] ?? 'viewer'] ?? [];
}

function hasPermission(array $admin, string $permission): bool
{
    if (($admin['role'] ?? '') === 'super_admin') {
        return true;
    }

    return in_array($permission, getAdminPermissions($admin), true);
}

function requirePermission(string $permission): void
{
    $admin = currentAdmin();
    if (!$admin || !hasPermission($admin, $permission)) {
        http_response_code(403);
        exit('Forbidden: missing permission "' . htmlspecialchars($permission) . '"');
    }
}
