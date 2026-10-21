let planModalInstance;

(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('plans');
  document.getElementById('pageHeading').textContent = 'Membership Plans';

  planModalInstance = new bootstrap.Modal(document.getElementById('planModal'));

  renderPageShell();
  await loadPlans();

  document.getElementById('planForm').addEventListener('submit', savePlan);
})();

function renderPageShell() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="page-title mb-0">Membership Plans</h4>
      <button class="btn btn-accent" onclick="openAddPlan()"><i class="bi bi-plus-lg"></i> Add Plan</button>
    </div>
    <div class="row g-3" id="planCardsRow">
      <div class="col-12 text-center text-muted py-4"><div class="spinner-border text-primary"></div></div>
    </div>
  `;
}

async function loadPlans() {
  const row = document.getElementById('planCardsRow');
  try {
    const res = await apiRequest('/plans');
    const plans = res.data;

    if (!plans.length) {
      row.innerHTML = '<div class="col-12 text-center text-muted py-4">No membership plans found</div>';
      return;
    }

    row.innerHTML = plans.map(p => `
      <div class="col-md-6 col-lg-4 col-xl-3">
        <div class="plan-card">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h5 class="fw-bold mb-0">${p.planName}</h5>
            <span class="badge ${statusBadgeClass(p.status)}">${p.status}</span>
          </div>
          <div class="text-muted small mb-2">${p.duration}</div>
          <div class="plan-price mb-2">${formatCurrency(p.price)}</div>
          <p class="text-muted small">${p.description || ''}</p>
          <ul>${(p.features || []).map(f => `<li>${f}</li>`).join('')}</ul>
          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="openEditPlan('${p._id}')"><i class="bi bi-pencil"></i> Edit</button>
            <button class="btn btn-sm btn-outline-danger" onclick="deletePlan('${p._id}', '${p.planName.replace(/'/g, "\\'")}')"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>`).join('');
  } catch (err) {
    row.innerHTML = `<div class="col-12"><div class="alert alert-danger">Error: ${err.message}</div></div>`;
  }
}

function openAddPlan() {
  document.getElementById('planForm').reset();
  document.getElementById('planId').value = '';
  document.getElementById('planModalTitle').textContent = 'Add Membership Plan';
  document.getElementById('pStatus').value = 'Active';
  planModalInstance.show();
}

async function openEditPlan(id) {
  try {
    const res = await apiRequest(`/plans/${id}`);
    const p = res.data;

    document.getElementById('planId').value = p._id;
    document.getElementById('pName').value = p.planName;
    document.getElementById('pDuration').value = p.duration;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pDescription').value = p.description || '';
    document.getElementById('pFeatures').value = (p.features || []).join(', ');
    document.getElementById('pStatus').value = p.status;

    document.getElementById('planModalTitle').textContent = 'Edit Membership Plan';
    planModalInstance.show();
  } catch (err) {
    showToast('Error loading plan: ' + err.message, 'error');
  }
}

async function savePlan(e) {
  e.preventDefault();
  const id = document.getElementById('planId').value;
  const payload = {
    planName: document.getElementById('pName').value.trim(),
    duration: document.getElementById('pDuration').value.trim(),
    price: Number(document.getElementById('pPrice').value),
    description: document.getElementById('pDescription').value.trim(),
    features: document.getElementById('pFeatures').value.trim(),
    status: document.getElementById('pStatus').value
  };

  try {
    if (id) {
      await apiRequest(`/plans/${id}`, { method: 'PUT', body: payload });
      showToast('Plan updated successfully.');
    } else {
      await apiRequest('/plans', { method: 'POST', body: payload });
      showToast('Plan added successfully.');
    }
    planModalInstance.hide();
    loadPlans();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deletePlan(id, name) {
  if (!confirm(`Are you sure you want to delete plan "${name}"?`)) return;
  try {
    await apiRequest(`/plans/${id}`, { method: 'DELETE' });
    showToast('Plan deleted successfully.');
    loadPlans();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
