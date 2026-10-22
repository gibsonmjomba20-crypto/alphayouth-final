/* ============================================================
   1. SUPABASE & EMAILJS CONFIGURATION
   ============================================================ */
const SUPABASE_URL = 'https://ypqdqmufpivadajfdray.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwcWRxbXVmcGl2YWRhamZkcmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTc4MjcsImV4cCI6MjEwNzEzMzgyN30.fLRevN6W6OdH5TFutZxJD3k-649Uqip7LelX3SaD0qc';

// YOUR EMAILJS CREDENTIALS ARE NOW ADDED HERE
const EMAILJS_PUBLIC_KEY = 'tcFhpPs9jeUwD9LbjID'; 
const EMAILJS_SERVICE_ID = 'service_zs9ztak';
const EMAILJS_TEMPLATE_ID = 'template_77xb6gk';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
emailjs.init(EMAILJS_PUBLIC_KEY);

/* ============================================================
   2. UI LOGIC (NAV, REVEAL, COUNTERS)
   ============================================================ */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mobile Nav
const navToggle = document.getElementById('navToggle');
const primaryNav = document.getElementById('primary-nav');
navToggle.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!isOpen));
  primaryNav.classList.toggle('is-open', !isOpen);
});
document.querySelectorAll('.primary-nav a').forEach(l => l.addEventListener('click', () => {
  navToggle.setAttribute('aria-expanded', 'false');
  primaryNav.classList.remove('is-open');
}));

// Header & Top Button
const header = document.getElementById('siteHeader');
const toTop = document.getElementById('toTop');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 30);
  toTop.hidden = y < 600;
});
toTop.addEventListener('click', () => window.scrollTo({top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth'}));

// Reveal Animations
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(e => { if(e.isIntersecting){ e.target.classList.add('is-visible'); o.unobserve(e.target); }});
  }, { threshold: 0.12 });
  revealItems.forEach(el => obs.observe(el));
} else {
  revealItems.forEach(el => el.classList.add('is-visible'));
}

