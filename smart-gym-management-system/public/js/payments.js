let paymentModalInstance;
let allMembersForPayment = [];
let allPlansForPayment = [];

(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('payments');
  document.getElementById('pageHeading').textContent = 'Payments';

  paymentModalInstance = new bootstrap.Modal(document.getElementById('paymentModal'));

  renderPageShell();
  await loadDropdowns();
  await loadPayments();

  document.getElementById('paymentForm').addEventListener('submit', savePayment);
  document.getElementById('payPlan').addEventListener('change', (e) => {
    const plan = allPlansForPayment.find(p => p._id === e.target.value);
    if (plan) document.getElementById('payAmount').value = plan.price;
  });
})();

function renderPageShell() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="page-title mb-0">Payment Management</h4>
      <button class="btn btn-accent" onclick="openRecordPayment()"><i class="bi bi-plus-lg"></i> Record Payment</button>
    </div>
    <div class="content-card">
      <div class="d-flex justify-content-between mb-3 flex-wrap gap-2">
        <div class="input-group search-bar">
          <span class="input-group-text bg-white"><i class="bi bi-search"></i></span>
          <input type="text" class="form-control" id="paymentSearch" placeholder="Search member, transaction, receipt...">
        </div>
        <div class="d-flex gap-2">
          <select class="form-select" id="filterMethod" onchange="loadPayments()">
            <option value="">All Methods</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Card">Card</option><option value="Bank Transfer">Bank Transfer</option>
          </select>
          <select class="form-select" id="filterPayStatus" onchange="loadPayments()">
            <option value="">All Status</option><option value="Paid">Paid</option><option value="Pending">Pending</option><option value="Failed">Failed</option>
          </select>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead><tr><th>Member</th><th>Plan</th><th>Amount</th><th>Date</th><th>Method</th><th>Status</th><th>Receipt No.</th><th>Actions</th></tr></thead>
          <tbody id="paymentTableBody"><tr><td colspan="8" class="text-center text-muted py-4">Loading...</td></tr></tbody>
        </table>
      </div>
    </div>
  `;

  let searchTimeout;
  document.getElementById('paymentSearch').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadPayments(), 350);
  });
}

async function loadDropdowns() {
  const [membersRes, plansRes] = await Promise.all([apiRequest('/members'), apiRequest('/plans')]);
  allMembersForPayment = membersRes.data;
  allPlansForPayment = plansRes.data;

  document.getElementById('payMember').innerHTML = '<option value="">Select Member</option>' +
    allMembersForPayment.map(m => `<option value="${m._id}">${m.fullName}</option>`).join('');
  document.getElementById('payPlan').innerHTML = '<option value="">Select Plan</option>' +
    allPlansForPayment.map(p => `<option value="${p._id}">${p.planName} (${formatCurrency(p.price)})</option>`).join('');
}

async function loadPayments() {
  const tbody = document.getElementById('paymentTableBody');
  try {
    const search = document.getElementById('paymentSearch') ? document.getElementById('paymentSearch').value : '';
    const method = document.getElementById('filterMethod') ? document.getElementById('filterMethod').value : '';
    const status = document.getElementById('filterPayStatus') ? document.getElementById('filterPayStatus').value : '';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (method) params.append('method', method);
    if (status) params.append('status', status);

    const res = await apiRequest('/payments?' + params.toString());
    const payments = res.data;

    if (!payments.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No payments found</td></tr>';
      return;
    }

    tbody.innerHTML = payments.map(p => `
      <tr>
        <td class="fw-semibold">${p.member ? p.member.fullName : '-'}</td>
        <td>${p.membershipPlan ? p.membershipPlan.planName : '-'}</td>
        <td>${formatCurrency(p.amount)}</td>
        <td>${formatDate(p.paymentDate)}</td>
        <td>${p.paymentMethod}</td>
        <td><span class="badge ${statusBadgeClass(p.paymentStatus)}">${p.paymentStatus}</span></td>
        <td><code>${p.receiptNumber}</code></td>
        <td>
          <a href="/receipt.html?paymentId=${p._id}" class="btn btn-sm btn-outline-primary" title="View Receipt"><i class="bi bi-receipt"></i></a>
          <button class="btn btn-sm btn-outline-secondary" onclick="openEditPayment('${p._id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deletePayment('${p._id}')" title="Delete"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Error: ${err.message}</td></tr>`;
  }
}

function openRecordPayment() {
  document.getElementById('paymentForm').reset();
  document.getElementById('paymentId').value = '';
  document.getElementById('paymentModalTitle').textContent = 'Record Payment';
  document.getElementById('payDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('payStatus').value = 'Paid';
  document.getElementById('payGatewayNote').style.display = 'block';
  paymentModalInstance.show();
}

async function openEditPayment(id) {
  try {
    const res = await apiRequest(`/payments/${id}`);
    const p = res.data;

    document.getElementById('paymentId').value = p._id;
    document.getElementById('payMember').value = p.member._id;
    document.getElementById('payPlan').value = p.membershipPlan._id;
    document.getElementById('payAmount').value = p.amount;
    document.getElementById('payDate').value = p.paymentDate ? p.paymentDate.split('T')[0] : '';
    document.getElementById('payMethod').value = p.paymentMethod;
    document.getElementById('payStatus').value = p.paymentStatus;
    document.getElementById('payGatewayNote').style.display = 'none';

    document.getElementById('paymentModalTitle').textContent = 'Edit Payment';
    paymentModalInstance.show();
  } catch (err) {
    showToast('Error loading payment: ' + err.message, 'error');
  }
}

async function savePayment(e) {
  e.preventDefault();
  const id = document.getElementById('paymentId').value;
  const payload = {
    member: document.getElementById('payMember').value,
    membershipPlan: document.getElementById('payPlan').value,
    amount: Number(document.getElementById('payAmount').value),
    paymentDate: document.getElementById('payDate').value,
    paymentMethod: document.getElementById('payMethod').value,
    paymentStatus: document.getElementById('payStatus').value
  };

  try {
    if (id) {
      await apiRequest(`/payments/${id}`, { method: 'PUT', body: payload });
      showToast('Payment updated successfully.');
      paymentModalInstance.hide();
      loadPayments();
    } else {
      const res = await apiRequest('/payments', { method: 'POST', body: payload });
      showToast('Payment recorded and receipt generated.');
      paymentModalInstance.hide();
      await loadPayments();
      window.location.href = `/receipt.html?paymentId=${res.data._id}`;
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deletePayment(id) {
  if (!confirm('Are you sure you want to delete this payment record?')) return;
  try {
    await apiRequest(`/payments/${id}`, { method: 'DELETE' });
    showToast('Payment deleted successfully.');
    loadPayments();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
