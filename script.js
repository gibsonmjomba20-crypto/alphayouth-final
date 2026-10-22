/* ============================================================
   1. UI LOGIC (NAV)
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
const EMAILJS_PUBLIC_KEY = 'tcFhpPs9jeUwD9LbjID'; 
const EMAILJS_SERVICE_ID = 'service_zs9ztak';
const EMAILJS_TEMPLATE_ID = 'template_77xb6gk';

let supabaseClient = null;
if (window.supabase) supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
if (window.emailjs) emailjs.init(EMAILJS_PUBLIC_KEY);

/* ============================================================
   3. AI BOT LOGIC
   ============================================================ */
const aiFab = document.getElementById('aiFab'), aiPanel = document.getElementById('aiPanel');
const aiClose = document.getElementById('aiClose'), aiMessages = document.getElementById('aiMessages');
const aiForm = document.getElementById('aiForm'), aiInput = document.getElementById('aiInput');

if (aiFab && aiPanel) {
  aiFab.addEventListener('click', () => {
    aiPanel.hidden = !aiPanel.hidden;
    if(!aiPanel.hidden && !aiMessages.children.length) addMsg('Hi! I am the Alpha AI assistant. Ask me about joining, fees, or requirements!', 'bot');
  });
  aiClose.addEventListener('click', () => aiPanel.hidden = true);

  function addMsg(text, who) {
    const div = document.createElement('div'); div.className = 'ai-msg ' + who; div.textContent = text;
    aiMessages.appendChild(div); aiMessages.scrollTop = aiMessages.scrollHeight;
  }
  
  aiForm.addEventListener('submit', e => {
    e.preventDefault(); const text = aiInput.value.trim(); if(!text) return;
    addMsg(text, 'user'); aiInput.value = '';
    
    setTimeout(() => {
      const q = text.toLowerCase();
      let reply = 'I am still learning! Please contact Joy on 0704 785 116 for specific questions.';
      
      if(q.includes('join') || q.includes('apply') || q.includes('register')) {
        reply = 'To join, scroll down to the Member Portal, fill out the "Apply Now" form, and make sure to pay the 1000 KES fee.';
      } else if(q.includes('fee') || q.includes('cost') || q.includes('pay') || q.includes('1000')) {
        reply = 'The registration fee is 1000 KES. You must confirm payment in the application form before submitting.';
      } else if(q.includes('require') || q.includes('need') || q.includes('18')) {
        reply = 'You must be 18 years or older and have a valid Kenyan National ID to apply.';
      } else if(q.includes('code') || q.includes('login') || q.includes('dashboard')) {
        reply = 'Once you apply and pay, you will receive a unique Membership Code (e.g., AYG-XXXXX). Use that code in the Login tab to access your dashboard.';
      } else if(q.includes('where') || q.includes('location')) {
        reply = 'We are based in Voi, Taita Taveta County, Kenya.';
      } else if(q.includes('hello') || q.includes('hi') || q.includes('hey')) {
        reply = 'Hello! How can I help you today? Ask me about joining Alpha Youth.';
      }
      
      addMsg(reply, 'bot');
    }, 600);
  });
}

/* ============================================================
   4. PORTAL & ROLE MANAGEMENT LOGIC
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
    
    if(tab === 'apply') {
      applySection.classList.add('active');
      tabApply.classList.add('active');
    } else if(tab === 'login') {
      loginSection.classList.add('active');
      tabLogin.classList.add('active');
    }
  }
  tabApply.addEventListener('click', () => switchTab('apply'));
  tabLogin.addEventListener('click', () => switchTab('login'));

  // Handle Registration
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

    const { data, error } = await supabaseClient
      .from('members')
      .insert([{ full_name: name, email: email, national_id: id, dob: dobValue, membership_code: code, role: roleValue }]);

    if (error) {
      if (error.code === '23505') err.textContent = 'This National ID is already registered.';
      else err.textContent = 'Error: ' + error.message;
      err.style.display = 'block';
      btn.textContent = 'Submit Application';
      btn.disabled = false;
      return;
    } 

    try {
      if (window.emailjs) {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_name: name, to_email: email, membership_code: code,
          dashboard_link: window.location.origin + window.location.pathname + "#join"
        });
      }
      success.textContent = 'Registration successful! Check your email for your code.';
      success.style.display = 'block';
      setTimeout(() => showDashboard(name, code, roleValue, "Registration Successful!"), 1500);
    } catch (emailError) {
      success.textContent = 'Registration successful! (Email failed, check your code below).';
      success.style.display = 'block';
      setTimeout(() => showDashboard(name, code, roleValue, "Registration Successful!"), 1500);
    }
    
    btn.textContent = 'Submit Application';
    btn.disabled = false;
  });

  // Handle Login
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
      .select('full_name, membership_code, role')
      .eq('membership_code', inputCode)
      .single();

    if (error || !data) {
      err.textContent = 'Invalid Membership Code. Check and try again.';
      err.style.display = 'block';
      btn.textContent = 'Log In';
      btn.disabled = false;
    } else {
      btn.textContent = 'Log In';
      btn.disabled = false;
      showDashboard(data.full_name, data.membership_code, data.role, "Welcome back!");
    }
  });
}

// --- SHOW DASHBOARD APP (ROLE ROUTER) ---
function showDashboard(name, code, role, msg) {
  applySection.classList.remove('active');
  loginSection.classList.remove('active');
  document.querySelector('.portal-tabs').style.display = 'none'; 
  
  dashboardSection.classList.add('active');

  // Hide ALL dashboards by default
  document.getElementById('memberDashboard').style.display = 'none';
  document.getElementById('chairmanDashboard').style.display = 'none';
  document.getElementById('secretaryDashboard').style.display = 'none';
  document.getElementById('treasurerDashboard').style.display = 'none';

  // Fill in basic info
  if(document.getElementById('dashTitle')) document.getElementById('dashTitle').textContent = `Welcome, ${name.split(' ')[0]}!`;
  if(document.getElementById('dashMessage')) document.getElementById('dashMessage').textContent = msg;
  if(document.getElementById('dashCode')) document.getElementById('dashCode').textContent = code;

  // ROUTING LOGIC
  const displayRole = role || 'Member';
  
  if (displayRole === 'Chairman') {
    document.getElementById('chairmanDashboard').style.display = 'block';
  } 
  else if (displayRole === 'Secretary') {
    document.getElementById('secretaryDashboard').style.display = 'block';
  } 
  else if (displayRole === 'Treasurer') {
    document.getElementById('treasurerDashboard').style.display = 'block';
  } 
  else {
    document.getElementById('memberDashboard').style.display = 'block';
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
