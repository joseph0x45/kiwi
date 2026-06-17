/* ─── State ───────────────────────────────────────────────────────── */
const STORAGE_KEY = 'kiwi-state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { sections: [] };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

/* ─── Helpers ─────────────────────────────────────────────────────── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const ACCENTS = [
  'var(--accent-0)',
  'var(--accent-1)',
  'var(--accent-2)',
  'var(--accent-3)',
  'var(--accent-4)',
  'var(--accent-5)',
];

const ROTATIONS = [1.2, -0.9, 0.6, -1.4, 1.0, -0.5];

function accentForIndex(i) {
  return ACCENTS[i % ACCENTS.length];
}

function rotationForIndex(i) {
  return ROTATIONS[i % ROTATIONS.length];
}

/* ─── Rendering ───────────────────────────────────────────────────── */
const sectionsGrid = document.getElementById('sectionsGrid');
const emptyState   = document.getElementById('emptyState');
const tally        = document.getElementById('tally');

function render() {
  saveState();
  updateTally();

  const hasSections = state.sections.length > 0;
  emptyState.classList.toggle('hidden', hasSections);

  // Diff-free full re-render (small data, fine for this scale)
  sectionsGrid.innerHTML = '';
  state.sections.forEach((section, idx) => {
    sectionsGrid.appendChild(buildSectionCard(section, idx));
  });
}

function updateTally() {
  let done = 0, total = 0;
  state.sections.forEach(s => {
    total += s.items.length;
    done  += s.items.filter(i => i.done).length;
  });
  tally.textContent = total > 0 ? `${done} of ${total} crossed off` : '';
}

/* ── Section card ─────────────────────────────────────────────────── */
function buildSectionCard(section, idx) {
  const accent   = accentForIndex(idx);
  const rotation = rotationForIndex(idx);

  const card = document.createElement('div');
  card.className = 'section-card';
  card.dataset.id = section.id;
  card.style.transform = `rotate(${rotation}deg)`;
  card.style.setProperty('--card-accent', accent);

  // Washi tape via pseudo-element color (set via custom prop on card)
  const style = document.createElement('style');
  style.textContent = `
    .section-card[data-id="${section.id}"]::before { background-color: ${accent}; }
  `;
  document.head.appendChild(style);

  const doneCount  = section.items.filter(i => i.done).length;
  const totalCount = section.items.length;
  const hideDone   = section.hideDone || false;

  card.innerHTML = `
    <div class="section-header">
      <div class="section-name-wrap">
        <span class="section-name" title="Click to rename">${escHtml(section.name)}</span>
      </div>
      <span class="section-meta">${doneCount}/${totalCount}</span>
      <div class="section-controls">
        <button class="section-menu-btn delete-section-btn" title="Delete section" aria-label="Delete section">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>

    <label class="hide-done-label">
      <input type="checkbox" class="hide-done-toggle" ${hideDone ? 'checked' : ''} />
      Hide completed
    </label>

    <ul class="items-list">
      ${buildItemsHtml(section, hideDone)}
    </ul>

    <form class="add-item-form" autocomplete="off">
      <input type="text" class="add-item-input" placeholder="Add something…" maxlength="200" aria-label="New item text" />
      <button type="submit" class="add-item-btn" aria-label="Add item">+</button>
    </form>
  `;

  wireSection(card, section);
  return card;
}

function buildItemsHtml(section, hideDone) {
  const items = [...section.items].sort((a, b) => {
    if (a.done === b.done) return 0;
    return a.done ? 1 : -1;
  });

  if (items.length === 0) {
    return '<li class="section-empty">Nothing here yet — add the first thing below.</li>';
  }

  return items
    .filter(item => !(hideDone && item.done))
    .map(item => buildItemHtml(item))
    .join('');
}

