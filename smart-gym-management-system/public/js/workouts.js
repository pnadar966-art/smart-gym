let workoutModalInstance;
let allMembersForWorkout = [];
let allTrainersForWorkout = [];
let exerciseRowCount = 0;

(async function init() {
  const ok = await requireLogin();
  if (!ok) return;

  renderLayout('workouts');
  document.getElementById('pageHeading').textContent = 'Workout Plans';

  workoutModalInstance = new bootstrap.Modal(document.getElementById('workoutModal'));

  renderPageShell();
  await loadDropdowns();
  await loadWorkouts();

  document.getElementById('workoutForm').addEventListener('submit', saveWorkout);

  // Support deep-link from member profile: /workouts.html?planId=xxx opens detail view
  const params = new URLSearchParams(window.location.search);
  const planId = params.get('planId');
  if (planId) viewWorkout(planId);
})();

function renderPageShell() {
  const content = document.getElementById('pageContent');
  content.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h4 class="page-title mb-0">Workout Plan Management</h4>
      <button class="btn btn-accent" onclick="openAddWorkout()"><i class="bi bi-plus-lg"></i> Create Workout Plan</button>
    </div>
    <div class="row g-3" id="workoutCardsRow">
      <div class="col-12 text-center text-muted py-4"><div class="spinner-border text-primary"></div></div>
    </div>
    <div id="workoutDetailArea" class="mt-4"></div>
  `;
}

async function loadDropdowns() {
  const [membersRes, trainersRes] = await Promise.all([apiRequest('/members'), apiRequest('/trainers')]);
  allMembersForWorkout = membersRes.data;
  allTrainersForWorkout = trainersRes.data;

  document.getElementById('wMember').innerHTML = '<option value="">Select Member</option>' +
    allMembersForWorkout.map(m => `<option value="${m._id}">${m.fullName}</option>`).join('');
  document.getElementById('wTrainer').innerHTML = '<option value="">Select Trainer</option>' +
    allTrainersForWorkout.map(t => `<option value="${t._id}">${t.name}</option>`).join('');
}

async function loadWorkouts() {
  const row = document.getElementById('workoutCardsRow');
  try {
    const res = await apiRequest('/workouts');
    const plans = res.data;

    if (!plans.length) {
      row.innerHTML = '<div class="col-12 text-center text-muted py-4">No workout plans yet.</div>';
      return;
    }

    row.innerHTML = plans.map(w => `
      <div class="col-md-6 col-lg-4">
        <div class="content-card h-100">
          <div class="d-flex justify-content-between align-items-start">
            <h6 class="fw-bold mb-1">${w.planName}</h6>
            <span class="badge ${w.status === 'Active' ? 'badge-status-active' : 'bg-secondary'}">${w.status}</span>
          </div>
          <div class="text-muted small mb-2">${w.member ? w.member.fullName : '-'} &middot; Trainer: ${w.trainer ? w.trainer.name : '-'}</div>
          <div class="mb-2"><span class="badge bg-light text-dark border">${w.goal}</span> <span class="badge bg-light text-dark border">${w.difficulty}</span></div>
          <div class="text-muted small mb-3">${w.exercises.length} exercises &middot; ${formatDate(w.startDate)} - ${formatDate(w.endDate)}</div>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="viewWorkout('${w._id}')"><i class="bi bi-eye"></i> View</button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteWorkout('${w._id}')"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      </div>`).join('');
  } catch (err) {
    row.innerHTML = `<div class="col-12"><div class="alert alert-danger">Error: ${err.message}</div></div>`;
  }
}

