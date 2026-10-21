(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('members');
  document.getElementById('pageHeading').textContent = 'Member Profile';

  const content = document.getElementById('pageContent');
  const params = new URLSearchParams(window.location.search);
  const memberId = params.get('id');

  if (!memberId) {
    content.innerHTML = '<div class="alert alert-danger">No member specified.</div>';
    return;
  }

  content.innerHTML = `<div class="spinner-wrap"><div class="spinner-border text-primary"></div></div>`;

  try {
    const [memberRes, progressRes, workoutRes, attendanceRes] = await Promise.all([
      apiRequest(`/members/${memberId}`),
      apiRequest(`/fitness-progress?member=${memberId}`),
      apiRequest(`/workouts?member=${memberId}`),
      apiRequest(`/attendance/percentage/${memberId}`)
    ]);

    const m = memberRes.data;
    const progress = progressRes.data;
    const workouts = workoutRes.data;
    const attendancePct = attendanceRes.data.percentage;

    const bmiInfo = bmiCategory(m.bmi);
    const displayStatus = membershipDisplayStatus(m.membershipEndDate);

    content.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-3">
        <a href="/members.html" class="btn btn-outline-secondary btn-sm"><i class="bi bi-arrow-left"></i> Back to Members</a>
        <button class="btn btn-accent btn-sm" onclick="openAddProgress()"><i class="bi bi-plus-lg"></i> Log Progress</button>
      </div>

      <div class="row g-3">
        <div class="col-lg-4">
          <div class="profile-card">
            <img src="${m.photoUrl}" class="profile-photo" alt="${m.fullName}">
            <h5 class="fw-bold mb-0">${m.fullName}</h5>
            <div class="text-muted small mb-2">Member ID: ${m._id.slice(-8).toUpperCase()}</div>
            <span class="badge ${statusBadgeClass(displayStatus)} mb-3">${displayStatus}</span>

            <div class="row g-2 mb-3">
              <div class="col-6"><div class="metric-box"><div class="metric-value">${m.membershipPlan ? m.membershipPlan.planName : '-'}</div><div class="metric-label">Plan</div></div></div>
              <div class="col-6"><div class="metric-box"><div class="metric-value">${m.trainer ? m.trainer.name : 'None'}</div><div class="metric-label">Trainer</div></div></div>
              <div class="col-6"><div class="metric-box"><div class="metric-value">${m.weight || '-'} kg</div><div class="metric-label">Weight</div></div></div>
              <div class="col-6"><div class="metric-box"><div class="metric-value">${attendancePct}%</div><div class="metric-label">Attendance</div></div></div>
            </div>

            <table class="table table-borderless table-sm text-start mb-0">
              <tr><td class="text-muted">Email</td><td class="text-end">${m.email}</td></tr>
              <tr><td class="text-muted">Phone</td><td class="text-end">${m.phone}</td></tr>
              <tr><td class="text-muted">Gender</td><td class="text-end">${m.gender}</td></tr>
              <tr><td class="text-muted">DOB</td><td class="text-end">${formatDate(m.dob)}</td></tr>
              <tr><td class="text-muted">Emergency Contact</td><td class="text-end">${m.emergencyContact}</td></tr>
              <tr><td class="text-muted">Joining Date</td><td class="text-end">${formatDate(m.joiningDate)}</td></tr>
              <tr><td class="text-muted">Membership Expiry</td><td class="text-end">${formatDate(m.membershipEndDate)}</td></tr>
              <tr><td class="text-muted">Fitness Goal</td><td class="text-end">${m.fitnessGoal}</td></tr>
            </table>
          </div>
        </div>

        <div class="col-lg-8">
          <div class="content-card mb-3">
            <h6 class="fw-bold mb-3"><i class="bi bi-speedometer text-primary"></i> BMI Calculator</h6>
            <div class="row g-2 align-items-end mb-3">
              <div class="col-md-4"><label class="form-label small">Weight (kg)</label><input type="number" step="0.1" class="form-control" id="bmiWeight" value="${m.weight || ''}"></div>
              <div class="col-md-4"><label class="form-label small">Height (cm)</label><input type="number" step="0.1" class="form-control" id="bmiHeight" value="${m.height || ''}"></div>
              <div class="col-md-4"><button class="btn btn-primary-custom w-100" onclick="calculateBMI()">Calculate BMI</button></div>
            </div>
            <div id="bmiResult">
              <div class="d-flex justify-content-between mb-1">
                <span class="fw-semibold">BMI: <span id="bmiValueDisplay">${m.bmi || '-'}</span></span>
                <span class="fw-semibold" id="bmiCategoryDisplay" style="color:${bmiInfo.color}">${bmiInfo.label}</span>
              </div>
              <div class="bmi-bar-wrap"><div class="bmi-bar-fill" id="bmiBarFill" style="width:${m.bmi ? Math.min(100, (m.bmi / 40) * 100) : 0}%; background:${bmiInfo.color};"></div></div>
              <div class="d-flex justify-content-between text-muted small mt-1">
                <span>Underweight &lt;18.5</span><span>Normal 18.5-25</span><span>Overweight 25-30</span><span>Obese &gt;30</span>
              </div>
            </div>
          </div>

          <div class="content-card mb-3">
            <h6 class="fw-bold mb-3"><i class="bi bi-graph-up-arrow text-success"></i> Fitness Progress (Weight Trend)</h6>
            ${progress.length ? '<canvas id="progressChart" height="90"></canvas>' : '<p class="text-muted">No progress records yet. Click "Log Progress" to add the first entry.</p>'}
          </div>

          <div class="content-card">
            <h6 class="fw-bold mb-3"><i class="bi bi-clipboard2-pulse-fill text-warning"></i> Workout Plans</h6>
            ${workouts.length ? workouts.map(w => `
              <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                <div>
                  <a href="/workouts.html?planId=${w._id}" class="fw-semibold text-decoration-none">${w.planName}</a>
                  <div class="text-muted small">${w.goal} &middot; ${w.difficulty} &middot; ${w.exercises.length} exercises</div>
                </div>
                <span class="badge ${w.status === 'Active' ? 'badge-status-active' : 'bg-secondary'}">${w.status}</span>
              </div>
            `).join('') : '<p class="text-muted mb-0">No workout plans assigned yet. <a href="/workouts.html">Create one</a>.</p>'}
          </div>
        </div>
      </div>
    `;

    if (progress.length) {
      new Chart(document.getElementById('progressChart'), {
        type: 'line',
        data: {
          labels: progress.map(p => formatDate(p.date)),
          datasets: [{ label: 'Weight (kg)', data: progress.map(p => p.weight), borderColor: '#1e3a5f', backgroundColor: 'rgba(30,58,95,0.1)', fill: true, tension: 0.3 }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }

    window.currentMemberId = memberId;
  } catch (err) {
    content.innerHTML = `<div class="alert alert-danger">Error loading member profile: ${err.message}</div>`;
  }
})();

function calculateBMI() {
  const weight = parseFloat(document.getElementById('bmiWeight').value);
  const height = parseFloat(document.getElementById('bmiHeight').value);

  if (!weight || !height) {
    showToast('Please enter both weight and height.', 'error');
    return;
  }

  const heightM = height / 100;
  const bmi = Number((weight / (heightM * heightM)).toFixed(1));
  const info = bmiCategory(bmi);

  document.getElementById('bmiValueDisplay').textContent = bmi;
  document.getElementById('bmiCategoryDisplay').textContent = info.label;
  document.getElementById('bmiCategoryDisplay').style.color = info.color;
  document.getElementById('bmiBarFill').style.width = Math.min(100, (bmi / 40) * 100) + '%';
  document.getElementById('bmiBarFill').style.background = info.color;
}

function openAddProgress() {
  window.location.href = `/progress.html?member=${window.currentMemberId}`;
}
