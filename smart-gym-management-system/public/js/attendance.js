let attendanceModalInstance;
let allMembersForAttendance = [];

(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('attendance');
  document.getElementById('pageHeading').textContent = 'Attendance';

  attendanceModalInstance = new bootstrap.Modal(document.getElementById('attendanceModal'));

  renderPageShell();
  await loadMembersDropdown();
  await loadAttendance();

  document.getElementById('attendanceForm').addEventListener('submit', markAttendance);
})();

function renderPageShell() {
  const content = document.getElementById('pageContent');
  const today = new Date().toISOString().split('T')[0];
  content.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="page-title mb-0">Attendance Management</h4>
      <button class="btn btn-accent" onclick="openMarkAttendance()"><i class="bi bi-plus-lg"></i> Mark Attendance</button>
    </div>
    <div class="content-card">
      <div class="d-flex justify-content-between mb-3 flex-wrap gap-2">
        <div class="d-flex gap-2 flex-wrap">
          <input type="date" class="form-control" id="filterDate" value="${today}">
          <select class="form-select" id="filterMember"><option value="">All Members</option></select>
          <select class="form-select" id="filterStatus"><option value="">All Status</option><option value="Present">Present</option><option value="Absent">Absent</option></select>
          <button class="btn btn-primary-custom" onclick="loadAttendance()"><i class="bi bi-filter"></i> Filter</button>
          <button class="btn btn-outline-secondary" onclick="clearAttendanceFilter()"><i class="bi bi-x-circle"></i> Clear</button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead><tr><th>Member</th><th>Date</th><th>Check-in</th><th>Check-out</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="attendanceTableBody"><tr><td colspan="6" class="text-center text-muted py-4">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;
}

async function loadMembersDropdown() {
  const res = await apiRequest('/members');
  allMembersForAttendance = res.data;
  const options = allMembersForAttendance.map(m => `<option value="${m._id}">${m.fullName}</option>`).join('');
  document.getElementById('aMember').innerHTML = '<option value="">Select Member</option>' + options;
  document.getElementById('filterMember').innerHTML = '<option value="">All Members</option>' + options;
}

function clearAttendanceFilter() {
  document.getElementById('filterDate').value = '';
  document.getElementById('filterMember').value = '';
  document.getElementById('filterStatus').value = '';
  loadAttendance();
}

async function loadAttendance() {
  const tbody = document.getElementById('attendanceTableBody');
  try {
    const date = document.getElementById('filterDate').value;
    const member = document.getElementById('filterMember').value;
    const status = document.getElementById('filterStatus').value;

    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (member) params.append('member', member);
    if (status) params.append('status', status);

    const res = await apiRequest('/attendance?' + params.toString());
    const records = res.data;

    if (!records.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No attendance records found</td></tr>';
      return;
    }

    tbody.innerHTML = records.map(r => `
      <tr>
        <td class="fw-semibold">${r.member ? r.member.fullName : '-'}</td>
        <td>${formatDate(r.date)}</td>
        <td>${formatTime(r.checkInTime)}</td>
        <td>${r.checkOutTime ? formatTime(r.checkOutTime) : '<span class="text-muted">Not checked out</span>'}</td>
        <td><span class="badge ${statusBadgeClass(r.status)}">${r.status}</span></td>
        <td>
          ${!r.checkOutTime && r.status === 'Present' ? `<button class="btn btn-sm btn-outline-success" onclick="doCheckOut('${r._id}')"><i class="bi bi-box-arrow-right"></i> Check-out</button>` : ''}
          <button class="btn btn-sm btn-outline-danger" onclick="deleteAttendance('${r._id}')"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Error: ${err.message}</td></tr>`;
  }
}

function openMarkAttendance() {
  document.getElementById('attendanceForm').reset();
  document.getElementById('aDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('aStatus').value = 'Present';
  attendanceModalInstance.show();
}

async function markAttendance(e) {
  e.preventDefault();
  const payload = {
    member: document.getElementById('aMember').value,
    date: document.getElementById('aDate').value,
    status: document.getElementById('aStatus').value,
    checkInTime: document.getElementById('aStatus').value === 'Present' ? new Date().toISOString() : null
  };
  try {
    await apiRequest('/attendance', { method: 'POST', body: payload });
    showToast('Attendance marked successfully.');
    attendanceModalInstance.hide();
    loadAttendance();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function doCheckOut(id) {
  try {
    await apiRequest(`/attendance/${id}/checkout`, { method: 'PUT' });
    showToast('Check-out recorded successfully.');
    loadAttendance();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteAttendance(id) {
  if (!confirm('Are you sure you want to delete this attendance record?')) return;
  try {
    await apiRequest(`/attendance/${id}`, { method: 'DELETE' });
    showToast('Attendance record deleted.');
    loadAttendance();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
