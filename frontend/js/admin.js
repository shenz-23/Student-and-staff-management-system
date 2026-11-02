// SSMS Admin UI: Existing backend endpoints are used where supported.
// Other actions are deliberately labelled as previews until APIs exist.
const API = 'http://localhost:8000/api/v1/users';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const token = localStorage.getItem('token');
let savedUser = {};
try { savedUser = JSON.parse(localStorage.getItem('user') || '{}') || {}; } catch { savedUser = {}; }

function showStatus(message, error = false) {
  const el = $('#statusMessage');
  if (!el) return;
  el.hidden = false;
  el.classList.toggle('error', error);
  el.textContent = message;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function signOut() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  location.href = document.body.dataset.page === 'overview' ? 'login.html' : '../login.html';
}
$('#adminSignout')?.addEventListener('click', e => { e.preventDefault(); signOut(); });
if (!token || savedUser.role !== 'admin') {
  showStatus('Admin sign-in is required. Please sign in with an admin account.', true);
  // Avoid displaying restricted pages to unauthenticated users.
  document.querySelector('.content')?.replaceChildren();
  location.replace(document.body.dataset.page === 'overview' ? 'login.html' : '../login.html');
} else {
  const display = [savedUser.firstName, savedUser.lastName].filter(Boolean).join(' ') || savedUser.email?.split('@')[0] || 'Admin';
  $$('[data-admin-name]').forEach(el => el.textContent = display);
  $$('[data-admin-first]').forEach(el => el.textContent = savedUser.firstName || display.split(' ')[0]);
  $$('[data-admin-initials]').forEach(el => el.textContent = display.split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase());
  $$('[data-admin-id]').forEach(el => el.textContent = `Admin · ${savedUser.user_id ?? 'Account'}`);
}
async function api(path, options = {}) {
  const headers = { Authorization: `Bearer ${token}`, ...options.headers };
  const response = await fetch(API + path, { ...options, headers });
  if (response.status === 401) { signOut(); throw new Error('Session expired'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}
$$('[data-demo]').forEach(b => b.addEventListener('click', () => showStatus(`${b.dataset.demo} is a preview only. A secure backend endpoint is required before this action can be completed.`)));
$$('[data-tab]').forEach(b => b.addEventListener('click', () => {
  $$('[data-tab]').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  showStatus(`${b.textContent} selected. The configuration sections are displayed below.`);
}));
function addCell(tr, text) { const td = document.createElement('td'); td.textContent = String(text ?? '—'); tr.append(td); return td; }
function emptyRow(tbody, count, message) { tbody.replaceChildren(); const tr = document.createElement('tr'); const td = addCell(tr, message); td.colSpan = count; tbody.append(tr); }

async function loadUsers() {
  const directory = $('#userDirectory tbody');
  if (!directory) return;
  // Existing /students route is lecturer-only. Do not call it as admin.
  emptyRow(directory, 5, 'The admin user-directory endpoint has not been created yet.');
  $('#userCount').textContent = '—';
}

$('#createAccount')?.addEventListener('submit', async e => {
  e.preventDefault();
  const get = id => document.getElementById(id).value.trim();
  const payload = {
    role: get('newRole'), id: Number(get('newId')),
    firstName: get('newFirst'), lastName: get('newLast'),
    email: get('newEmail'), password: get('newPassword'),
    contactNo: get('newContact') || null, qualification: get('newQualification') || null
  };
  if (!Number.isInteger(payload.id) || payload.id <= 0 || !payload.firstName || !payload.lastName || !payload.email || payload.password.length < 8) {
    showStatus('Enter a positive numeric ID, names, email and a password of at least 8 characters.', true);
    return;
  }
  try {
    const result = await api('/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    showStatus(result.message || 'Account created successfully.');
    e.target.reset();
  } catch (err) { showStatus(err.message, true); }
});

$('#saveClassDraft')?.addEventListener('click', () => {
  const ids = ['classCourse','classCohort','classLecturer','classDate','classRoom','classStart','classEnd','classReason'];
  const draft = Object.fromEntries(ids.map(id => [id, document.getElementById(id).value]));
  localStorage.setItem('ssms-admin-class-draft', JSON.stringify(draft));
  updateDraftPreview();
  showStatus('Class draft saved in this browser only. It has not been published.');
});
$('#discardClassDraft')?.addEventListener('click', () => {
  localStorage.removeItem('ssms-admin-class-draft');
  $('#classForm')?.reset(); updateDraftPreview();
  showStatus('Local draft discarded.');
});
function updateDraftPreview() {
  const target = $('#classDraftPreview'); if (!target) return;
  const raw = localStorage.getItem('ssms-admin-class-draft');
  if (!raw) { target.textContent = 'No draft saved.'; return; }
  try {
    const d = JSON.parse(raw);
    target.textContent = `${d.classCourse || 'Unnamed class'} · ${d.classDate || 'Date not set'} · ${d.classStart || '?'}–${d.classEnd || '?'} · ${d.classRoom || 'Room not set'} (local draft)`;
  } catch { target.textContent = 'Draft could not be read.'; }
}
updateDraftPreview();

$('#saveSettings')?.addEventListener('click', () => {
  const form = $('#settingsForm');
  if (!form) return;
  const settings = Object.fromEntries([...form.querySelectorAll('input,select')].map(el => [el.id, el.value]));
  localStorage.setItem('ssms-admin-local-settings', JSON.stringify(settings));
  showStatus('Configuration saved in this browser only. Server settings have not changed.');
});
try {
  const saved = JSON.parse(localStorage.getItem('ssms-admin-local-settings') || '{}');
  Object.entries(saved).forEach(([id, value]) => { const el = document.getElementById(id); if (el) el.value = value; });
} catch { /* Ignore malformed browser storage. */ }

$('#saveSupportNote')?.addEventListener('click', () => {
  localStorage.setItem('ssms-admin-support-note', $('#supportReply')?.value || '');
  showStatus('Support note saved in this browser only. It is not attached to a support ticket.');
});
if ($('#supportReply')) $('#supportReply').value = localStorage.getItem('ssms-admin-support-note') || '';

async function loadStudentPreview() {
  const tbody = $('#studentAttendanceTable tbody');
  if (!tbody) return;
  // No admin-authorized attendance API yet; never show fabricated attendance.
  emptyRow(tbody, 3, 'Attendance register is not connected to an admin-authorized endpoint.');
}

async function checkAPI() {
  if (!$('#apiStatus')) return;
  try {
    // This route is already present and enforces lecturer role; 403 still confirms API connectivity.
    const response = await fetch(API + '/lecturer/dashboard', { headers: { Authorization: `Bearer ${token}` } });
    $('#apiStatus').textContent = response.status === 403 || response.ok ? 'Reachable' : `HTTP ${response.status}`;
  } catch { $('#apiStatus').textContent = 'Not reachable'; }
}


/* ===================================
   LOAD ADMIN PROFILE FROM DATABASE
=================================== */

async function loadAdminProfile() {
    const token = localStorage.getItem("token");

    if (!token) {
        console.log("No login token found");
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:8000/api/v1/users/admin/dashboard",
            {
                method: "GET",
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            console.log("Failed to load admin profile");
            return;
        }

        const data = await response.json();
        const admin = data.admin;

        // Display admin name
        document.querySelectorAll(
            "[data-admin-name]"
        ).forEach(element => {
            element.textContent = admin.name;
        });

        // Display admin ID
        document.querySelectorAll(
            "[data-admin-id]"
        ).forEach(element => {
            element.textContent = admin.user_id;
        });

        // Display first name
        const firstName = admin.name.split(" ")[0];

        document.querySelectorAll(
            "[data-admin-first]"
        ).forEach(element => {
            element.textContent = firstName;
        });

        // Display initials
        const initials = admin.name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase();

        document.querySelectorAll(
            "[data-admin-initials]"
        ).forEach(element => {
            element.textContent = initials;
        });

        console.log("Admin profile loaded");

    } catch (error) {
        console.error("Error loading admin profile:", error);
    }
}

document.addEventListener(
    "DOMContentLoaded",
    loadAdminProfile
);


loadUsers();
loadStudentPreview();
checkAPI();
