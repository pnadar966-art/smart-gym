let equipmentModalInstance;

(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('equipment');
  document.getElementById('pageHeading').textContent = 'Equipment';

  equipmentModalInstance = new bootstrap.Modal(document.getElementById('equipmentModal'));

  renderPageShell();
  await loadEquipment();

  document.getElementById('equipmentForm').addEventListener('submit', saveEquipment);
})();

function renderPageShell() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="page-title mb-0">Equipment Management</h4>
      <button class="btn btn-accent" onclick="openAddEquipment()"><i class="bi bi-plus-lg"></i> Add Equipment</button>
    </div>
    <div class="content-card mb-3">
      <div class="d-flex justify-content-between mb-0 flex-wrap gap-2">
        <div class="input-group search-bar">
          <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control" id="equipmentSearch" placeholder="Search by name or category...">
        </div>
        <select class="form-select" id="filterEquipStatus" style="max-width:220px;" onchange="loadEquipment()">
          <option value="">All Status</option><option value="Available">Available</option><option value="In Use">In Use</option>
          <option value="Maintenance Required">Maintenance Required</option><option value="Damaged">Damaged</option>
        </select>
      </div>
    </div>
    <div class="row g-3" id="equipmentCardsRow">
      <div class="col-12 text-center text-muted py-4"><div class="spinner-border text-primary"></div></div>
    </div>
  `;

  let searchTimeout;
  document.getElementById('equipmentSearch').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadEquipment(), 350);
  });
}

async function loadEquipment() {
  const row = document.getElementById('equipmentCardsRow');
  try {
    const search = document.getElementById('equipmentSearch') ? document.getElementById('equipmentSearch').value : '';
    const status = document.getElementById('filterEquipStatus') ? document.getElementById('filterEquipStatus').value : '';
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const res = await apiRequest('/equipment?' + params.toString());
    const equipment = res.data;

    if (!equipment.length) {
      row.innerHTML = '<div class="col-12 text-center text-muted py-4">No equipment found</div>';
      return;
    }

    row.innerHTML = equipment.map(eq => `
      <div class="col-md-6 col-lg-4 col-xl-3">
        <div class="equipment-card">
          <img src="${eq.imageUrl}" alt="${eq.equipmentName}">
          <div class="equipment-body">
            <div class="d-flex justify-content-between align-items-start">
              <h6 class="fw-bold mb-1">${eq.equipmentName}</h6>
              <span class="badge ${statusBadgeClass(eq.status)}">${eq.status}</span>
            </div>
            <div class="text-muted small mb-1">${eq.category} &middot; Qty: ${eq.quantity}</div>
            <div class="text-muted small mb-2">Purchased: ${formatDate(eq.purchaseDate)} &middot; ${formatCurrency(eq.purchasePrice)}</div>
            ${eq.nextMaintenanceDate ? `<div class="small ${new Date(eq.nextMaintenanceDate) < new Date() ? 'text-danger fw-semibold' : 'text-muted'}"><i class="bi bi-tools"></i> Next maintenance: ${formatDate(eq.nextMaintenanceDate)}</div>` : ''}
            <div class="d-flex gap-2 mt-2">
              <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="openEditEquipment('${eq._id}')"><i class="bi bi-pencil"></i> Edit</button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteEquipment('${eq._id}', '${eq.equipmentName.replace(/'/g, "\\'")}')"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>
      </div>`).join('');
  } catch (err) {
    row.innerHTML = `<div class="col-12"><div class="alert alert-danger">Error: ${err.message}</div></div>`;
  }
}

function openAddEquipment() {
  document.getElementById('equipmentForm').reset();
  document.getElementById('equipmentId').value = '';
  document.getElementById('equipmentModalTitle').textContent = 'Add Equipment';
  document.getElementById('ePurchaseDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('eQuantity').value = 1;
  document.getElementById('eCondition').value = 'Good';
  document.getElementById('eStatus').value = 'Available';
  equipmentModalInstance.show();
}

async function openEditEquipment(id) {
  try {
    const res = await apiRequest(`/equipment/${id}`);
    const eq = res.data;

    document.getElementById('equipmentId').value = eq._id;
    document.getElementById('eName').value = eq.equipmentName;
    document.getElementById('eCategory').value = eq.category;
    document.getElementById('eQuantity').value = eq.quantity;
    document.getElementById('ePurchaseDate').value = eq.purchaseDate ? eq.purchaseDate.split('T')[0] : '';
    document.getElementById('ePrice').value = eq.purchasePrice;
    document.getElementById('eCondition').value = eq.condition;
    document.getElementById('eStatus').value = eq.status;
    document.getElementById('eLastMaintenance').value = eq.lastMaintenanceDate ? eq.lastMaintenanceDate.split('T')[0] : '';
    document.getElementById('eNextMaintenance').value = eq.nextMaintenanceDate ? eq.nextMaintenanceDate.split('T')[0] : '';

    document.getElementById('equipmentModalTitle').textContent = 'Edit Equipment';
    equipmentModalInstance.show();
  } catch (err) {
    showToast('Error loading equipment: ' + err.message, 'error');
  }
}

async function saveEquipment(e) {
  e.preventDefault();
  const id = document.getElementById('equipmentId').value;
  const payload = {
    equipmentName: document.getElementById('eName').value.trim(),
    category: document.getElementById('eCategory').value,
    quantity: Number(document.getElementById('eQuantity').value),
    purchaseDate: document.getElementById('ePurchaseDate').value,
    purchasePrice: Number(document.getElementById('ePrice').value),
    condition: document.getElementById('eCondition').value,
    status: document.getElementById('eStatus').value,
    lastMaintenanceDate: document.getElementById('eLastMaintenance').value || null,
    nextMaintenanceDate: document.getElementById('eNextMaintenance').value || null
  };

  try {
    if (id) {
      await apiRequest(`/equipment/${id}`, { method: 'PUT', body: payload });
      showToast('Equipment updated successfully.');
    } else {
      await apiRequest('/equipment', { method: 'POST', body: payload });
      showToast('Equipment added successfully.');
    }
    equipmentModalInstance.hide();
    loadEquipment();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteEquipment(id, name) {
  if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
  try {
    await apiRequest(`/equipment/${id}`, { method: 'DELETE' });
    showToast('Equipment deleted successfully.');
    loadEquipment();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