function buildItemHtml(item) {
  const alreadyChecked = item.done ? ' already-checked' : '';
  const doneClass      = item.done ? ' item-done' : '';

  const starsHtml = [1,2,3,4,5].map(n => {
    const filled = item.rating >= n;
    return `
      <button type="button" class="star-btn ${filled ? 'active' : ''}" data-value="${n}" aria-label="${n} star${n > 1 ? 's' : ''}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>`;
  }).join('');

  return `
    <li class="item-row${doneClass}" data-id="${item.id}">
      <div class="item-main">
        <div class="checkbox-wrap">
          <label class="hand-checkbox${alreadyChecked}" aria-label="Mark as done">
            <input type="checkbox" ${item.done ? 'checked' : ''} />
            <span class="box"></span>
            <svg class="check-mark" viewBox="0 0 14 12" aria-hidden="true">
              <path class="check-path" d="M1.5 6 L5.5 10 L12.5 1.5" />
            </svg>
          </label>
        </div>
        <div class="item-text-wrap">
          <span class="item-text">${escHtml(item.text)}</span>
        </div>
        <div class="item-actions">
          <button type="button" class="item-btn expand-btn" aria-label="Expand details" aria-expanded="false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button type="button" class="item-btn delete-item-btn" aria-label="Delete item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="item-expand">
        <div class="expand-field">
          <label class="expand-label">Notes</label>
          <textarea class="expand-notes" rows="2" placeholder="Any notes…">${escHtml(item.notes || '')}</textarea>
        </div>
        <div class="expand-field">
          <label class="expand-label">Date completed</label>
          <input type="date" class="expand-date" value="${item.dateCompleted || ''}" onclick="try{this.showPicker()}catch(_){}" />
        </div>
        <div class="expand-field">
          <label class="expand-label">Rating</label>
          <div class="star-rating">${starsHtml}</div>
        </div>
      </div>
    </li>`;
}

/* ── Wire events on a card ────────────────────────────────────────── */
function wireSection(card, section) {
  // Rename on click
  card.querySelector('.section-name').addEventListener('click', () => {
    startRenameSection(card, section);
  });

  // Delete section
  card.querySelector('.delete-section-btn').addEventListener('click', () => {
    confirmDeleteSection(section);
  });

  // Hide-done toggle
  card.querySelector('.hide-done-toggle').addEventListener('change', e => {
    section.hideDone = e.target.checked;
    render();
  });

  // Add item
  card.querySelector('.add-item-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = card.querySelector('.add-item-input');
    const text  = input.value.trim();
    if (!text) return;
    section.items.push({
      id: uid(),
      text,
      done: false,
      notes: '',
      dateCompleted: null,
      rating: 0,
      createdAt: new Date().toISOString(),
    });
    input.value = '';
    render();
    // Re-focus the input in the newly rendered card
    const newCard = sectionsGrid.querySelector(`.section-card[data-id="${section.id}"]`);
    if (newCard) newCard.querySelector('.add-item-input').focus();
  });

  // Item events (delegated)
  card.querySelector('.items-list').addEventListener('click', e => {
    const row = e.target.closest('.item-row');
    if (!row) return;
    const itemId = row.dataset.id;
    const item   = section.items.find(i => i.id === itemId);
    if (!item) return;

    // Checkbox
    if (e.target.closest('.hand-checkbox')) {
      const cb = e.target.closest('.hand-checkbox').querySelector('input[type="checkbox"]');
      // The browser already toggled checked; read the new state
      const nowDone = cb.checked;
      item.done = nowDone;
      if (nowDone && !item.dateCompleted) item.dateCompleted = today();
      // Don't re-render immediately — let the CSS animation play, then re-render
      setTimeout(() => render(), 320);
      return;
    }

    // Expand toggle
    if (e.target.closest('.expand-btn')) {
      const btn    = e.target.closest('.expand-btn');
      const expand = row.querySelector('.item-expand');
      const open   = expand.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
      return;
    }

    // Delete item
    if (e.target.closest('.delete-item-btn')) {
      section.items = section.items.filter(i => i.id !== itemId);
      render();
      return;
    }

    // Star rating
    if (e.target.closest('.star-btn')) {
      const val = parseInt(e.target.closest('.star-btn').dataset.value, 10);
      item.rating = item.rating === val ? 0 : val;
      render();
      return;
    }

    // Inline edit item text
    if (e.target.closest('.item-text')) {
      startEditItemText(row, item, section);
      return;
    }
  });

  // Notes / date save (blur)
  card.querySelector('.items-list').addEventListener('change', e => {
    const row = e.target.closest('.item-row');
    if (!row) return;
    const item = section.items.find(i => i.id === row.dataset.id);
    if (!item) return;

    if (e.target.classList.contains('expand-notes')) {
      item.notes = e.target.value;
      saveState();
    }
    if (e.target.classList.contains('expand-date')) {
      item.dateCompleted = e.target.value || null;
      saveState();
    }
  });
}

