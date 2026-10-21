let trainerModalInstance, viewTrainerModalInstance;

(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('trainers');
  document.getElementById('pageHeading').textContent = 'Trainers';

  trainerModalInstance = new bootstrap.Modal(document.getElementById('trainerModal'));
  viewTrainerModalInstance = new bootstrap.Modal(document.getElementById('viewTrainerModal'));

  renderPageShell();
  await loadTrainers();

  document.getElementById('trainerForm').addEventListener('submit', saveTrainer);
})();

function renderPageShell() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="page-title mb-0">Trainer Management</h4>
      <button class="btn btn-accent" onclick="openAddTrainer()"><i class="bi bi-plus-lg"></i> Add Trainer</button>
    </div>
    <div class="content-card">
      <div class="d-flex justify-content-between mb-3 flex-wrap gap-2">
        <div class="input-group search-bar">
          <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control" id="trainerSearch" placeholder="Search by name, specialization...">
        </div>
        <select class="form-select" id="filterTrainerStatus" style="max-width:180px;" onchange="loadTrainers()">
          <option value="">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option>
        </select>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead><tr><th>Photo</th><th>Name</th><th>Specialization</th><th>Experience</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="trainerTableBody"><tr><td colspan="7" class="text-center text-muted py-4">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;

  let searchTimeout;
  document.getElementById('trainerSearch').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadTrainers(), 350);
  });
}

async function loadTrainers() {
  const tbody = document.getElementById('trainerTableBody');
  try {
    const search = document.getElementById('trainerSearch') ? document.getElementById('trainerSearch').value : '';
    const status = document.getElementById('filterTrainerStatus') ? document.getElementById('filterTrainerStatus').value : '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const res = await apiRequest('/trainers?' + params.toString());
    const trainers = res.data;

    if (!trainers.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No trainers found</td></tr>';
      return;
    }

    tbody.innerHTML = trainers.map(t => `
      <tr>
        <td><img src="${t.photoUrl}" class="rounded-circle" width="36" height="36" style="object-fit:cover;"></td>
        <td class="fw-semibold">${t.name}</td>
        <td>${t.specialization}</td>
        <td>${t.experience} yrs</td>
        <td>${formatCurrency(t.salary)}</td>
        <td><span class="badge ${statusBadgeClass(t.status)}">${t.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-secondary" onclick="viewTrainer('${t._id}')" title="View"><i class="bi bi-eye"></i></button>
          <button class="btn btn-sm btn-outline-primary" onclick="openEditTrainer('${t._id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteTrainer('${t._id}', '${t.name.replace(/'/g, "\\'")}')" title="Delete"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Error: ${err.message}</td></tr>`;
  }
}

async function viewTrainer(id) {
  try {
    const res = await apiRequest(`/trainers/${id}`);
    const t = res.data;

    document.getElementById('viewTrainerBody').innerHTML = `
      <div class="text-center mb-3">
        <img src="${t.photoUrl}" class="rounded-circle mb-2" width="90" height="90" style="object-fit:cover;">
        <h5 class="fw-bold mb-0">${t.name}</h5>
        <div class="text-muted">${t.specialization}</div>
      </div>
      <table class="table table-borderless table-sm">
        <tr><td class="text-muted">Email</td><td class="text-end">${t.email}</td></tr>
        <tr><td class="text-muted">Phone</td><td class="text-end">${t.phone}</td></tr>
        <tr><td class="text-muted">Experience</td><td class="text-end">${t.experience} yrs</td></tr>
        <tr><td class="text-muted">Salary</td><td class="text-end">${formatCurrency(t.salary)}</td></tr>
        <tr><td class="text-muted">Joining Date</td><td class="text-end">${formatDate(t.joiningDate)}</td></tr>
        <tr><td class="text-muted">Active Workout Plans</td><td class="text-end">${t.activeWorkoutPlans}</td></tr>
      </table>
      <h6 class="fw-bold mt-2">Assigned Members (${t.assignedMembers.length})</h6>
      ${t.assignedMembers.length ? t.assignedMembers.map(m => `
        <div class="d-flex align-items-center gap-2 border-bottom py-1">
          <img src="${m.photoUrl}" class="rounded-circle" width="28" height="28" style="object-fit:cover;">
          <a href="/member-profile.html?id=${m._id}" class="text-decoration-none">${m.fullName}</a>
          <span class="badge ${statusBadgeClass(m.status)} ms-auto">${m.status}</span>
        </div>`).join('') : '<p class="text-muted small">No members assigned yet.</p>'}
    `;
    viewTrainerModalInstance.show();
  } catch (err) {
    showToast('Error loading trainer: ' + err.message, 'error');
  }
}

function openAddTrainer() {
  document.getElementById('trainerForm').reset();
  document.getElementById('trainerId').value = '';
  document.getElementById('trainerModalTitle').textContent = 'Add Trainer';
  document.getElementById('tJoiningDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('tStatus').value = 'Active';
  trainerModalInstance.show();
}

async function openEditTrainer(id) {
  try {
    const res = await apiRequest(`/trainers/${id}`);
    const t = res.data;

    document.getElementById('trainerId').value = t._id;
    document.getElementById('tName').value = t.name;
    document.getElementById('tGender').value = t.gender;
    document.getElementById('tExperience').value = t.experience;
    document.getElementById('tEmail').value = t.email;
    document.getElementById('tPhone').value = t.phone;
    document.getElementById('tSpecialization').value = t.specialization;
    document.getElementById('tSalary').value = t.salary;
    document.getElementById('tJoiningDate').value = t.joiningDate ? t.joiningDate.split('T')[0] : '';
    document.getElementById('tStatus').value = t.status;

    document.getElementById('trainerModalTitle').textContent = 'Edit Trainer';
    trainerModalInstance.show();
  } catch (err) {
    showToast('Error loading trainer: ' + err.message, 'error');
  }
}

async function saveTrainer(e) {
  e.preventDefault();
  const id = document.getElementById('trainerId').value;
  const payload = {
    name: document.getElementById('tName').value.trim(),
    gender: document.getElementById('tGender').value,
    email: document.getElementById('tEmail').value.trim(),
    phone: document.getElementById('tPhone').value.trim(),
    specialization: document.getElementById('tSpecialization').value.trim(),
    experience: Number(document.getElementById('tExperience').value),
    salary: Number(document.getElementById('tSalary').value),
    joiningDate: document.getElementById('tJoiningDate').value,
    status: document.getElementById('tStatus').value
  };

  try {
    if (id) {
      await apiRequest(`/trainers/${id}`, { method: 'PUT', body: payload });
      showToast('Trainer updated successfully.');
    } else {
      await apiRequest('/trainers', { method: 'POST', body: payload });
      showToast('Trainer added successfully.');
    }
    trainerModalInstance.hide();
    loadTrainers();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteTrainer(id, name) {
  if (!confirm(`Are you sure you want to delete trainer "${name}"?`)) return;
  try {
    await apiRequest(`/trainers/${id}`, { method: 'DELETE' });
    showToast('Trainer deleted successfully.');
    loadTrainers();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
