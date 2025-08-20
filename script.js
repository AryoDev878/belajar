// ===== Util: Local Storage helpers =====
const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  del(key) { localStorage.removeItem(key); }
};

// ===== Theme (Dark/Light) =====
const applyTheme = (mode) => {
  if(mode === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
};
const initTheme = () => {
  const saved = storage.get('theme','auto');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = saved === 'auto' ? (prefersDark ? 'dark':'light') : saved;
  applyTheme(mode);
  const btn = document.getElementById('themeToggle');
  btn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    storage.set('theme', isDark ? 'dark' : 'light');
  });
};


// ===== Routing (SPA-style: show/hide sections) =====
const routes = Array.from(document.querySelectorAll('.route'));
const navLinks = Array.from(document.querySelectorAll('.nav-link'));
const showRoute = (id) => {
  routes.forEach(r => r.classList.remove('show'));
  const section = document.getElementById(id);
  if(section){ section.classList.add('show'); section.focus(); }
  navLinks.forEach(b => b.classList.toggle('active', b.dataset.target === id));
  history.replaceState(null,'', `#${id}`);
};
const initRouter = () => {
  navLinks.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    showRoute(btn.dataset.target);
    document.querySelector('.main-nav').classList.remove('open');
  }));
  // deep link
  const hash = (location.hash || '#home').replace('#','');
  showRoute(hash);
  // CTA links in hero/footer
  document.querySelectorAll('[data-target]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('data-target');
      if(id){ e.preventDefault(); showRoute(id); }
    });
  });
  // mobile menu
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.querySelector('.main-nav').classList.toggle('open');
  });
};

// ===== Data: Course catalog =====
const COURSES = [
  {id:'html', name:'HTML', level:'pemula', desc:'Bahasa markup untuk struktur halaman web.', code:`<!DOCTYPE html>
<html>
  <head><title>Hello</title></head>
  <body>Hello World</body>
</html>`},
  {id:'css', name:'CSS', level:'pemula', desc:'Bahasa gaya untuk mengatur tampilan elemen HTML.', code:`h1 { font-family: Arial; color: teal; }`},
  {id:'js', name:'JavaScript', level:'pemula', desc:'Bahasa pemrograman untuk interaksi pada web.', code:`console.log('Hello World');`},
  {id:'python', name:'Python', level:'pemula', desc:'Bahasa serbaguna yang mudah dibaca.', code:`print("Hello World")`},
  {id:'php', name:'PHP', level:'menengah', desc:'Bahasa untuk pengembangan web di sisi server.', code:`<?php echo "Hello World"; ?>`},
  {id:'java', name:'Java', level:'menengah', desc:'Bahasa OOP yang portabel (JVM).', code:`public class Main { public static void main(String[] args){ System.out.println("Hello World"); } }`},
  {id:'cpp', name:'C++', level:'menengah', desc:'Bahasa tingkat menengah untuk kinerja tinggi.', code:`#include <iostream>\nint main(){ std::cout << "Hello World"; }`},
  {id:'csharp', name:'C#', level:'menengah', desc:'Bahasa modern untuk .NET.', code:`using System; class P { static void Main(){ Console.WriteLine("Hello World"); } }`},
  {id:'go', name:'Go', level:'menengah', desc:'Bahasa cepat dengan concurrency bawaan.', code:`package main\nimport "fmt"\nfunc main(){ fmt.Println("Hello World") }`},
];

// ===== Courses UI + Search/Filter + Progress =====
const renderCourses = () => {
  const list = document.getElementById('courseList');
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const level = document.getElementById('levelFilter').value;
  const progress = storage.get('progress',{});
  list.innerHTML = '';
  COURSES.filter(c => {
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q) || c.id.includes(q);
    const matchL = level === 'all' || c.level === level;
    return matchQ && matchL;
  }).forEach(c => {
    const wrap = document.createElement('article');
    wrap.className = 'card course';
    wrap.innerHTML = `
      <div class="progress-row">
        <h3>${c.name} <small style="font-weight:400;color:var(--muted)">• ${c.level}</small></h3>
        <label><input type="checkbox" data-id="${c.id}" ${progress[c.id]?'checked':''}/> Sudah dipelajari</label>
      </div>
      <p>${c.desc}</p>
      <div class="codebox" role="region" aria-label="Contoh kode Hello World untuk ${c.name}"><pre><code>${c.code.replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))}</code></pre></div>
      <div style="display:flex; gap:8px; flex-wrap:wrap">
        <button class="btn outline" data-copy="${c.id}">Salin Kode</button>
      </div>
    `;
    list.appendChild(wrap);
  });

  // bind checkboxes
  list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const prog = storage.get('progress',{});
      prog[cb.dataset.id] = cb.checked;
      storage.set('progress', prog);
    });
  });

  // copy buttons
  list.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const c = COURSES.find(x => x.id === btn.dataset.copy);
      try{
        await navigator.clipboard.writeText(c.code);
        btn.textContent = 'Tersalin ✔';
        setTimeout(()=>btn.textContent='Salin Kode', 1200);
      }catch{
        // fallback
        const ta = document.createElement('textarea');
        ta.value = c.code; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
        btn.textContent = 'Tersalin ✔';
        setTimeout(()=>btn.textContent='Salin Kode', 1200);
      }
    });
  });
};