async function viewWorkout(id) {
  const area = document.getElementById('workoutDetailArea');
  area.innerHTML = `<div class="spinner-wrap"><div class="spinner-border text-primary"></div></div>`;
  try {
    const res = await apiRequest(`/workouts/${id}`);
    const w = res.data;

    area.innerHTML = `
      <div class="content-card">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 class="fw-bold mb-0">${w.planName}</h5>
            <div class="text-muted">For ${w.member ? w.member.fullName : '-'} by ${w.trainer ? w.trainer.name : '-'}</div>
          </div>
          <button class="btn btn-sm btn-outline-secondary" onclick="document.getElementById('workoutDetailArea').innerHTML=''">Close</button>
        </div>
        <div class="row g-3">
          ${w.exercises.map(ex => `
            <div class="col-md-4">
              <div class="exercise-card">
                <img src="${ex.imageUrl}" alt="${ex.exerciseName}">
                <div class="exercise-body">
                  <h6 class="fw-bold mb-1">${ex.exerciseName}</h6>
                  <div class="text-muted small mb-1">Target: ${ex.targetMuscle}</div>
                  <div class="small">${ex.sets} sets &times; ${ex.reps} reps ${ex.durationMinutes ? `(${ex.durationMinutes} min)` : ''}</div>
                  <div class="text-muted small">Rest: ${ex.restSeconds}s</div>
                  ${ex.notes ? `<div class="text-muted small fst-italic mt-1">${ex.notes}</div>` : ''}
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>
    `;
    area.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    area.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
}

function openAddWorkout() {
  document.getElementById('workoutForm').reset();
  document.getElementById('wStartDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('exercisesContainer').innerHTML = '';
  exerciseRowCount = 0;
  addExerciseRow();
  workoutModalInstance.show();
}

function addExerciseRow() {
  exerciseRowCount++;
  const container = document.getElementById('exercisesContainer');
  const rowId = `ex-row-${exerciseRowCount}`;
  const div = document.createElement('div');
  div.className = 'row g-2 mb-2 align-items-end border-bottom pb-2';
  div.id = rowId;
  div.innerHTML = `
    <div class="col-md-3"><label class="form-label small">Exercise Name</label><input type="text" class="form-control form-control-sm ex-name" required></div>
    <div class="col-md-2"><label class="form-label small">Target Muscle</label><input type="text" class="form-control form-control-sm ex-muscle" placeholder="Chest, Legs..." required></div>
    <div class="col-md-1"><label class="form-label small">Sets</label><input type="number" min="1" class="form-control form-control-sm ex-sets" value="3" required></div>
    <div class="col-md-1"><label class="form-label small">Reps</label><input type="number" min="1" class="form-control form-control-sm ex-reps" value="10" required></div>
    <div class="col-md-2"><label class="form-label small">Rest (sec)</label><input type="number" min="0" class="form-control form-control-sm ex-rest" value="60"></div>
    <div class="col-md-2"><label class="form-label small">Notes</label><input type="text" class="form-control form-control-sm ex-notes"></div>
    <div class="col-md-1"><button type="button" class="btn btn-sm btn-outline-danger" onclick="document.getElementById('${rowId}').remove()"><i class="bi bi-trash"></i></button></div>
  `;
  container.appendChild(div);
}

async function saveWorkout(e) {
  e.preventDefault();

  const exercises = [];
  document.querySelectorAll('#exercisesContainer > div').forEach(row => {
    exercises.push({
      exerciseName: row.querySelector('.ex-name').value.trim(),
      targetMuscle: row.querySelector('.ex-muscle').value.trim(),
      sets: Number(row.querySelector('.ex-sets').value),
      reps: Number(row.querySelector('.ex-reps').value),
      restSeconds: Number(row.querySelector('.ex-rest').value) || 60,
      notes: row.querySelector('.ex-notes').value.trim()
    });
  });

  if (!exercises.length) {
    showToast('Please add at least one exercise.', 'error');
    return;
  }

  const payload = {
    planName: document.getElementById('wPlanName').value.trim(),
    member: document.getElementById('wMember').value,
    trainer: document.getElementById('wTrainer').value,
    goal: document.getElementById('wGoal').value,
    difficulty: document.getElementById('wDifficulty').value,
    startDate: document.getElementById('wStartDate').value,
    endDate: document.getElementById('wEndDate').value,
    exercises
  };

  try {
    await apiRequest('/workouts', { method: 'POST', body: payload });
    showToast('Workout plan created successfully.');
    workoutModalInstance.hide();
    loadWorkouts();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteWorkout(id) {
  if (!confirm('Are you sure you want to delete this workout plan?')) return;
  try {
    await apiRequest(`/workouts/${id}`, { method: 'DELETE' });
    showToast('Workout plan deleted.');
    document.getElementById('workoutDetailArea').innerHTML = '';
    loadWorkouts();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
