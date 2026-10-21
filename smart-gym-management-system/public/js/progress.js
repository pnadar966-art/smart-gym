let progressModalInstance;
let allMembersForProgress = [];
let progressChartInstance = null;

(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('progress');
  document.getElementById('pageHeading').textContent = 'Fitness Progress';

  progressModalInstance = new bootstrap.Modal(document.getElementById('progressModal'));

  renderPageShell();
  await loadMembersDropdown();

  const params = new URLSearchParams(window.location.search);
  const preselectMember = params.get('member');
  if (preselectMember) {
    document.getElementById('filterMember').value = preselectMember;
  }

  await loadProgress();

  document.getElementById('progressForm').addEventListener('submit', saveProgress);
  document.getElementById('filterMember').addEventListener('change', loadProgress);

  if (preselectMember) openAddProgress(preselectMember);
})();

function renderPageShell() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="page-title mb-0">Fitness Progress Tracking</h4>
      <button class="btn btn-accent" onclick="openAddProgress()"><i class="bi bi-plus-lg"></i> Log Progress</button>
    </div>
    <div class="content-card mb-3">
      <div class="d-flex align-items-center gap-2 mb-3">
        <label class="form-label mb-0">Member:</label>
        <select class="form-select" id="filterMember" style="max-width:300px;"><option value="">Select a member to view chart</option></select>
      </div>
      <canvas id="progressChart" height="90"></canvas>
    </div>
    <div class="content-card">
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead><tr><th>Member</th><th>Date</th><th>Weight</th><th>Height</th><th>BMI</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody id="progressTableBody"><tr><td colspan="7" class="text-center text-muted py-4">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;
}

async function loadMembersDropdown() {
  const res = await apiRequest('/members');
  allMembersForProgress = res.data;
  const options = allMembersForProgress.map(m => `<option value="${m._id}">${m.fullName}</option>`).join('');
  document.getElementById('prMember').innerHTML = '<option value="">Select Member</option>' + options;
  document.getElementById('filterMember').innerHTML = '<option value="">Select a member to view chart</option>' + options;
}

async function loadProgress() {
  const tbody = document.getElementById('progressTableBody');
  const memberId = document.getElementById('filterMember').value;

  try {
    const params = new URLSearchParams();
    if (memberId) params.append('member', memberId);

    const res = await apiRequest('/fitness-progress?' + params.toString());
    const records = res.data;

    if (!records.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No progress records found</td></tr>';
    } else {
      tbody.innerHTML = records.slice().reverse().map(r => `
        <tr>
          <td class="fw-semibold">${r.member ? r.member.fullName : '-'}</td>
          <td>${formatDate(r.date)}</td>
          <td>${r.weight} kg</td>
          <td>${r.height} cm</td>
          <td>${r.bmi || '-'}</td>
          <td>${r.notes || '-'}</td>
          <td><button class="btn btn-sm btn-outline-danger" onclick="deleteProgress('${r._id}')"><i class="bi bi-trash"></i></button></td>
        </tr>`).join('');
    }

    renderProgressChart(records, memberId);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Error: ${err.message}</td></tr>`;
  }
}

function renderProgressChart(records, memberId) {
  const ctx = document.getElementById('progressChart');
  if (progressChartInstance) progressChartInstance.destroy();

  if (!memberId || !records.length) {
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
    return;
  }

  const sorted = records.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  progressChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sorted.map(r => formatDate(r.date)),
      datasets: [{ label: 'Weight (kg)', data: sorted.map(r => r.weight), borderColor: '#1e3a5f', backgroundColor: 'rgba(30,58,95,0.1)', fill: true, tension: 0.3 }]
    },
    options: { responsive: true }
  });
}

function openAddProgress(preselectMemberId) {
  document.getElementById('progressForm').reset();
  document.getElementById('prDate').value = new Date().toISOString().split('T')[0];
  if (preselectMemberId) document.getElementById('prMember').value = preselectMemberId;
  progressModalInstance.show();
}

async function saveProgress(e) {
  e.preventDefault();
  const payload = {
    member: document.getElementById('prMember').value,
    date: document.getElementById('prDate').value,
    weight: Number(document.getElementById('prWeight').value),
    height: Number(document.getElementById('prHeight').value),
    chest: document.getElementById('prChest').value ? Number(document.getElementById('prChest').value) : null,
    waist: document.getElementById('prWaist').value ? Number(document.getElementById('prWaist').value) : null,
    arms: document.getElementById('prArms').value ? Number(document.getElementById('prArms').value) : null,
    notes: document.getElementById('prNotes').value.trim()
  };

  try {
    await apiRequest('/fitness-progress', { method: 'POST', body: payload });
    showToast('Fitness progress recorded successfully.');
    progressModalInstance.hide();
    document.getElementById('filterMember').value = payload.member;
    loadProgress();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteProgress(id) {
  if (!confirm('Are you sure you want to delete this progress record?')) return;
  try {
    await apiRequest(`/fitness-progress/${id}`, { method: 'DELETE' });
    showToast('Progress record deleted.');
    loadProgress();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
