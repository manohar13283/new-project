<?php

declare(strict_types=1);

require_once __DIR__ . '/../../includes/auth.php';
require_once __DIR__ . '/../../includes/permissions.php';

$currentAdminUser = requireSuperAdmin();
$pdo = getDBConnection();
$csrfToken = generateCsrfToken();

$view = $_GET['view'] ?? 'dashboard';
$allowedViews = ['dashboard', 'admins', 'create', 'activity', 'permissions'];
if (!in_array($view, $allowedViews, true)) {
    $view = 'dashboard';
}

$errors = [];
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'create_admin') {
    if (!verifyCsrfToken($_POST['csrf_token'] ?? null)) {
        $errors[] = 'Invalid session token. Please refresh and try again.';
    } else {
        $name = trim((string) ($_POST['name'] ?? ''));
        $email = filter_var(trim((string) ($_POST['email'] ?? '')), FILTER_VALIDATE_EMAIL);
        $phone = trim((string) ($_POST['phone'] ?? ''));
        $role = (string) ($_POST['role'] ?? 'admin');
        $selectedPermissions = array_values(array_intersect(
            (array) ($_POST['permissions'] ?? []),
            array_keys(PERMISSIONS)
        ));

        if ($name === '' || !$email || !in_array($role, ['admin', 'supervisor', 'viewer'], true)) {
            $errors[] = 'Please fill all required fields with valid values.';
        } elseif (findAdminByEmail($email)) {
            $errors[] = 'An admin with this email already exists.';
        } else {
            $stmt = $pdo->prepare(
                'INSERT INTO admin_users (name, email, phone, role, permissions, status, created_by, created_at)
                 VALUES (:name, :email, :phone, :role, :permissions, "active", :created_by, NOW())'
            );
            $stmt->execute([
                'name' => $name,
                'email' => $email,
                'phone' => $phone !== '' ? $phone : null,
                'role' => $role,
                'permissions' => json_encode($selectedPermissions),
                'created_by' => $currentAdminUser['id'],
            ]);
            logAdminActivity((int) $currentAdminUser['id'], 'create_admin', 'admins', "Created new admin: {$email}");
            $success = "Admin account created for {$email}.";
            $view = 'admins';
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'toggle_status') {
    if (!verifyCsrfToken($_POST['csrf_token'] ?? null)) {
        $errors[] = 'Invalid session token. Please refresh and try again.';
    } else {
        $targetId = (int) ($_POST['admin_id'] ?? 0);
        if ($targetId === (int) $currentAdminUser['id']) {
            $errors[] = 'You cannot deactivate your own account.';
        } else {
            $stmt = $pdo->prepare('SELECT * FROM admin_users WHERE id = :id');
            $stmt->execute(['id' => $targetId]);
            $target = $stmt->fetch();
            if (!$target) {
                $errors[] = 'Admin not found.';
            } else {
                $newStatus = $target['status'] === 'active' ? 'inactive' : 'active';
                $upd = $pdo->prepare('UPDATE admin_users SET status = :status WHERE id = :id');
                $upd->execute(['status' => $newStatus, 'id' => $targetId]);
                logAdminActivity((int) $currentAdminUser['id'], 'update_admin_status', 'admins', "Set {$target['email']} to {$newStatus}");
                $success = "Admin {$target['email']} is now {$newStatus}.";
            }
        }
    }
    $view = 'admins';
}

$stats = [
    'total' => (int) $pdo->query('SELECT COUNT(*) FROM admin_users')->fetchColumn(),
    'super_admins' => (int) $pdo->query("SELECT COUNT(*) FROM admin_users WHERE role = 'super_admin'")->fetchColumn(),
];
$createdByYouStmt = $pdo->prepare('SELECT COUNT(*) FROM admin_users WHERE created_by = :id');
$createdByYouStmt->execute(['id' => $currentAdminUser['id']]);
$stats['created_by_you'] = (int) $createdByYouStmt->fetchColumn();

$recentLogins = $pdo->query(
    'SELECT name, email, role, last_login, login_count FROM admin_users
     WHERE last_login IS NOT NULL ORDER BY last_login DESC LIMIT 10'
)->fetchAll();

$allAdmins = $pdo->query(
    'SELECT id, name, email, phone, role, status, created_at FROM admin_users ORDER BY created_at DESC'
)->fetchAll();

$activityLog = $pdo->query(
    'SELECT l.created_at, a.name AS admin_name, l.action, l.module, l.description, l.ip_address
     FROM admin_activity_log l
     LEFT JOIN admin_users a ON a.id = l.admin_id
     ORDER BY l.created_at DESC LIMIT 100'
)->fetchAll();

function roleLabel(string $role): string
{
    $labels = [
        'super_admin' => 'Super Admin',
        'admin' => 'Admin',
        'supervisor' => 'Supervisor',
        'viewer' => 'Viewer',
    ];

    return $labels[$role] ?? ucfirst($role);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Management — My Union Canteen</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">
<div class="d-flex" style="min-height:100vh;">
  <nav class="bg-dark text-white p-3" style="width:240px; flex-shrink:0;">
    <h6 class="text-uppercase text-secondary small mb-3">⚙️ Admin Management</h6>
    <div class="nav flex-column">
      <a class="nav-link text-white <?= $view === 'dashboard' ? 'fw-bold' : '' ?>" href="?view=dashboard">📊 Dashboard</a>
      <a class="nav-link text-white <?= $view === 'admins' ? 'fw-bold' : '' ?>" href="?view=admins">👥 All Admins</a>
      <a class="nav-link text-white <?= $view === 'create' ? 'fw-bold' : '' ?>" href="?view=create">➕ Create New Admin</a>
      <a class="nav-link text-white <?= $view === 'activity' ? 'fw-bold' : '' ?>" href="?view=activity">📝 Admin Activity</a>
      <a class="nav-link text-white <?= $view === 'permissions' ? 'fw-bold' : '' ?>" href="?view=permissions">🔐 Permissions</a>
      <hr class="border-secondary">
      <a class="nav-link text-white" href="/admin/dashboard.php">← Back to Dashboard</a>
      <a class="nav-link text-white" href="/admin/logout.php">🚪 Logout</a>
    </div>
  </nav>

  <div class="flex-grow-1 p-4">
    <?php foreach ($errors as $error): ?>
      <div class="alert alert-danger py-2"><?= htmlspecialchars($error) ?></div>
    <?php endforeach; ?>
    <?php if ($success): ?>
      <div class="alert alert-success py-2"><?= htmlspecialchars($success) ?></div>
    <?php endif; ?>

    <?php if ($view === 'dashboard'): ?>
      <h4 class="mb-4">📊 Admin Management Dashboard</h4>
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card"><div class="card-body">
            <div class="text-muted small">Total Admins</div>
            <div class="fs-3 fw-bold"><?= $stats['total'] ?></div>
          </div></div>
        </div>
        <div class="col-md-4">
          <div class="card"><div class="card-body">
            <div class="text-muted small">Created by You</div>
            <div class="fs-3 fw-bold"><?= $stats['created_by_you'] ?></div>
          </div></div>
        </div>
        <div class="col-md-4">
          <div class="card"><div class="card-body">
            <div class="text-muted small">Super Admins</div>
            <div class="fs-3 fw-bold"><?= $stats['super_admins'] ?></div>
          </div></div>
        </div>
      </div>

      <h6>Recent Admin Logins</h6>
      <div class="table-responsive">
        <table class="table table-sm table-striped bg-white">
          <thead><tr><th>Admin Name</th><th>Email</th><th>Role</th><th>Last Login</th><th>Login Count</th></tr></thead>
          <tbody>
          <?php foreach ($recentLogins as $row): ?>
            <tr>
              <td><?= htmlspecialchars($row['name']) ?></td>
              <td><?= htmlspecialchars($row['email']) ?></td>
              <td><?= htmlspecialchars(roleLabel($row['role'])) ?></td>
              <td><?= htmlspecialchars((string) $row['last_login']) ?></td>
              <td><?= (int) $row['login_count'] ?></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$recentLogins): ?>
            <tr><td colspan="5" class="text-muted text-center">No logins yet.</td></tr>
          <?php endif; ?>
          </tbody>
        </table>
      </div>

    <?php elseif ($view === 'admins'): ?>
      <h4 class="mb-4">👥 All Admin Accounts</h4>
      <div class="table-responsive">
        <table class="table table-sm table-striped bg-white align-middle">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
          <?php foreach ($allAdmins as $row): ?>
            <tr>
              <td><?= htmlspecialchars($row['name']) ?></td>
              <td><?= htmlspecialchars($row['email']) ?></td>
              <td><?= htmlspecialchars($row['phone'] ?? '—') ?></td>
              <td><?= htmlspecialchars(roleLabel($row['role'])) ?></td>
              <td><?= $row['status'] === 'active' ? '🟢 Active' : '🔴 Inactive' ?></td>
              <td><?= htmlspecialchars((string) $row['created_at']) ?></td>
              <td>
                <?php if ((int) $row['id'] !== (int) $currentAdminUser['id']): ?>
                <form method="post" class="d-inline" onsubmit="return confirm('Are you sure?');">
                  <input type="hidden" name="action" value="toggle_status">
                  <input type="hidden" name="admin_id" value="<?= (int) $row['id'] ?>">
                  <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">
                  <button type="submit" class="btn btn-sm btn-outline-<?= $row['status'] === 'active' ? 'danger' : 'success' ?>">
                    <?= $row['status'] === 'active' ? 'Deactivate' : 'Activate' ?>
                  </button>
                </form>
                <?php else: ?>
                  <span class="text-muted small">(you)</span>
                <?php endif; ?>
              </td>
            </tr>
          <?php endforeach; ?>
          </tbody>
        </table>
      </div>

    <?php elseif ($view === 'create'): ?>
      <h4 class="mb-4">➕ Create New Admin Account</h4>
      <form method="post" class="bg-white p-4 rounded shadow-sm" style="max-width:640px;">
        <input type="hidden" name="action" value="create_admin">
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($csrfToken) ?>">
        <div class="mb-3">
          <label class="form-label">Admin Full Name *</label>
          <input type="text" name="name" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Email Address *</label>
          <input type="email" name="email" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Phone Number</label>
          <input type="text" name="phone" class="form-control">
        </div>
        <div class="mb-3">
          <label class="form-label">Role *</label>
          <select name="role" class="form-select" required>
            <option value="admin">Admin</option>
            <option value="supervisor">Supervisor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Permissions</label>
          <?php foreach (PERMISSIONS as $key => $label): ?>
            <div class="form-check">
              <input class="form-check-input" type="checkbox" name="permissions[]" value="<?= htmlspecialchars($key) ?>" id="perm_<?= htmlspecialchars($key) ?>">
              <label class="form-check-label" for="perm_<?= htmlspecialchars($key) ?>"><?= htmlspecialchars($label) ?></label>
            </div>
          <?php endforeach; ?>
          <div class="form-text">Leave unchecked to use the role's default permission set.</div>
        </div>
        <button type="submit" class="btn btn-dark">✅ Create Admin Account</button>
      </form>

    <?php elseif ($view === 'activity'): ?>
      <h4 class="mb-4">📝 Admin Activity Log</h4>
      <div class="table-responsive">
        <table class="table table-sm table-striped bg-white">
          <thead><tr><th>Timestamp</th><th>Admin</th><th>Action</th><th>Module</th><th>Description</th><th>IP Address</th></tr></thead>
          <tbody>
          <?php foreach ($activityLog as $row): ?>
            <tr>
              <td><?= htmlspecialchars((string) $row['created_at']) ?></td>
              <td><?= htmlspecialchars($row['admin_name'] ?? 'Unknown') ?></td>
              <td><?= htmlspecialchars($row['action']) ?></td>
              <td><?= htmlspecialchars($row['module']) ?></td>
              <td><?= htmlspecialchars((string) $row['description']) ?></td>
              <td><?= htmlspecialchars((string) $row['ip_address']) ?></td>
            </tr>
          <?php endforeach; ?>
          <?php if (!$activityLog): ?>
            <tr><td colspan="6" class="text-muted text-center">No activity recorded yet.</td></tr>
          <?php endif; ?>
          </tbody>
        </table>
      </div>

    <?php elseif ($view === 'permissions'): ?>
      <h4 class="mb-4">🔐 Permission Templates</h4>
      <div class="row g-3">
        <?php foreach (PERMISSIONS as $key => $label): ?>
          <div class="col-md-4">
            <div class="card"><div class="card-body py-2">
              <div class="small"><?= htmlspecialchars($label) ?></div>
              <code class="small text-muted"><?= htmlspecialchars($key) ?></code>
            </div></div>
          </div>
        <?php endforeach; ?>
      </div>
      <p class="text-muted small mt-3">These permission keys are assigned per-admin when creating an account, or fall back to the role's default set (see <code>includes/permissions.php</code>).</p>
    <?php endif; ?>
  </div>
</div>
</body>
</html>