/* ── Inline rename section ────────────────────────────────────────── */
function startRenameSection(card, section) {
  const nameEl = card.querySelector('.section-name');
  const input  = document.createElement('input');
  input.type      = 'text';
  input.className = 'section-name-input';
  input.value     = section.name;
  input.maxLength = 80;
  nameEl.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const val = input.value.trim();
    if (val) section.name = val;
    render();
  }
  input.addEventListener('blur',  commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { render(); }
  });
}

/* ── Inline edit item text ────────────────────────────────────────── */
function startEditItemText(row, item, section) {
  const textEl = row.querySelector('.item-text');
  const input  = document.createElement('input');
  input.type      = 'text';
  input.className = 'item-text-input';
  input.value     = item.text;
  input.maxLength = 200;
  textEl.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const val = input.value.trim();
    if (val) item.text = val;
    render();
  }
  input.addEventListener('blur',  commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { render(); }
  });
}

/* ── Confirm delete section ───────────────────────────────────────── */
const backdrop    = document.getElementById('modalBackdrop');
const modalTitle  = document.getElementById('modalTitle');
const modalBody   = document.getElementById('modalBody');
const modalCancel = document.getElementById('modalCancel');
const modalConfirm= document.getElementById('modalConfirm');
let   pendingDelete = null;

function confirmDeleteSection(section) {
  modalTitle.textContent  = `Delete "${section.name}"?`;
  modalBody.textContent   = `This will permanently delete the section and all ${section.items.length} item${section.items.length !== 1 ? 's' : ''} inside it. This can't be undone.`;
  backdrop.hidden         = false;
  backdrop.removeAttribute('aria-hidden');
  pendingDelete = section;
  modalConfirm.focus();
}

modalCancel.addEventListener('click', closeModal);
backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !backdrop.hidden) closeModal(); });

modalConfirm.addEventListener('click', () => {
  if (!pendingDelete) return;
  state.sections = state.sections.filter(s => s.id !== pendingDelete.id);
  closeModal();
  render();
});

function closeModal() {
  backdrop.hidden = true;
  backdrop.setAttribute('aria-hidden', 'true');
  pendingDelete = null;
}

/* ─── Add section ─────────────────────────────────────────────────── */
document.getElementById('addSectionForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('addSectionInput');
  const name  = input.value.trim();
  if (!name) return;
  state.sections.push({
    id: uid(),
    name,
    createdAt: new Date().toISOString(),
    items: [],
    hideDone: false,
  });
  input.value = '';
  render();
});

/* ─── Export ──────────────────────────────────────────────────────── */
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `kiwi-backup-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

/* ─── Import ──────────────────────────────────────────────────────── */
document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!parsed.sections || !Array.isArray(parsed.sections)) throw new Error('Invalid');
      state = parsed;
      render();
    } catch (_) {
      alert('Could not import — the file doesn\'t look like a valid Kiwi backup.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

/* ─── Utility ─────────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── Service worker registration ────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
}

/* ─── Initial render ──────────────────────────────────────────────── */
render();