// search/filter events
const initCourseControls = () => {
  document.getElementById('searchInput').addEventListener('input', renderCourses);
  document.getElementById('levelFilter').addEventListener('change', renderCourses);
  renderCourses();
};

// ===== Quiz =====
const QUESTIONS = [
  { q:'Apa kepanjangan dari HTML?', a:['HyperText Markup Language','HighText Machine Language','Hyperlinks and Text Markup Language','Home Tool Markup Language'], c:0 },
  { q:'Di JavaScript, method untuk mencetak ke console adalah?', a:['print()','console.log()','echo()','logger()'], c:1 },
  { q:'Simbol komentar satu baris di Python adalah?', a:['//','<!-- -->','#','--'], c:2 },
  { q:'CSS digunakan untuk?', a:['Struktur halaman','Membuat database','Mengatur tampilan','Menjalankan server'], c:2 },
  { q:'Apa ekstensi berkas untuk file Java?', a:['.jav','.jar','.jv','.java'], c:3 },
];

const renderQuiz = () => {
  const form = document.getElementById('quizForm');
  form.innerHTML = '';
  QUESTIONS.forEach((it, idx) => {
    const f = document.createElement('fieldset');
    f.className = 'quiz-q';
    f.innerHTML = `<legend>Q${idx+1}. ${it.q}</legend>` + it.a.map((opt, i) => `
      <label style="display:block; margin:.25rem 0">
        <input type="radio" name="q${idx}" value="${i}" required /> ${opt}
      </label>
    `).join('');
    form.appendChild(f);
  });
  const submit = document.createElement('button');
  submit.type = 'submit'; submit.className = 'btn primary'; submit.textContent = 'Lihat Hasil';
  form.appendChild(submit);

  form.onsubmit = (e) => {
    e.preventDefault();
    let score = 0;
    QUESTIONS.forEach((it, idx) => {
      const chosen = form.querySelector(`input[name="q${idx}"]:checked`);
      if(chosen && Number(chosen.value) === it.c) score++;
    });
    const res = document.getElementById('quizResult');
    res.textContent = `Nilai kamu: ${score}/${QUESTIONS.length} (${Math.round(score/QUESTIONS.length*100)}%)`;
  };
};

// ===== Forum (local-only) =====
const initForum = () => {
  const form = document.getElementById('forumForm');
  const list = document.getElementById('forumList');
  const render = () => {
    const data = storage.get('forum', []);
    list.innerHTML = '';
    data.slice().reverse().forEach(item => {
      const el = document.createElement('div');
      el.className = 'forum-item';
      el.innerHTML = `
        <div class="forum-meta">${item.name} • ${new Date(item.time).toLocaleString()}</div>
        <div>${item.msg.replace(/</g,'&lt;')}</div>
      `;
      list.appendChild(el);
    });
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('forumName').value.trim() || 'Anonim';
    const msg = document.getElementById('forumMessage').value.trim();
    if(!msg) return;
    const data = storage.get('forum', []);
    data.push({name, msg, time: Date.now()});
    storage.set('forum', data);
    form.reset();
    render();
  });
  render();
};

// ===== Auth (simulated) =====
const initAuth = () => {
  const users = storage.get('users', {});
  const regForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const status = document.getElementById('authStatus');
  const logoutBtn = document.getElementById('logoutBtn');

  const setStatus = (msg) => { status.textContent = msg || ''; };

  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const pass = document.getElementById('regPass').value;
    if(!name || !email || pass.length < 6) return alert('Lengkapi data. Password min 6 karakter.');
    const users = storage.get('users', {});
    if(users[email]) return alert('Email sudah terdaftar.');
    users[email] = {name, email, pass};
    storage.set('users', users);
    alert('Registrasi berhasil! Silakan login.');
    regForm.reset();
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass = document.getElementById('loginPass').value;
    const users = storage.get('users', {});
    if(users[email] && users[email].pass === pass){
      storage.set('session', {email, name: users[email].name});
      setStatus('Login sukses. Hai, ' + users[email].name + '!');
    }else{
      setStatus('Login gagal. Cek email / password.');
    }
  });

  logoutBtn.addEventListener('click', () => {
    storage.del('session'); setStatus('Kamu sudah logout.');
  });

  const sess = storage.get('session', null);
  if(sess) setStatus('Sudah login sebagai ' + sess.name);
};

// ===== Feedback =====
const initFeedback = () => {
  const form = document.getElementById('feedbackForm');
  const list = document.getElementById('feedbackList');
  const render = () => {
    const data = storage.get('feedback', []);
    list.innerHTML = '';
    data.slice().reverse().forEach(item => {
      const el = document.createElement('div');
      el.className = 'feedback-item';
      el.innerHTML = `<div class="feedback-name">${item.name}${item.role? ' • '+item.role:''}</div><div>${item.text.replace(/</g,'&lt;')}</div>`;
      list.appendChild(el);
    });
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('fbName').value.trim() || 'Anonim';
    const role = document.getElementById('fbRole').value.trim();
    const text = document.getElementById('fbText').value.trim();
    if(!text) return;
    const data = storage.get('feedback', []);
    data.push({name, role, text, time: Date.now()});
    storage.set('feedback', data);
    form.reset(); render();
  });
  render();
};

// ===== Footer year =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Init all =====
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initRouter();
  initCourseControls();
  renderQuiz();
  initForum();
  initAuth();
  initFeedback();
});
