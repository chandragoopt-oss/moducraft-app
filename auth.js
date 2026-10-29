// ==========================================
// LOGIN & AUTHENTICATION LOGIC
// ==========================================
if (localStorage.getItem('mc_token')) {
  document.getElementById('loginOverlay').style.display = 'none';
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginError');
  
  if (!email || !pass) {
    err.textContent = "Please enter both email and password.";
    err.style.display = 'block';
    return;
  }

  btn.textContent = "Logging in...";
  btn.disabled = true;
  err.style.display = 'none';

  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbwgMExM7rKaDkJ4-LvUnb_HLpO4TL4-CKDkNEzuSWLiExCetpAT0sox2A1_-NL9clRM/exec", {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'login', email: email, password: pass })
    });
    const data = await res.json();

    if (data.ok) {
      localStorage.setItem('mc_token', data.token);
      localStorage.setItem('mc_user_email', email);
      localStorage.setItem('mc_user_role', data.role);
      localStorage.setItem('mc_user_name', data.name || email.split('@')[0]);
            // Sync role to the Department Lock used by custom.js
      const userRole = String(data.role || '').toLowerCase();
      if (userRole === 'admin') {
        localStorage.setItem('msq_dept', 'admin');
      } else if (['sales', 'design', 'purchase', 'accounts'].includes(userRole)) {
        localStorage.setItem('msq_dept', userRole);
      } else {
        localStorage.removeItem('msq_dept'); // Let custom.js use its safe default (Sales)
      }
      if (data.role === 'admin') {
        document.getElementById('adminUsersBtn').style.display = 'inline-block';
      }
      document.getElementById('loginOverlay').style.display = 'none';
    } else {
      err.textContent = data.message || "Login failed.";
      err.style.display = 'block';
      btn.textContent = "Log In";
      btn.disabled = false;
    }
  } catch (error) {
    err.textContent = "Network error. Please try again.";
    err.style.display = 'block';
    btn.textContent = "Log In";
    btn.disabled = false;
  }
});

// Allow pressing Enter in the password field to log in
document.getElementById('loginPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

// ==========================================
// ADMIN & LOGOUT LOGIC
// ==========================================
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('mc_token');
  localStorage.removeItem('mc_user_email');
  localStorage.removeItem('mc_user_role');
  
  const KEEP = new Set(['msq_dev','msq_lic','msq_lic_seq','msq_lic_floor','msq_lic_name','msq_seen','msq_owner_key']);
  Object.keys(localStorage)
    .filter(k => k.startsWith('msq_') && !KEEP.has(k))
    .forEach(k => localStorage.removeItem(k));
    
  window.location.reload();
});

if (localStorage.getItem('mc_user_role') === 'admin') {
  document.getElementById('adminUsersBtn').style.display = 'inline-block';
}

document.getElementById('adminUsersBtn').addEventListener('click', () => {
  document.getElementById('adminUsersModal').style.display = 'flex';
  loadAdminUsers();
});

document.getElementById('closeAdminUsers').addEventListener('click', () => {
  document.getElementById('adminUsersModal').style.display = 'none';
});

const MC_API_URL = "https://script.google.com/macros/s/AKfycbwgMExM7rKaDkJ4-LvUnb_HLpO4TL4-CKDkNEzuSWLiExCetpAT0sox2A1_-NL9clRM/exec";

