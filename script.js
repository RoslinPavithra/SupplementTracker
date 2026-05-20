// ── State ──
let supplements = [];
let logs = {}; // { "YYYY-MM-DD": { supId: true/false } }
let editingId = null;
let selectedColor = '#ff6b8a';
let currentTheme = 'rose';
let calYear, calMonth;

const THEMES = {
  rose:     { emoji: '🌸' },
  sage:     { emoji: '🌿' },
  ocean:    { emoji: '🌊' },
  lavender: { emoji: '💜' },
  gold:     { emoji: '🌅' },
  midnight: { emoji: '🌙' }
};

// ── Default Supplements ──
const DEFAULT_SUPPLEMENTS = [
  { id: uid(), name: 'Vitamin D3 + K2', brand: 'HK Vitals', when: 'Morning with breakfast', how: 'With fat-rich food', dose: '1 capsule', color: '#ffd54f', startDate: today(), photo: null },
  { id: uid(), name: 'Omega-3 Fish Oil', brand: 'HK Vitals', when: 'Morning with breakfast', how: 'With food, 1 capsule', dose: '1 capsule (take 2/day)', color: '#4fc3f7', startDate: today(), photo: null },
  { id: uid(), name: 'Omega-3 (2nd dose)', brand: 'HK Vitals', when: 'With lunch', how: 'With food', dose: '1 capsule', color: '#4fc3f7', startDate: today(), photo: null },
  { id: uid(), name: 'Collagen', brand: 'HK Vitals', when: 'Morning with breakfast', how: 'Mix in drink or water', dose: '1 scoop', color: '#ff8a65', startDate: today(), photo: null },
  { id: uid(), name: 'Myo-Inositol (1st dose)', brand: 'Miduty', when: 'With lunch', how: 'Mix 1 scoop in water, take with meal', dose: '1 scoop (5g)', color: '#6bcf9e', startDate: today(), photo: null },
  { id: uid(), name: 'Folvite', brand: 'HK Vitals', when: 'Evening with dinner', how: 'With food', dose: '5mg tablet', color: '#b39ddb', startDate: today(), photo: null },
  { id: uid(), name: 'Myo-Inositol (2nd dose)', brand: 'Miduty', when: 'Before bed', how: 'Mix 1 scoop in water', dose: '1 scoop (5g)', color: '#6bcf9e', startDate: today(), photo: null },
  { id: uid(), name: 'Spearmint Tea', brand: '', when: 'Anytime', how: '1–2 cups, 1hr away from iron-rich food', dose: '1–2 cups', color: '#ff6b8a', startDate: today(), photo: null },
];

// ── Utils ──
function uid() { return '_' + Math.random().toString(36).substr(2,9); }
function today() { return new Date().toISOString().split('T')[0]; }
function formatDate(d) {
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  return new Date(d + 'T12:00:00').toLocaleDateString(undefined, opts);
}
function formatDateShort(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
}

// ── Persistence ──
function save() {
  localStorage.setItem('vitals_sups', JSON.stringify(supplements));
  localStorage.setItem('vitals_logs', JSON.stringify(logs));
  localStorage.setItem('vitals_theme', currentTheme);
}
function load() {
  const s = localStorage.getItem('vitals_sups');
  const l = localStorage.getItem('vitals_logs');
  const t = localStorage.getItem('vitals_theme');
  supplements = s ? JSON.parse(s) : JSON.parse(JSON.stringify(DEFAULT_SUPPLEMENTS));
  logs = l ? JSON.parse(l) : {};
  currentTheme = t || 'rose';
}

// ── Toast ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Theme ──
function applyTheme(name) {
  document.body.className = 'theme-' + name;
  currentTheme = name;
  document.getElementById('bgEmoji').textContent = THEMES[name].emoji;
  document.querySelectorAll('.theme-option').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === name);
  });
  save();
}

// ── Tab Switching ──
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-content').forEach(s => s.classList.toggle('active', s.id === 'tab-' + name));
  if (name === 'today') renderToday();
  if (name === 'supplements') renderSupList();
  if (name === 'calendar') renderCalendar();
}

