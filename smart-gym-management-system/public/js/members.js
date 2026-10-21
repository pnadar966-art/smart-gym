let allPlans = [];
let allTrainers = [];
let memberModalInstance;

(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('members');
  document.getElementById('pageHeading').textContent = 'Members';

  memberModalInstance = new bootstrap.Modal(document.getElementById('memberModal'));

  renderPageShell();
  await loadDropdowns();
  await loadMembers();

  document.getElementById('memberForm').addEventListener('submit', saveMember);
})();

function renderPageShell() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="page-title mb-0">Member Management</h4>
      <button class="btn btn-accent" onclick="openAddMember()"><i class="bi bi-plus-lg"></i> Add Member</button>
    </div>
    <div class="content-card">
      <div class="d-flex justify-content-between mb-3 flex-wrap gap-2">
        <div class="input-group search-bar">
          <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control" id="memberSearch" placeholder="Search by name, email, phone...">
        </div>
        <select class="form-select" id="filterMemberStatus" style="max-width:180px;" onchange="loadMembers()">
          <option value="">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Expired">Expired</option>
        </select>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead><tr><th>Photo</th><th>Name</th><th>Phone</th><th>Plan</th><th>Trainer</th><th>Membership End</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="memberTableBody"><tr><td colspan="8" class="text-center text-muted py-4">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;

  let searchTimeout;
  document.getElementById('memberSearch').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadMembers(), 350);
  });
}

async function loadDropdowns() {
  const [plansRes, trainersRes] = await Promise.all([apiRequest('/plans'), apiRequest('/trainers')]);
  allPlans = plansRes.data;
  allTrainers = trainersRes.data;

  document.getElementById('mPlan').innerHTML = '<option value="">Select Plan</option>' +
    allPlans.map(p => `<option value="${p._id}">${p.planName} (${formatCurrency(p.price)})</option>`).join('');

  document.getElementById('mTrainer').innerHTML = '<option value="">None</option>' +
    allTrainers.map(t => `<option value="${t._id}">${t.name} - ${t.specialization}</option>`).join('');
}

async function loadMembers() {
  const tbody = document.getElementById('memberTableBody');
  try {
    const search = document.getElementById('memberSearch') ? document.getElementById('memberSearch').value : '';
    const status = document.getElementById('filterMemberStatus') ? document.getElementById('filterMemberStatus').value : '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const res = await apiRequest('/members?' + params.toString());
    const members = res.data;

    if (!members.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No members found</td></tr>';
      return;
    }

    tbody.innerHTML = members.map(m => `
      <tr>
        <td><img src="${m.photoUrl}" class="rounded-circle" width="36" height="36" style="object-fit:cover;"></td>
        <td class="fw-semibold"><a href="/member-profile.html?id=${m._id}" class="text-decoration-none">${m.fullName}</a></td>
        <td>${m.phone}</td>
        <td>${m.membershipPlan ? m.membershipPlan.planName : '-'}</td>
        <td>${m.trainer ? m.trainer.name : '-'}</td>
        <td>${formatDate(m.membershipEndDate)}</td>
        <td><span class="badge ${statusBadgeClass(m.status)}">${m.status}</span></td>
        <td>
          <a href="/member-profile.html?id=${m._id}" class="btn btn-sm btn-outline-secondary" title="View Profile"><i class="bi bi-eye"></i></a>
          <button class="btn btn-sm btn-outline-primary" onclick="openEditMember('${m._id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteMember('${m._id}', '${m.fullName.replace(/'/g, "\\'")}')" title="Delete"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Error: ${err.message}</td></tr>`;
  }
}

function openAddMember() {
  document.getElementById('memberForm').reset();
  document.getElementById('memberId').value = '';
  document.getElementById('memberModalTitle').textContent = 'Add Member';
  document.getElementById('mJoiningDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('mStartDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('mStatus').value = 'Active';
  memberModalInstance.show();
}

async function openEditMember(id) {
  try {
    const res = await apiRequest(`/members/${id}`);
    const m = res.data;

    document.getElementById('memberId').value = m._id;
    document.getElementById('mFullName').value = m.fullName;
    document.getElementById('mGender').value = m.gender;
    document.getElementById('mDob').value = m.dob ? m.dob.split('T')[0] : '';
    document.getElementById('mEmail').value = m.email;
    document.getElementById('mPhone').value = m.phone;
    document.getElementById('mAddress').value = m.address;
    document.getElementById('mEmergencyContact').value = m.emergencyContact;
    document.getElementById('mJoiningDate').value = m.joiningDate ? m.joiningDate.split('T')[0] : '';
    document.getElementById('mPlan').value = m.membershipPlan ? m.membershipPlan._id : '';
    document.getElementById('mStartDate').value = m.membershipStartDate ? m.membershipStartDate.split('T')[0] : '';
    document.getElementById('mEndDate').value = m.membershipEndDate ? m.membershipEndDate.split('T')[0] : '';
    document.getElementById('mTrainer').value = m.trainer ? m.trainer._id : '';
    document.getElementById('mWeight').value = m.weight || '';
    document.getElementById('mHeight').value = m.height || '';
    document.getElementById('mFitnessGoal').value = m.fitnessGoal;
    document.getElementById('mStatus').value = m.status;

    document.getElementById('memberModalTitle').textContent = 'Edit Member';
    memberModalInstance.show();
  } catch (err) {
    showToast('Error loading member: ' + err.message, 'error');
  }
}

async function saveMember(e) {
  e.preventDefault();
  const id = document.getElementById('memberId').value;
  const payload = {
    fullName: document.getElementById('mFullName').value.trim(),
    gender: document.getElementById('mGender').value,
    dob: document.getElementById('mDob').value,
    email: document.getElementById('mEmail').value.trim(),
    phone: document.getElementById('mPhone').value.trim(),
    address: document.getElementById('mAddress').value.trim(),
    emergencyContact: document.getElementById('mEmergencyContact').value.trim(),
    joiningDate: document.getElementById('mJoiningDate').value,
    membershipPlan: document.getElementById('mPlan').value,
    membershipStartDate: document.getElementById('mStartDate').value,
    membershipEndDate: document.getElementById('mEndDate').value,
    trainer: document.getElementById('mTrainer').value || null,
    weight: document.getElementById('mWeight').value ? Number(document.getElementById('mWeight').value) : null,
    height: document.getElementById('mHeight').value ? Number(document.getElementById('mHeight').value) : null,
    fitnessGoal: document.getElementById('mFitnessGoal').value,
    status: document.getElementById('mStatus').value
  };

  try {
    if (id) {
      await apiRequest(`/members/${id}`, { method: 'PUT', body: payload });
      showToast('Member updated successfully.');
    } else {
      await apiRequest('/members', { method: 'POST', body: payload });
      showToast('Member added successfully.');
    }
    memberModalInstance.hide();
    loadMembers();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteMember(id, name) {
  if (!confirm(`Are you sure you want to delete member "${name}"? This cannot be undone.`)) return;
  try {
    await apiRequest(`/members/${id}`, { method: 'DELETE' });
    showToast('Member deleted successfully.');
    loadMembers();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
