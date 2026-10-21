(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('dashboard');
  document.getElementById('pageHeading').textContent = 'Dashboard';

  const content = document.getElementById('pageContent');
  content.innerHTML = `<div class="spinner-wrap"><div class="spinner-border text-primary"></div><p class="mt-2">Loading dashboard...</p></div>`;

  try {
    const res = await apiRequest('/dashboard');
    const d = res.data;

    content.innerHTML = `
      <h4 class="page-title mb-4">Overview</h4>

      <div class="row g-3 mb-4">
        <div class="col-md-4 col-lg-3">
          <div class="stat-card bg-c1"><i class="bi bi-people-fill stat-icon"></i>
            <div class="stat-value">${d.totalMembers}</div><div class="stat-label">Total Members (${d.activeMembers} active)</div></div>
        </div>
        <div class="col-md-4 col-lg-3">
          <div class="stat-card bg-c2"><i class="bi bi-person-badge-fill stat-icon"></i>
            <div class="stat-value">${d.totalTrainers}</div><div class="stat-label">Total Trainers</div></div>
        </div>
        <div class="col-md-4 col-lg-3">
          <div class="stat-card bg-c3"><i class="bi bi-card-checklist stat-icon"></i>
            <div class="stat-value">${d.activePlans}</div><div class="stat-label">Active Membership Plans</div></div>
        </div>
        <div class="col-md-4 col-lg-3">
          <div class="stat-card bg-c4"><i class="bi bi-calendar-check-fill stat-icon"></i>
            <div class="stat-value">${d.todaysAttendanceCount}</div><div class="stat-label">Today's Attendance</div></div>
        </div>
        <div class="col-md-4 col-lg-3">
          <div class="stat-card bg-c5"><i class="bi bi-cash-coin stat-icon"></i>
            <div class="stat-value">${formatCurrency(d.monthlyRevenue)}</div><div class="stat-label">Monthly Revenue</div></div>
        </div>
        <div class="col-md-4 col-lg-3">
          <div class="stat-card bg-c8"><i class="bi bi-exclamation-triangle-fill stat-icon"></i>
            <div class="stat-value">${d.expiringMemberships}</div><div class="stat-label">Memberships Expiring This Week</div></div>
        </div>
        <div class="col-md-4 col-lg-3">
          <div class="stat-card bg-c6"><i class="bi bi-tools stat-icon"></i>
            <div class="stat-value">${d.maintenanceEquipmentCount}</div><div class="stat-label">Equipment Needing Maintenance</div></div>
        </div>
        <div class="col-md-4 col-lg-3">
          <div class="stat-card bg-c7"><i class="bi bi-bicycle stat-icon"></i>
            <div class="stat-value">${d.activePlans}</div><div class="stat-label">Active Memberships</div></div>
        </div>
      </div>

      ${d.expiringMembersList.length ? `
      <div class="alert-card warning">
        <i class="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
        <div><strong>${d.expiringMembersList.length} membership(s) expiring this week:</strong>
        ${d.expiringMembersList.map(m => m.fullName).join(', ')}.
        <a href="/members.html" class="ms-2">View Members</a></div>
      </div>` : ''}

      ${d.maintenanceAlertsList.length ? `
      <div class="alert-card danger">
        <i class="bi bi-tools text-danger fs-4"></i>
        <div><strong>${d.maintenanceAlertsList.length} equipment item(s) require maintenance:</strong>
        ${d.maintenanceAlertsList.map(e => e.equipmentName).join(', ')}.
        <a href="/equipment.html" class="ms-2">View Equipment</a></div>
      </div>` : ''}

      <div class="row g-3 mb-4 mt-2">
        <div class="col-lg-6">
          <div class="content-card">
            <h6 class="fw-bold mb-3"><i class="bi bi-graph-up text-primary"></i> Membership Growth (Last 6 Months)</h6>
            <canvas id="growthChart" height="180"></canvas>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="content-card">
            <h6 class="fw-bold mb-3"><i class="bi bi-cash-stack text-success"></i> Monthly Revenue</h6>
            <canvas id="revenueChart" height="180"></canvas>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="content-card">
            <h6 class="fw-bold mb-3"><i class="bi bi-calendar-week text-info"></i> Attendance Trend (Last 7 Days)</h6>
            <canvas id="attendanceChart" height="180"></canvas>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="content-card">
            <h6 class="fw-bold mb-3"><i class="bi bi-pie-chart-fill text-warning"></i> Membership Plan Distribution</h6>
            <canvas id="planChart" height="180"></canvas>
          </div>
        </div>
      </div>

      <div class="row g-3">
        <div class="col-lg-6">
          <div class="content-card">
            <h6 class="fw-bold mb-3"><i class="bi bi-person-plus-fill text-primary"></i> Recently Joined Members</h6>
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead><tr><th>Name</th><th>Plan</th><th>Joining Date</th><th>Status</th></tr></thead>
                <tbody>
                  ${d.recentMembers.length ? d.recentMembers.map(m => `
                    <tr><td>${m.fullName}</td><td>${m.membershipPlan ? m.membershipPlan.planName : '-'}</td>
                    <td>${formatDate(m.joiningDate)}</td><td><span class="badge ${statusBadgeClass(m.status)}">${m.status}</span></td></tr>`).join('')
                    : '<tr><td colspan="4" class="text-center text-muted">No members yet</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="content-card">
            <h6 class="fw-bold mb-3"><i class="bi bi-receipt text-success"></i> Recent Payments</h6>
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead><tr><th>Member</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
                <tbody>
                  ${d.recentPayments.length ? d.recentPayments.map(p => `
                    <tr><td>${p.member ? p.member.fullName : '-'}</td><td>${formatCurrency(p.amount)}</td>
                    <td>${p.paymentMethod}</td><td>${formatDate(p.paymentDate)}</td></tr>`).join('')
                    : '<tr><td colspan="4" class="text-center text-muted">No payments yet</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Charts are rendered separately so a Chart.js load failure (e.g. blocked
    // CDN, no internet) only skips the charts instead of hiding the whole dashboard.
    // This loads Chart.js itself via JavaScript, with two fallback CDNs, so it
    // does not depend on the <script> tag in dashboard.html being correct.
    try {
      await ensureChartJsLoaded();
      renderCharts(d.charts);
    } catch (chartErr) {
      console.error('Chart rendering error:', chartErr);
      const chartsRow = document.querySelectorAll('.content-card canvas');
      chartsRow.forEach(canvas => {
        canvas.insertAdjacentHTML('afterend', `<div class="text-muted small">Charts unavailable: ${chartErr.message}</div>`);
      });
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
    content.innerHTML = `<div class="alert alert-danger">Failed to load dashboard: ${err.message}</div>`;
  }
})();

// Loads Chart.js dynamically if it isn't already available, trying multiple
// CDNs in order. Resolves once window.Chart exists, rejects only if all fail.
function loadScript(url) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load ' + url));
    document.head.appendChild(script);
  });
}

async function ensureChartJsLoaded() {
  if (typeof Chart !== 'undefined') return;

  const sources = [
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.5.1/chart.umd.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js',
    'https://unpkg.com/chart.js@4.5.1/dist/chart.umd.min.js'
  ];

  for (const src of sources) {
    try {
      await loadScript(src);
      if (typeof Chart !== 'undefined') return;
    } catch (e) {
      // try the next source
    }
  }

  throw new Error('Chart.js could not be loaded from any CDN (check your internet connection).');
}

function renderCharts(charts) {
  const growthCtx = document.getElementById('growthChart');
  new Chart(growthCtx, {
    type: 'line',

    data: {
      labels: charts.membershipGrowth.map(m => m.label),
      datasets: [{ label: 'New Members', data: charts.membershipGrowth.map(m => m.count), borderColor: '#1e3a5f', backgroundColor: 'rgba(30,58,95,0.1)', fill: true, tension: 0.3 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  const revenueCtx = document.getElementById('revenueChart');
  new Chart(revenueCtx, {
    type: 'bar',
    data: {
      labels: charts.monthlyRevenue.map(r => r.label),
      datasets: [{ label: 'Revenue (₹)', data: charts.monthlyRevenue.map(r => r.total), backgroundColor: '#38a169' }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  const attendanceCtx = document.getElementById('attendanceChart');
  new Chart(attendanceCtx, {
    type: 'line',
    data: {
      labels: charts.attendanceTrend.map(a => a.label),
      datasets: [{ label: 'Present', data: charts.attendanceTrend.map(a => a.count), borderColor: '#dd6b20', backgroundColor: 'rgba(221,107,32,0.1)', fill: true, tension: 0.3 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  const planCtx = document.getElementById('planChart');
  new Chart(planCtx, {
    type: 'doughnut',
    data: {
      labels: charts.planDistribution.map(p => p.planName),
      datasets: [{ data: charts.planDistribution.map(p => p.count), backgroundColor: ['#1e3a5f', '#38a169', '#dd6b20', '#805ad5', '#e53e3e', '#3182ce'] }]
    },
    options: { responsive: true }
  });
}