// ── TODAY ──
function renderToday() {
  const dateEl = document.getElementById('todayDate');
  const todayStr = today();
  dateEl.textContent = formatDate(todayStr);

  const log = logs[todayStr] || {};
  const groups = {};
  supplements.forEach(s => {
    if (!groups[s.when]) groups[s.when] = [];
    groups[s.when].push(s);
  });

  const list = document.getElementById('todayList');
  list.innerHTML = '';

  const timeOrder = [
    'Morning with breakfast',
    'With lunch',
    'Evening with dinner',
    'Before bed',
    'Anytime'
  ];

  const allWhen = [...new Set([...timeOrder, ...Object.keys(groups)])];

  allWhen.forEach(when => {
    if (!groups[when]) return;
    const label = document.createElement('div');
    label.className = 'time-group-label';
    label.textContent = when;
    list.appendChild(label);

    groups[when].forEach(s => {
      const done = !!log[s.id];
      const card = document.createElement('div');
      card.className = 'dose-card' + (done ? ' done' : '');
      card.innerHTML = `
        <div class="dose-check">${done ? '✓' : ''}</div>
        <div class="dose-dot" style="background:${s.color}"></div>
        <div class="dose-info">
          <div class="dose-name">${s.name}</div>
          <div class="dose-sub">${s.how ? s.how + (s.dose ? ' · ' + s.dose : '') : s.dose || ''}</div>
        </div>
      `;
      card.addEventListener('click', () => toggleDose(s.id, todayStr));
      list.appendChild(card);
    });
  });

  if (supplements.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="big-emoji">💊</span><p>No supplements yet.<br>Go to My Stack to add them!</p></div>`;
  }

  updateRing(todayStr);
}

function toggleDose(supId, dateStr) {
  if (!logs[dateStr]) logs[dateStr] = {};
  logs[dateStr][supId] = !logs[dateStr][supId];
  save();
  renderToday();
}

function updateRing(dateStr) {
  const log = logs[dateStr] || {};
  const total = supplements.length;
  const done = supplements.filter(s => log[s.id]).length;
  document.getElementById('doneCount').textContent = done;
  document.getElementById('totalCount').textContent = total;
  const circ = 289;
  const offset = total > 0 ? circ - (done / total) * circ : circ;
  document.getElementById('ringFill').style.strokeDashoffset = offset;
}

// ── SUPPLEMENT LIST ──
function renderSupList() {
  const list = document.getElementById('supList');
  list.innerHTML = '';
  if (supplements.length === 0) {
    list.innerHTML = `<div class="empty-state"><span class="big-emoji">📋</span><p>Your stack is empty.<br>Tap + Add Supplement to get started.</p></div>`;
    return;
  }
  supplements.forEach(s => {
    const card = document.createElement('div');
    card.className = 'sup-card';
    card.style.setProperty('--sup-color', s.color);
    card.innerHTML = `
      <div class="sup-card-top">
        <div>
          <div class="sup-card-name">${s.name}</div>
          ${s.brand ? `<div class="sup-card-brand">${s.brand}</div>` : ''}
        </div>
        <div class="sup-card-actions">
          <button onclick="viewSup('${s.id}')">👁 View</button>
          <button onclick="editSup('${s.id}')">✏️</button>
          <button onclick="deleteSup('${s.id}')">🗑</button>
        </div>
      </div>
      <div class="sup-card-meta">
        <span class="meta-pill accent">⏰ ${s.when}</span>
        ${s.how ? `<span class="meta-pill">📝 ${s.how}</span>` : ''}
        ${s.dose ? `<span class="meta-pill">💊 ${s.dose}</span>` : ''}
        ${s.startDate ? `<span class="meta-pill">📅 Since ${formatDateShort(s.startDate)}</span>` : ''}
      </div>
    `;
    list.appendChild(card);
  });
}

function viewSup(id) {
  const s = supplements.find(x => x.id === id);
  if (!s) return;
  document.getElementById('viewSupName').textContent = s.name;
  const body = document.getElementById('viewModalBody');
  const daysSince = s.startDate ? Math.floor((new Date() - new Date(s.startDate + 'T12:00:00')) / 86400000) : null;
  body.innerHTML = `
    ${s.brand ? `<p style="color:var(--text-muted);font-size:13px;margin-bottom:12px">${s.brand}</p>` : ''}
    <div style="display:flex;flex-direction:column;gap:10px">
      <div class="meta-pill accent" style="padding:10px 14px;border-radius:14px;font-size:13px">⏰ When: ${s.when}</div>
      ${s.how ? `<div class="meta-pill" style="padding:10px 14px;border-radius:14px;font-size:13px">📝 How: ${s.how}</div>` : ''}
      ${s.dose ? `<div class="meta-pill" style="padding:10px 14px;border-radius:14px;font-size:13px">💊 Dose: ${s.dose}</div>` : ''}
      ${s.startDate ? `<div class="meta-pill" style="padding:10px 14px;border-radius:14px;font-size:13px">📅 Started: ${formatDateShort(s.startDate)}${daysSince !== null ? ` (${daysSince} day${daysSince!==1?'s':''} ago)` : ''}</div>` : ''}
    </div>
    ${s.photo ? `<img src="${s.photo}" style="width:100%;border-radius:14px;margin-top:16px" />` : ''}
  `;
  openModal('viewModal');
}

function editSup(id) {
  const s = supplements.find(x => x.id === id);
  if (!s) return;
  editingId = id;
  document.getElementById('supModalTitle').textContent = 'Edit Supplement';
  document.getElementById('supName').value = s.name;
  document.getElementById('supBrand').value = s.brand || '';
  document.getElementById('supHow').value = s.how || '';
  document.getElementById('supDose').value = s.dose || '';
  document.getElementById('supStart').value = s.startDate || '';
  selectedColor = s.color || '#ff6b8a';
  updateColorTags();

  const whenSel = document.getElementById('supWhen');
  const customInput = document.getElementById('supWhenCustom');
  const standardOptions = Array.from(whenSel.options).map(o => o.value);
  if (standardOptions.includes(s.when)) {
    whenSel.value = s.when;
    customInput.style.display = 'none';
  } else {
    whenSel.value = 'Custom';
    customInput.style.display = 'block';
    customInput.value = s.when;
  }

  const preview = document.getElementById('supPhotoPreview');
  if (s.photo) { preview.src = s.photo; preview.style.display = 'block'; }
  else { preview.style.display = 'none'; }

  openModal('supModal');
}

function deleteSup(id) {
  if (!confirm('Remove this supplement?')) return;
  supplements = supplements.filter(s => s.id !== id);
  save();
  renderSupList();
  showToast('Supplement removed');
}

// ── ADD/EDIT MODAL ──
function openAddModal() {
  editingId = null;
  document.getElementById('supModalTitle').textContent = 'Add Supplement';
  document.getElementById('supName').value = '';
  document.getElementById('supBrand').value = '';
  document.getElementById('supHow').value = '';
  document.getElementById('supDose').value = '';
  document.getElementById('supStart').value = today();
  document.getElementById('supWhen').value = 'Morning with breakfast';
  document.getElementById('supWhenCustom').style.display = 'none';
  document.getElementById('supPhotoPreview').style.display = 'none';
  selectedColor = '#ff6b8a';
  updateColorTags();
  openModal('supModal');
}

function saveSup() {
  const name = document.getElementById('supName').value.trim();
  if (!name) { showToast('Please enter a supplement name'); return; }

  const whenSel = document.getElementById('supWhen').value;
  const customWhen = document.getElementById('supWhenCustom').value.trim();
  const when = whenSel === 'Custom' ? (customWhen || 'Custom') : whenSel;

  const photoPreview = document.getElementById('supPhotoPreview');
  const photo = photoPreview.style.display !== 'none' ? photoPreview.src : null;

  const data = {
    name,
    brand: document.getElementById('supBrand').value.trim(),
    when,
    how: document.getElementById('supHow').value.trim(),
    dose: document.getElementById('supDose').value.trim(),
    startDate: document.getElementById('supStart').value || today(),
    color: selectedColor,
    photo
  };

  if (editingId) {
    const idx = supplements.findIndex(s => s.id === editingId);
    supplements[idx] = { ...supplements[idx], ...data };
    showToast('Supplement updated ✓');
  } else {
    supplements.push({ id: uid(), ...data });
    showToast('Supplement added ✓');
  }

  save();
  closeModal('supModal');
  renderSupList();
  renderToday();
}

function updateColorTags() {
  document.querySelectorAll('.color-tag').forEach(b => {
    b.classList.toggle('active', b.dataset.color === selectedColor);
  });
}

// ── CALENDAR ──
function renderCalendar() {
  const now = new Date();
  if (calYear === undefined) calYear = now.getFullYear();
  if (calMonth === undefined) calMonth = now.getMonth();

  // Populate selects
  const monthSel = document.getElementById('calMonthSel');
  const yearSel = document.getElementById('calYearSel');

  if (monthSel.options.length === 0) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    months.forEach((m,i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = m;
      monthSel.appendChild(opt);
    });
  }
  monthSel.value = calMonth;

  if (yearSel.options.length === 0) {
    for (let y = 1990; y <= 2126; y++) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      yearSel.appendChild(opt);
    }
  }
  yearSel.value = calYear;

  drawCalGrid();
}

function drawCalGrid() {
  const grid = document.getElementById('calGrid');
  const todayStr = today();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  let html = '<div class="cal-weekdays">';
  ['S','M','T','W','T','F','S'].forEach(d => html += `<div class="cal-wd">${d}</div>`);
  html += '</div><div class="cal-days">';

  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const log = logs[dateStr];
    const total = supplements.length;
    const done = log ? supplements.filter(s => log[s.id]).length : 0;
    const isFull = total > 0 && done === total;
    const hasData = done > 0;
    const isToday = dateStr === todayStr;
    let cls = 'cal-day';
    if (isToday) cls += ' today';
    if (isFull) cls += ' full';
    else if (hasData) cls += ' has-data';
    html += `<div class="${cls}" data-date="${dateStr}">${d}</div>`;
  }
  html += '</div>';
  grid.innerHTML = html;

  grid.querySelectorAll('.cal-day[data-date]').forEach(el => {
    el.addEventListener('click', () => showDayDetail(el.dataset.date));
  });
}

function showDayDetail(dateStr) {
  const detail = document.getElementById('calDayDetail');
  const log = logs[dateStr] || {};
  if (supplements.length === 0) { detail.style.display = 'none'; return; }
  let html = `<h3>${formatDate(dateStr)}</h3>`;
  supplements.forEach(s => {
    const done = !!log[s.id];
    html += `<div class="cal-detail-item ${done ? 'done' : ''}">${s.name}</div>`;
  });
  detail.innerHTML = html;
  detail.style.display = 'block';
}

// ── MODAL HELPERS ──
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── SERVICE WORKER ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  load();
  applyTheme(currentTheme);

  // Set today's date display
  document.getElementById('todayDate').textContent = formatDate(today());

  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  // Theme
  document.getElementById('themeBtn').addEventListener('click', () => openModal('themeModal'));
  document.querySelectorAll('.theme-option').forEach(b => {
    b.addEventListener('click', () => {
      applyTheme(b.dataset.theme);
      closeModal('themeModal');
    });
  });

  // Add supplement
  document.getElementById('addSupBtn').addEventListener('click', openAddModal);
  document.getElementById('saveSupBtn').addEventListener('click', saveSup);

  // When select custom
  document.getElementById('supWhen').addEventListener('change', function() {
    document.getElementById('supWhenCustom').style.display = this.value === 'Custom' ? 'block' : 'none';
  });

  // Color tags
  document.querySelectorAll('.color-tag').forEach(b => {
    b.addEventListener('click', () => {
      selectedColor = b.dataset.color;
      updateColorTags();
    });
  });

  // Photo
  document.getElementById('photoPickBtn').addEventListener('click', () => {
    document.getElementById('supPhoto').click();
  });
  document.getElementById('supPhoto').addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const preview = document.getElementById('supPhotoPreview');
      preview.src = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });

  // Close modals
  document.querySelectorAll('[data-modal]').forEach(b => {
    b.addEventListener('click', () => closeModal(b.dataset.modal));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) closeModal(this.id);
    });
  });

  // Calendar nav
  document.getElementById('calPrev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
  document.getElementById('calMonthSel').addEventListener('change', function() {
    calMonth = parseInt(this.value);
    drawCalGrid();
  });
  document.getElementById('calYearSel').addEventListener('change', function() {
    calYear = parseInt(this.value);
    drawCalGrid();
  });

  // Initial render
  renderToday();
});
