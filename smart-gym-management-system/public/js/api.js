// ============================================================
// Shared frontend utilities used across every dashboard page
// ============================================================

const API_BASE = '/api';

async function apiRequest(endpoint, options = {}) {
  const opts = {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  };

  if (options.body) opts.body = JSON.stringify(options.body);

  const res = await fetch(API_BASE + endpoint, opts);

  if (res.status === 401) {
    window.location.href = '/index.html';
    return null;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function requireLogin() {
  try {
    const res = await fetch(API_BASE + '/auth/session', { credentials: 'include' });
    const data = await res.json();
    if (!data.loggedIn) {
      window.location.href = '/index.html';
      return false;
    }
    const el = document.getElementById('loggedInUser');
    if (el) el.textContent = data.username;
    return true;
  } catch (err) {
    window.location.href = '/index.html';
    return false;
  }
}

async function logoutAdmin() {
  try {
    await fetch(API_BASE + '/auth/logout', { method: 'POST', credentials: 'include' });
  } catch (err) { /* ignore */ }
  window.location.href = '/index.html';
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '2000';
    document.body.appendChild(container);
  }

  const bg = type === 'success' ? 'bg-success' : (type === 'error' ? 'bg-danger' : 'bg-warning');
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white ${bg} border-0 show mb-2`;
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button>
    </div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '-';
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function statusBadgeClass(status) {
  const map = {
    'Active': 'badge-status-active', 'Inactive': 'badge-status-inactive', 'Expired': 'badge-status-expired',
    'Available': 'badge-status-available', 'In Use': 'badge-status-inuse',
    'Maintenance Required': 'badge-status-maintenancerequired', 'Damaged': 'badge-status-damaged',
    'Present': 'badge-status-present', 'Absent': 'badge-status-absent',
    'Paid': 'badge-status-paid', 'Pending': 'badge-status-pending', 'Failed': 'badge-status-failed',
    'Expiring Soon': 'badge-status-expiringsoon'
  };
  return map[status] || 'bg-secondary';
}

// Computes a display-friendly membership status (Active / Expiring Soon / Expired)
// based on membershipEndDate, without needing a cron job.
function membershipDisplayStatus(endDate) {
  const end = new Date(endDate);
  const now = new Date();
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);

  if (end < now) return 'Expired';
  if (end <= sevenDays) return 'Expiring Soon';
  return 'Active';
}

function bmiCategory(bmi) {
  if (bmi === null || bmi === undefined) return { label: '-', color: '#a0aec0' };
  if (bmi < 18.5) return { label: 'Underweight', color: '#3182ce' };
  if (bmi < 25) return { label: 'Normal', color: '#38a169' };
  if (bmi < 30) return { label: 'Overweight', color: '#dd6b20' };
  return { label: 'Obese', color: '#e53e3e' };
}

// Renders the sidebar + header into the element with id="layoutRoot"
function renderLayout(active) {
  const root = document.getElementById('layoutRoot');
  if (!root) return;

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', href: '/dashboard.html', icon: 'bi-speedometer2' },
    { key: 'members', label: 'Members', href: '/members.html', icon: 'bi-people-fill' },
    { key: 'trainers', label: 'Trainers', href: '/trainers.html', icon: 'bi-person-badge-fill' },
    { key: 'plans', label: 'Membership Plans', href: '/plans.html', icon: 'bi-card-checklist' },
    { key: 'attendance', label: 'Attendance', href: '/attendance.html', icon: 'bi-calendar-check-fill' },
    { key: 'payments', label: 'Payments', href: '/payments.html', icon: 'bi-cash-coin' },
    { key: 'workouts', label: 'Workout Plans', href: '/workouts.html', icon: 'bi-clipboard2-pulse-fill' },
    { key: 'progress', label: 'Fitness Progress', href: '/progress.html', icon: 'bi-graph-up-arrow' },
    { key: 'equipment', label: 'Equipment', href: '/equipment.html', icon: 'bi-bicycle' },
    { key: 'reports', label: 'Reports', href: '/reports.html', icon: 'bi-file-earmark-bar-graph-fill' }
  ];

  const navHtml = navItems.map(item => `
    <a href="${item.href}" class="nav-link ${active === item.key ? 'active' : ''}">
      <i class="bi ${item.icon}"></i> ${item.label}
    </a>
  `).join('');

  root.innerHTML = `
    <nav class="app-sidebar" id="appSidebar">
      <div class="brand"><i class="bi bi-heart-pulse-fill" style="color:#ff6b35;"></i> Smart Gym</div>
      <div class="nav flex-column">
        ${navHtml}
        <a href="#" class="nav-link" onclick="logoutAdmin(); return false;">
          <i class="bi bi-box-arrow-right"></i> Logout
        </a>
      </div>
    </nav>
    <div class="app-main">
      <header class="app-header">
        <div class="d-flex align-items-center gap-3">
          <button class="btn btn-sm btn-outline-secondary d-lg-none" onclick="document.getElementById('appSidebar').classList.toggle('show')">
            <i class="bi bi-list"></i>
          </button>
          <span class="text-muted" id="pageHeading"></span>
        </div>
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-person-circle fs-5 text-secondary"></i>
          <span class="fw-semibold" id="loggedInUser">Admin</span>
        </div>
      </header>
      <main class="app-content" id="pageContent"></main>
    </div>
  `;
}