// Counters
const counters = document.querySelectorAll('[data-count]');
if ('IntersectionObserver' in window) {
  const cObs = new IntersectionObserver((entries, o) => {
    entries.forEach(e => {
      if(e.isIntersecting) {
        const el = e.target, target = +el.dataset.count, suf = el.dataset.suffix || '';
        let start = performance.now();
        function tick(now) {
          let p = Math.min((now - start) / 1500, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suf;
          if(p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        o.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => cObs.observe(el));
}

document.getElementById('year').textContent = new Date().getFullYear();

/* ============================================================
   3. AI BOT LOGIC
   ============================================================ */
const aiFab = document.getElementById('aiFab'), aiPanel = document.getElementById('aiPanel');
const aiClose = document.getElementById('aiClose'), aiMessages = document.getElementById('aiMessages');
const aiForm = document.getElementById('aiForm'), aiInput = document.getElementById('aiInput');

aiFab.addEventListener('click', () => {
  aiPanel.hidden = !aiPanel.hidden;
  if(!aiPanel.hidden && !aiMessages.children.length) addMsg('Hi! Ask me about joining, programs, or contact.', 'bot');
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
    let reply = 'I can help with membership, programs, location, and contact details. For anything else, contact Joy on 0704 785 116.';
    if(q.includes('join')) reply = 'To join, scroll down to the "Join Us" section and fill the application form. Must be 18+ and pay 1000 KES.';
    else if(q.includes('program')) reply = 'We have 8 pillars including Entrepreneurship, Skills, Community, and Leadership.';
    else if(q.includes('where')) reply = 'We are based in Voi, Taita Taveta County, Kenya.';
    addMsg(reply, 'bot');
  }, 600);
});
document.getElementById('aiQuick').addEventListener('click', e => {
  if(e.target.tagName === 'BUTTON') { aiInput.value = e.target.dataset.q; aiForm.dispatchEvent(new Event('submit')); }
});

/* ============================================================
   4. SUPABASE & EMAILJS MEMBER PORTAL LOGIC
   ============================================================ */
const tabApply = document.getElementById('tabApply');
const tabLogin = document.getElementById('tabLogin');
const applySection = document.getElementById('applySection');
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');

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

// Handle Registration (INSERT INTO SUPABASE + SEND EMAIL)
document.getElementById('applyForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const btn = document.getElementById('applyBtn');
  const name = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const id = document.getElementById('nationalId').value;
  const dobValue = document.getElementById('dob').value;
  const err = document.getElementById('applyError');
  const success = document.getElementById('applySuccess');
  
  err.style.display = 'none';
  success.style.display = 'none';
  btn.textContent = 'Submitting...';
  btn.disabled = true;

  // Age Check (18+)
  const age = new Date().getFullYear() - new Date(dobValue).getFullYear();
  if(age < 18) {
    err.textContent = 'You must be 18 years or older to join.';
    err.style.display = 'block';
    btn.textContent = 'Submit Application';
    btn.disabled = false;
    return;
  }

  // Generate Code
  const code = 'AYG-' + Math.random().toString(36).substring(2, 7).toUpperCase();

  // 1. Send to Supabase
  const { data, error } = await supabase
    .from('members')
    .insert([
      { full_name: name, email: email, national_id: id, dob: dobValue, membership_code: code }
    ]);

  if (error) {
    console.error(error);
    if (error.code === '23505') { // Unique violation
      err.textContent = 'This National ID is already registered.';
    } else {
      err.textContent = 'Error: ' + error.message;
    }
    err.style.display = 'block';
    btn.textContent = 'Submit Application';
    btn.disabled = false;
    return;
  } 

  // 2. Send Email via EmailJS
  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_name: name,
      to_email: email,
      membership_code: code,
      dashboard_link: window.location.origin + window.location.pathname + "#join"
    });
    
    success.textContent = 'Registration successful! Check your email for your Membership Code.';
    success.style.display = 'block';
    
    setTimeout(() => {
      showDashboard(name, code, "Registration Successful! We also sent you an email.");
    }, 1500);

  } catch (emailError) {
    console.error('Email failed to send:', emailError);
    success.textContent = 'Registration successful! (Email delivery failed, but your code is below).';
    success.style.display = 'block';
    setTimeout(() => {
      showDashboard(name, code, "Registration Successful!");
    }, 1500);
  }
  
  btn.textContent = 'Submit Application';
  btn.disabled = false;
});

// Handle Login (SELECT FROM SUPABASE)
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const btn = document.getElementById('loginBtn');
  const inputCode = document.getElementById('loginCode').value.trim().toUpperCase();
  const err = document.getElementById('loginError');
  
  err.style.display = 'none';
  btn.textContent = 'Logging in...';
  btn.disabled = true;

  // Query Supabase
  const { data, error } = await supabase
    .from('members')
    .select('full_name, membership_code')
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
    showDashboard(data.full_name, data.membership_code, "Welcome back!");
  }
});

// Show Dashboard
function showDashboard(name, code, msg) {
  applySection.classList.remove('active');
  loginSection.classList.remove('active');
  document.querySelector('.portal-tabs').style.display = 'none'; 
  
  dashboardSection.classList.add('active');
  document.getElementById('dashTitle').textContent = `Welcome, ${name.split(' ')[0]}!`;
  document.getElementById('dashMessage').textContent = msg + " Save your Membership Code below.";
  document.getElementById('dashCode').textContent = code;
}

// Reset Portal
function resetPortal() {
  document.querySelector('.portal-tabs').style.display = 'flex';
  document.getElementById('applyForm').reset();
  document.getElementById('loginForm').reset();
  document.getElementById('applyError').style.display = 'none';
  document.getElementById('applySuccess').style.display = 'none';
  document.getElementById('loginError').style.display = 'none';
  switchTab('apply');
}
