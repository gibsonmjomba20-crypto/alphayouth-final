
/* ============================================================
   1. NAVIGATION
   ============================================================ */
const navToggle = document.getElementById('navToggle');
const primaryNav = document.getElementById('primary-nav');
if (navToggle && primaryNav) {
  navToggle.addEventListener('click', () => {
    primaryNav.classList.toggle('is-open');
  });
  document.querySelectorAll('.primary-nav a').forEach(l => l.addEventListener('click', () => {
    primaryNav.classList.remove('is-open');
  }));
}

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ============================================================
   2. SUPABASE & EMAILJS CONFIGURATION
   ============================================================ */
const SUPABASE_URL = 'https://ypqdqmufpivadajfdray.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwcWRxbXVmcGl2YWRhamZkcmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTc4MjcsImV4cCI6MjEwNzEzMzgyN30.fLRevN6W6OdH5TFutZxJD3k-649Uqip7LelX3SaD0qc';
const EMAILJS_PUBLIC_KEY = 'h4RUt-gFhN2E5xoVx';
const EMAILJS_SERVICE_ID = 'service_zs9ztak';
const EMAILJS_TEMPLATE_ID = 'template_77xb6gk';

let supabaseClient = null;
if (window.supabase) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
if (window.emailjs) emailjs.init(EMAILJS_PUBLIC_KEY);

/* ============================================================
   3. DYNAMIC PUBLIC PROGRESS BAR (Target: 1000)
   ============================================================ */
async function updatePublicProgress() {
  if (!supabaseClient) return;
  const { count, error } = await supabaseClient.from('members').select('*', { count: 'exact', head: true });
  
  if (!error && count !== null) {
    const target = 1000;
    const percentage = Math.min((count / target) * 100, 100).toFixed(1);
    
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('progressText');
    const pctText = document.getElementById('targetPercentage');
    
    if(fill) fill.style.width = percentage + '%';
    if(text) text.textContent = `${count} / 1,000 members`;
    if(pctText) pctText.textContent = percentage + '%';
  }
}
// Run on load
document.addEventListener('DOMContentLoaded', updatePublicProgress);

/* ============================================================
   4. PORTAL & DASHBOARD LOGIC
   ============================================================ */
const tabApply = document.getElementById('tabApply');
const tabLogin = document.getElementById('tabLogin');
const applySection = document.getElementById('applySection');
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');

if (tabApply && tabLogin) {
  function switchTab(tab) {
    applySection.classList.remove('active');
    loginSection.classList.remove('active');
    dashboardSection.classList.remove('active');
    tabApply.classList.remove('active');
    tabLogin.classList.remove('active');
    
    if(tab === 'apply') { applySection.classList.add('active'); tabApply.classList.add('active'); } 
    else { loginSection.classList.add('active'); tabLogin.classList.add('active'); }
  }
  tabApply.addEventListener('click', () => switchTab('apply'));
  tabLogin.addEventListener('click', () => switchTab('login'));

  // --- REGISTRATION ---
  document.getElementById('applyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!supabaseClient) return alert("Database connection failed.");
    
    const btn = document.getElementById('applyBtn');
    const name = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const id = document.getElementById('nationalId').value;
    const dobValue = document.getElementById('dob').value;
    const roleValue = document.getElementById('role').value;
    const err = document.getElementById('applyError');
    const success = document.getElementById('applySuccess');
    
    err.style.display = 'none';
    success.style.display = 'none';
    btn.textContent = 'Submitting...';
    btn.disabled = true;

    const age = new Date().getFullYear() - new Date(dobValue).getFullYear();
    if(age < 18) {
      err.textContent = 'You must be 18 years or older to join.';
      err.style.display = 'block';
      btn.textContent = 'Submit Application';
      btn.disabled = false;
      return;
    }

    const code = 'AYG-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Save to DB
    const { data, error } = await supabaseClient
      .from('members')
      .insert([{ full_name: name, email: email, national_id: id, dob: dobValue, membership_code: code, role: roleValue }]);

    if (error) {
      err.textContent = error.code === '23505' ? 'This National ID is already registered.' : 'Error: ' + error.message;
      err.style.display = 'block';
      btn.textContent = 'Submit Application';
      btn.disabled = false;
      return;
    } 

    // Send Email
    try {
      if (window.emailjs) {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_name: name, to_email: email, membership_code: code,
          dashboard_link: window.location.href
        });
      }
      success.textContent = 'Registration successful! Your Membership Code has been sent to your email.';
      success.style.display = 'block';
      document.getElementById('applyForm').reset();
      updatePublicProgress(); // Update progress bar instantly!
    } catch (emailError) {
      console.error(emailError);
      alert("Email delivery failed. Reason: " + (emailError.text || emailError.message));
      success.textContent = 'Registration saved, but email failed. Contact us at info@alphayouthgroup.co.ke';
      success.style.display = 'block';
      document.getElementById('applyForm').reset();
      updatePublicProgress();
    }
    
    btn.textContent = 'Submit Application';
    btn.disabled = false;
  });

  // --- LOGIN ---
  document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!supabaseClient) return alert("Database connection failed.");
    
    const btn = document.getElementById('loginBtn');
    const inputCode = document.getElementById('loginCode').value.trim().toUpperCase();
    const err = document.getElementById('loginError');
    
    err.style.display = 'none';
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    const { data, error } = await supabaseClient
      .from('members')
      .select('full_name, role')
      .eq('membership_code', inputCode)
      .single();

    if (error || !data) {
      err.textContent = 'Invalid Membership Code.';
      err.style.display = 'block';
      btn.textContent = 'Log In';
      btn.disabled = false;
    } else {
      btn.textContent = 'Log In';
      btn.disabled = false;
      showDashboard(data.full_name, data.role, "Welcome back!");
    }
  });
}

