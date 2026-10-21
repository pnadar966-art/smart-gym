(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('payments');
  document.getElementById('pageHeading').textContent = 'Payment Receipt';

  const content = document.getElementById('pageContent');
  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get('paymentId');

  if (!paymentId) {
    content.innerHTML = '<div class="alert alert-danger">No payment specified.</div>';
    return;
  }

  content.innerHTML = `<div class="spinner-wrap"><div class="spinner-border text-primary"></div></div>`;

  try {
    const res = await apiRequest(`/receipts/${paymentId}`);
    const r = res.data;

    content.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3 no-print">
        <h4 class="page-title mb-0">Receipt</h4>
        <div>
          <a href="/payments.html" class="btn btn-outline-secondary"><i class="bi bi-arrow-left"></i> Back to Payments</a>
          <button class="btn btn-accent" onclick="window.print()"><i class="bi bi-printer"></i> Print / Save as PDF</button>
        </div>
      </div>

      <div class="receipt-box">
        <div class="receipt-header">
          <h4 class="fw-bold mb-0"><i class="bi bi-heart-pulse-fill text-danger"></i> Smart Gym &amp; Fitness</h4>
          <div class="text-muted small">Official Payment Receipt</div>
        </div>

        <table class="w-100 mb-3">
          <tr><td class="text-muted">Receipt Number</td><td class="text-end fw-bold">${r.receiptNumber}</td></tr>
          <tr><td class="text-muted">Payment Date</td><td class="text-end">${formatDate(r.paymentDate)}</td></tr>
        </table>
        <hr>
        <table class="w-100 mb-3">
          <tr><td class="text-muted">Member Name</td><td class="text-end fw-semibold">${r.member ? r.member.fullName : '-'}</td></tr>
          <tr><td class="text-muted">Member ID</td><td class="text-end"><code>${r.member ? r.member._id.slice(-8).toUpperCase() : '-'}</code></td></tr>
          <tr><td class="text-muted">Email</td><td class="text-end">${r.member ? r.member.email : '-'}</td></tr>
          <tr><td class="text-muted">Phone</td><td class="text-end">${r.member ? r.member.phone : '-'}</td></tr>
        </table>
        <hr>
        <table class="w-100 mb-3">
          <tr><td class="text-muted">Membership Plan</td><td class="text-end">${r.membershipPlan ? r.membershipPlan.planName : '-'}</td></tr>
          <tr><td class="text-muted">Payment Method</td><td class="text-end">${r.paymentMethod}</td></tr>
          <tr><td class="text-muted">Transaction ID</td><td class="text-end"><code>${r.transactionId}</code></td></tr>
          <tr><td class="text-muted">Payment Status</td><td class="text-end"><span class="badge ${statusBadgeClass(r.paymentStatus)}">${r.paymentStatus}</span></td></tr>
        </table>
        <hr>
        <table class="w-100">
          <tr><td class="fw-bold fs-5">Total Amount</td><td class="text-end fw-bold fs-5 text-success">${formatCurrency(r.amount)}</td></tr>
        </table>
        <div class="text-center text-muted small mt-4">Thank you for choosing Smart Gym &amp; Fitness!</div>
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger">Error loading receipt: ${err.message}</div>`;
  }
})();