async function loadAdminUsers() {
  const box = document.getElementById('adminUsersList');
  box.innerHTML = '<p style="color:#666">Loading users...</p>';
  
  try {
    const res = await fetch(MC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'listUsers', token: localStorage.getItem('mc_token') })
    });
    const data = await res.json();

    if (data.ok && data.users) {
      let html = `
        <div style="background:#f4f7f6; padding:12px; border-radius:6px; margin-bottom:15px; color:#333;">
          <b style="display:block; margin-bottom:8px;">Add New User</b>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <input id="newEmail" placeholder="Email address" style="flex:1; min-width:150px; padding:8px; border:1px solid #ccc; border-radius:4px; color:#333;">
            <input id="newPass" placeholder="Password" type="password" style="flex:1; min-width:150px; padding:8px; border:1px solid #ccc; border-radius:4px; color:#333;">
                       <select id="newRole" style="padding:8px; border:1px solid #ccc; border-radius:4px; color:#333;">
              <option value="admin">👑 Admin View (Full)</option>
              <option value="sales">💼 Sales & Quotes</option>
              <option value="design">📐 Design & Site</option>
              <option value="purchase">📦 Purchase & Factory</option>
              <option value="accounts">💰 Accounts</option>
            </select>
            <button onclick="addAdminUser()" style="background:#1976d2; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Add</button>
          </div>
          <div id="addUserMsg" style="color:#d32f2f; font-size:12px; margin-top:5px;"></div>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:14px; color:#333;">
          <tr style="background:#f4f7f6; text-align:left; color:#333;">
            <th style="padding:8px; border-bottom:2px solid #ddd;">Email</th>
            <th style="padding:8px; border-bottom:2px solid #ddd;">Role</th>
            <th style="padding:8px; border-bottom:2px solid #ddd;">Status</th>
            <th style="padding:8px; border-bottom:2px solid #ddd;">Action</th>
          </tr>`;
      
           data.users.forEach(u => {
        let roleLabel = u.role || 'user';
        if (roleLabel === 'admin') roleLabel = '👑 Admin';
        else if (roleLabel === 'sales') roleLabel = '💼 Sales';
        else if (roleLabel === 'design') roleLabel = '📐 Design';
        else if (roleLabel === 'purchase') roleLabel = '📦 Purchase';
        else if (roleLabel === 'accounts') roleLabel = '💰 Accounts';
        else roleLabel = '👤 User';

        const isActive = u.active === true || u.active === 'true';
        const statusColor = isActive ? '#2e7d32' : '#c62828';
        const statusText = isActive ? 'Active' : 'Restricted';
        const actionBtn = isActive 
          ? `<button onclick="toggleUserStatus('${u.email}', false)" style="background:#ef6c00; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:4px;">Restrict</button>`
          : `<button onclick="toggleUserStatus('${u.email}', true)" style="background:#2e7d32; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:4px;">Unrestrict</button>`;
        
        html += `<tr>
          <td style="padding:8px; border-bottom:1px solid #eee;">${u.email}</td>
                   <td style="padding:8px; border-bottom:1px solid #eee;">${roleLabel}</td>
          <td style="padding:8px; border-bottom:1px solid #eee; color:${statusColor}; font-weight:bold;">${statusText}</td>
          <td style="padding:8px; border-bottom:1px solid #eee;">
            ${actionBtn}
            <button onclick="deleteUser('${u.email}')" style="background:#c62828; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Delete</button>
          </td>
        </tr>`;
      });
      html += '</table>';
      box.innerHTML = html;
    } else if (data.ok) {
      box.innerHTML = '<p style="color:#333">No users found.</p>';
    } else {
      box.innerHTML = `<p style="color:#c00">Error: ${data.message || 'Could not load users'}</p>`;
    }
  } catch (e) {
    box.innerHTML = '<p style="color:#c00">Network error.</p>';
  }
}

async function addAdminUser() {
  const email = document.getElementById('newEmail').value;
  const password = document.getElementById('newPass').value;
  const role = document.getElementById('newRole').value;
  const msg = document.getElementById('addUserMsg');
  msg.textContent = "Adding...";

  const res = await fetch(MC_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'addUser', token: localStorage.getItem('mc_token'), email, password, role })
  });
  const data = await res.json();
  if (data.ok) {
    loadAdminUsers();
  } else {
    msg.textContent = data.message || 'Request failed';
  }
}

async function toggleUserStatus(email, active) {
  const res = await fetch(MC_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'setUserStatus', token: localStorage.getItem('mc_token'), email, active })
  });
  const data = await res.json();
  if (data.ok) loadAdminUsers();
  else alert(data.message || 'Request failed');
}

async function deleteUser(email) {
  if (!confirm("Are you sure you want to delete " + email + "?")) return;
  const res = await fetch(MC_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'deleteUser', token: localStorage.getItem('mc_token'), email })
  });
  const data = await res.json();
  if (data.ok) loadAdminUsers();
  else alert(data.message || 'Request failed');
}