// --- SHOW DASHBOARD ---
function showDashboard(name, role, msg) {
  applySection.classList.remove('active');
  loginSection.classList.remove('active');
  document.querySelector('.portal-tabs').style.display = 'none'; 
  dashboardSection.classList.add('active');

  document.getElementById('memberDashboard').style.display = 'none';
  document.getElementById('chairmanDashboard').style.display = 'none';
  document.getElementById('secretaryDashboard').style.display = 'none';
  document.getElementById('treasurerDashboard').style.display = 'none';

  document.getElementById('dashTitle').textContent = `Welcome, ${name.split(' ')[0]}!`;
  document.getElementById('dashMessage').textContent = msg;

  const displayRole = role || 'Member';
  if (displayRole === 'Chairman') {
    document.getElementById('chairmanDashboard').style.display = 'block';
    loadChairmanData();
  } 
  else if (displayRole === 'Secretary') {
    document.getElementById('secretaryDashboard').style.display = 'block';
    loadSecretaryData();
  } 
  else if (displayRole === 'Treasurer') {
    document.getElementById('treasurerDashboard').style.display = 'block';
    loadTreasurerData();
  } 
  else {
    document.getElementById('memberDashboard').style.display = 'block';
  }
}

// --- FETCH REAL DATA ---
async function loadChairmanData() {
  const { count, error } = await supabaseClient.from('members').select('*', { count: 'exact', head: true });
  if (!error) document.getElementById('realMemberCount').textContent = count;
}

async function loadSecretaryData() {
  const list = document.getElementById('recentMembersList');
  list.innerHTML = '<li>Loading...</li>';
  const { data, error } = await supabaseClient.from('members').select('full_name, role').order('created_at', { ascending: false }).limit(5);
  
  list.innerHTML = '';
  if (!error && data && data.length > 0) {
    data.forEach(m => {
      list.innerHTML += `<li>${m.full_name} <span style="color: var(--primary); font-size: 0.75rem;">${m.role}</span></li>`;
    });
  } else {
    list.innerHTML = '<li>No members found.</li>';
  }
}

async function loadTreasurerData() {
  const { count, error } = await supabaseClient.from('members').select('*', { count: 'exact', head: true });
  if (!error) {
    const total = count * 1000;
    document.getElementById('realTotalFees').textContent = 'KES ' + total.toLocaleString();
  }
}

function resetPortal() {
  document.querySelector('.portal-tabs').style.display = 'flex';
  document.getElementById('applyForm').reset();
  document.getElementById('loginForm').reset();
  document.getElementById('applyError').style.display = 'none';
  document.getElementById('applySuccess').style.display = 'none';
  document.getElementById('loginError').style.display = 'none';
  switchTab('apply');
}
