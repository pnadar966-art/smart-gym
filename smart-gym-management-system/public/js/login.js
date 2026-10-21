(async function checkExistingSession() {
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    const data = await res.json();
    if (data.loggedIn) window.location.href = '/dashboard.html';
  } catch (err) { /* ignore */ }
})();

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const alertBox = document.getElementById('alertBox');
  const loginBtn = document.getElementById('loginBtn');
  const loginBtnText = document.getElementById('loginBtnText');

  alertBox.classList.add('d-none');

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  loginBtn.disabled = true;
  loginBtnText.textContent = 'Logging in...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      window.location.href = '/dashboard.html';
    } else {
      alertBox.textContent = data.message || 'Login failed.';
      alertBox.classList.remove('d-none');
    }
  } catch (err) {
    alertBox.textContent = 'Server error. Please make sure the server is running and reachable.';
    alertBox.classList.remove('d-none');
  } finally {
    loginBtn.disabled = false;
    loginBtnText.textContent = 'Login';
  }
});
