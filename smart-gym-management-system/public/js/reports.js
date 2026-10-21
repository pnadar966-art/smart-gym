let currentReportType = 'members';
let lastReportData = [];
let lastReportColumns = [];
let allMembersForReports = [];

(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('reports');
  document.getElementById('pageHeading').textContent = 'Reports';

  renderPageShell();

  const res = await apiRequest('/members');
  allMembersForReports = res.data;

  await runReport('members');
})();

function renderPageShell() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <h4 class="page-title mb-3 no-print">Report Generation</h4>
    <ul class="nav nav-tabs report-tabs mb-3 no-print flex-wrap" id="reportTabs">
      <li class="nav-item"><button class="nav-link active" data-type="members" onclick="switchReportTab('members')">Members</button></li>
      <li class="nav-item"><button class="nav-link" data-type="trainers" onclick="switchReportTab('trainers')">Trainers</button></li>
      <li class="nav-item"><button class="nav-link" data-type="membership" onclick="switchReportTab('membership')">Membership</button></li>
      <li class="nav-item"><button class="nav-link" data-type="attendance" onclick="switchReportTab('attendance')">Attendance</button></li>
      <li class="nav-item"><button class="nav-link" data-type="payments" onclick="switchReportTab('payments')">Payments</button></li>
      <li class="nav-item"><button class="nav-link" data-type="revenue" onclick="switchReportTab('revenue')">Revenue</button></li>
      <li class="nav-item"><button class="nav-link" data-type="equipment" onclick="switchReportTab('equipment')">Equipment</button></li>
      <li class="nav-item"><button class="nav-link" data-type="maintenance" onclick="switchReportTab('maintenance')">Maintenance</button></li>
      <li class="nav-item"><button class="nav-link" data-type="fitness-progress" onclick="switchReportTab('fitness-progress')">Fitness Progress</button></li>
    </ul>
    <div class="content-card">
      <div class="d-flex justify-content-between flex-wrap gap-2 mb-3 no-print">
        <div class="d-flex gap-2 flex-wrap" id="filterArea"></div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-secondary" onclick="exportCSV()"><i class="bi bi-download"></i> Export CSV</button>
          <button class="btn btn-accent" onclick="window.print()"><i class="bi bi-printer"></i> Print Report</button>
        </div>
      </div>
      <div id="reportSummary" class="mb-3 fw-semibold"></div>
      <div class="table-responsive" id="reportTableWrapper"><div class="spinner-wrap"><div class="spinner-border text-primary"></div></div></div>
    </div>
  `;
  renderFilterArea('members');
}

function renderFilterArea(type) {
  const filterArea = document.getElementById('filterArea');
  const memberOptions = '<option value="">All Members</option>' + allMembersForReports.map(m => `<option value="${m._id}">${m.fullName}</option>`).join('');

  if (type === 'members') {
    filterArea.innerHTML = `
      <input type="date" class="form-control" id="filterFrom" title="Joining date from">
      <input type="date" class="form-control" id="filterTo" title="Joining date to">
      <select class="form-select" id="filterStatus"><option value="">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Expired">Expired</option></select>
      <button class="btn btn-primary-custom" onclick="runReport('members')"><i class="bi bi-filter"></i> Apply</button>`;
  } else if (type === 'trainers') {
    filterArea.innerHTML = `
      <select class="form-select" id="filterStatus"><option value="">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
      <button class="btn btn-primary-custom" onclick="runReport('trainers')"><i class="bi bi-filter"></i> Apply</button>`;
  } else if (type === 'attendance') {
    filterArea.innerHTML = `
      <input type="date" class="form-control" id="filterFrom"><input type="date" class="form-control" id="filterTo">
      <select class="form-select" id="filterMember">${memberOptions}</select>
      <button class="btn btn-primary-custom" onclick="runReport('attendance')"><i class="bi bi-filter"></i> Apply</button>`;
  } else if (type === 'payments') {
    filterArea.innerHTML = `
      <input type="date" class="form-control" id="filterFrom"><input type="date" class="form-control" id="filterTo">
      <select class="form-select" id="filterMethod"><option value="">All Methods</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option></select>
      <select class="form-select" id="filterMember">${memberOptions}</select>
      <button class="btn btn-primary-custom" onclick="runReport('payments')"><i class="bi bi-filter"></i> Apply</button>`;
  } else if (type === 'revenue') {
    filterArea.innerHTML = `
      <input type="date" class="form-control" id="filterFrom"><input type="date" class="form-control" id="filterTo">
      <button class="btn btn-primary-custom" onclick="runReport('revenue')"><i class="bi bi-filter"></i> Apply</button>`;
  } else if (type === 'equipment') {
    filterArea.innerHTML = `
      <select class="form-select" id="filterStatus"><option value="">All Status</option><option value="Available">Available</option><option value="In Use">In Use</option><option value="Maintenance Required">Maintenance Required</option><option value="Damaged">Damaged</option></select>
      <button class="btn btn-primary-custom" onclick="runReport('equipment')"><i class="bi bi-filter"></i> Apply</button>`;
  } else if (type === 'maintenance' || type === 'membership') {
    filterArea.innerHTML = `<span class="text-muted small align-self-center">${type === 'maintenance' ? 'Shows equipment needing or scheduled for maintenance.' : 'Shows how many members are on each plan.'}</span>`;
  } else if (type === 'fitness-progress') {
    filterArea.innerHTML = `
      <select class="form-select" id="filterMember">${memberOptions}</select>
      <input type="date" class="form-control" id="filterFrom"><input type="date" class="form-control" id="filterTo">
      <button class="btn btn-primary-custom" onclick="runReport('fitness-progress')"><i class="bi bi-filter"></i> Apply</button>`;
  }
}

function switchReportTab(type) {
  currentReportType = type;
  document.querySelectorAll('#reportTabs .nav-link').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
  renderFilterArea(type);
  runReport(type);
}

async function runReport(type) {
  currentReportType = type;
  const wrapper = document.getElementById('reportTableWrapper');
  const summary = document.getElementById('reportSummary');
  wrapper.innerHTML = `<div class="spinner-wrap"><div class="spinner-border text-primary"></div></div>`;
  summary.innerHTML = '';

  const params = new URLSearchParams();
  const from = document.getElementById('filterFrom');
  const to = document.getElementById('filterTo');
  const status = document.getElementById('filterStatus');
  const method = document.getElementById('filterMethod');
  const member = document.getElementById('filterMember');

  if (from && from.value) params.append('from', from.value);
  if (to && to.value) params.append('to', to.value);
  if (status && status.value) params.append('status', status.value);
  if (method && method.value) params.append('method', method.value);
  if (member && member.value) params.append('member', member.value);

  try {
    const res = await apiRequest(`/reports/${type}?` + params.toString());
    const data = res.data;

    if (type === 'members') {
      lastReportColumns = ['Name', 'Phone', 'Email', 'Plan', 'Joining Date', 'Membership End', 'Status'];
      lastReportData = data.map(m => [m.fullName, m.phone, m.email, m.membershipPlan ? m.membershipPlan.planName : '-', formatDate(m.joiningDate), formatDate(m.membershipEndDate), m.status]);
      summary.innerHTML = `Total Members: <span class="text-primary">${res.count}</span>`;
    } else if (type === 'trainers') {
      lastReportColumns = ['Name', 'Email', 'Phone', 'Specialization', 'Experience', 'Salary', 'Status'];
      lastReportData = data.map(t => [t.name, t.email, t.phone, t.specialization, `${t.experience} yrs`, formatCurrency(t.salary), t.status]);
      summary.innerHTML = `Total Trainers: <span class="text-primary">${res.count}</span> &nbsp;|&nbsp; Monthly Salary Total: <span class="text-success">${formatCurrency(res.totalSalary)}</span>`;
    } else if (type === 'membership') {
      lastReportColumns = ['Plan Name', 'Duration', 'Price', 'Status', 'Total Members', 'Active Members'];
      lastReportData = data.map(p => [p.planName, p.duration, formatCurrency(p.price), p.status, p.totalMembers, p.activeMembers]);
      summary.innerHTML = `Total Plans: <span class="text-primary">${res.count}</span>`;
    } else if (type === 'attendance') {
      lastReportColumns = ['Member', 'Date', 'Check-in', 'Check-out', 'Status'];
      lastReportData = data.map(a => [a.member ? a.member.fullName : '-', formatDate(a.date), formatTime(a.checkInTime), formatTime(a.checkOutTime), a.status]);
      summary.innerHTML = `Total: <span class="text-primary">${res.count}</span> &nbsp;|&nbsp; Present: <span class="text-success">${res.summary.presentCount}</span> &nbsp;|&nbsp; Absent: <span class="text-danger">${res.summary.absentCount}</span>`;
    } else if (type === 'payments') {
      lastReportColumns = ['Member', 'Plan', 'Amount', 'Date', 'Method', 'Status', 'Receipt No.'];
      lastReportData = data.map(p => [p.member ? p.member.fullName : '-', p.membershipPlan ? p.membershipPlan.planName : '-', p.amount, formatDate(p.paymentDate), p.paymentMethod, p.paymentStatus, p.receiptNumber]);
      summary.innerHTML = `Total Payments: <span class="text-primary">${res.count}</span> &nbsp;|&nbsp; Total: <span class="text-success">${formatCurrency(res.totalAmount)}</span>`;
    } else if (type === 'revenue') {
      lastReportColumns = ['Period (Month/Year)', 'Total Revenue', 'Payment Count'];
      lastReportData = data.map(r => [r.period, formatCurrency(r.total), r.count]);
      summary.innerHTML = `Grand Total: <span class="text-success">${formatCurrency(res.grandTotal)}</span>`;
    } else if (type === 'equipment') {
      lastReportColumns = ['Name', 'Category', 'Qty', 'Purchase Date', 'Price', 'Status'];
      lastReportData = data.map(e => [e.equipmentName, e.category, e.quantity, formatDate(e.purchaseDate), e.purchasePrice, e.status]);
      summary.innerHTML = `Items: <span class="text-primary">${res.count}</span> &nbsp;|&nbsp; Total Qty: <span class="text-success">${res.totalQuantity}</span> &nbsp;|&nbsp; Total Value: <span class="text-success">${formatCurrency(res.totalValue)}</span>`;
    } else if (type === 'maintenance') {
      lastReportColumns = ['Name', 'Status', 'Condition', 'Last Maintenance', 'Next Maintenance'];
      lastReportData = data.map(e => [e.equipmentName, e.status, e.condition, formatDate(e.lastMaintenanceDate), formatDate(e.nextMaintenanceDate)]);
      summary.innerHTML = `Items Needing Attention: <span class="text-primary">${res.count}</span>`;
    } else if (type === 'fitness-progress') {
      lastReportColumns = ['Member', 'Date', 'Weight', 'Height', 'BMI', 'Notes'];
      lastReportData = data.map(p => [p.member ? p.member.fullName : '-', formatDate(p.date), p.weight, p.height, p.bmi || '-', p.notes || '-']);
      summary.innerHTML = `Records: <span class="text-primary">${res.count}</span>`;
    }

    renderReportTable();
  } catch (err) {
    wrapper.innerHTML = `<div class="alert alert-danger">Error generating report: ${err.message}</div>`;
  }
}

function renderReportTable() {
  const wrapper = document.getElementById('reportTableWrapper');
  if (!lastReportData.length) {
    wrapper.innerHTML = '<div class="text-center text-muted py-4">No records found for the selected filters.</div>';
    return;
  }
  wrapper.innerHTML = `
    <table class="table table-hover align-middle">
      <thead><tr>${lastReportColumns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${lastReportData.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
}

function exportCSV() {
  if (!lastReportData.length) { showToast('No data to export.', 'error'); return; }
  const rows = [lastReportColumns, ...lastReportData];
  const csvContent = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentReportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
