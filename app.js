/* =====================================================
   MAPA DE OPORTUNIDADES CON IA
   Conectado a Supabase REST API
   ===================================================== */

const SUPABASE_URL  = 'https://hdlaxxxiqvdcmxbwacsf.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkbGF4eHhpcXZkY214YndhY3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2Nzc4NTAsImV4cCI6MjA5NzI1Mzg1MH0.4CTmNZwpzWIRWmu7kE2TLpuBgirokdt1M2P0pJD6TWs';

const HEADERS = {
  'apikey':        SUPABASE_ANON,
  'Authorization': `Bearer ${SUPABASE_ANON}`,
  'Content-Type':  'application/json',
  'Prefer':        'return=representation'
};

/* ─── Estado global ─────────────────────────────── */
let allOpportunities = [];
let likedIds = new Set(JSON.parse(localStorage.getItem('liked_ids') || '[]'));

/* ─── Helpers API ────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...HEADERS, ...(options.headers || {}) }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function fetchOpportunities({ city, country, category, sort } = {}) {
  let params = 'select=*';
  if (city)     params += `&city=ilike.*${encodeURIComponent(city)}*`;
  if (country)  params += `&country=ilike.*${encodeURIComponent(country)}*`;
  if (category) params += `&category=eq.${encodeURIComponent(category)}`;
  params += sort === 'likes'
    ? '&order=likes.desc,created_at.desc'
    : '&order=created_at.desc';

  return apiFetch(`opportunities?${params}`);
}

async function insertOpportunity(data) {
  return apiFetch('opportunities', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

async function updateLikes(id, currentLikes) {
  return apiFetch(`opportunities?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ likes: currentLikes + 1 })
  });
}

/* ─── Render ─────────────────────────────────────── */
function potentialClass(potential) {
  if (potential.includes('Alto'))         return 'potential-high';
  if (potential.includes('Medio'))        return 'potential-medium';
  return 'potential-dev';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderCards(data) {
  const grid  = document.getElementById('cardsGrid');
  const empty = document.getElementById('emptyState');

  grid.innerHTML = '';

  if (!data || data.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  data.forEach((op, i) => {
    const isLiked = likedIds.has(op.id);
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${i * 0.05}s`;
    card.innerHTML = `
      <div class="card-top">
        <div class="card-name">${escHtml(op.name)}</div>
        <span class="card-potential ${potentialClass(op.potential)}">${escHtml(op.potential)}</span>
      </div>
      <div class="card-location">
        <span>📍 ${escHtml(op.city)}</span>
        <span>·</span>
        <span>🌎 ${escHtml(op.country)}</span>
      </div>
      <div>
        <div class="card-label">Problema detectado</div>
        <div class="card-text">${escHtml(op.problem)}</div>
      </div>
      <div class="card-solution">
        <div class="card-label">✨ Solución con IA</div>
        <div class="card-text">${escHtml(op.ai_solution)}</div>
      </div>
      <div class="card-footer">
        <span class="card-category">${escHtml(op.category)}</span>
        <button class="btn-like ${isLiked ? 'liked' : ''}"
                id="like-btn-${op.id}"
                data-id="${op.id}"
                data-likes="${op.likes}"
                title="Dar like">
          <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
          <span class="like-count">${op.likes}</span>
        </button>
      </div>
      <div class="card-date">Publicado el ${formatDate(op.created_at)}</div>
    `;
    grid.appendChild(card);
  });

  // Delegación de eventos para likes
  grid.querySelectorAll('.btn-like').forEach(btn => {
    btn.addEventListener('click', handleLike);
  });
}

function updateStats(data) {
  if (!data) return;
  const cities      = new Set(data.map(o => o.city.toLowerCase())).size;
  const totalLikes  = data.reduce((s, o) => s + (o.likes || 0), 0);
  animateNumber('statTotal', data.length);
  animateNumber('statCities', cities);
  animateNumber('statLikes', totalLikes);
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  const start = parseInt(el.textContent) || 0;
  const diff  = target - start;
  if (diff === 0) return;
  const steps = 30;
  let step = 0;
  const interval = setInterval(() => {
    step++;
    el.textContent = Math.round(start + (diff * step / steps));
    if (step >= steps) clearInterval(interval);
  }, 16);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── Carga principal ────────────────────────────── */
async function loadOpportunities(filters = {}) {
  const loading = document.getElementById('loadingState');
  const empty   = document.getElementById('emptyState');
  loading.classList.remove('hidden');
  document.getElementById('cardsGrid').innerHTML = '';
  empty.classList.add('hidden');

  try {
    const sort = document.getElementById('sortBy').value;
    const data = await fetchOpportunities({ ...filters, sort });
    allOpportunities = data || [];
    renderCards(allOpportunities);
    updateStats(allOpportunities);
    updateSectionTitle(filters);
  } catch (e) {
    console.error(e);
    showToast('Error al cargar las oportunidades. Intenta de nuevo.', 'error');
  } finally {
    loading.classList.add('hidden');
  }
}

function updateSectionTitle(filters) {
  const parts = [];
  if (filters.city)     parts.push(`ciudad: ${filters.city}`);
  if (filters.country)  parts.push(`país: ${filters.country}`);
  if (filters.category) parts.push(`categoría: ${filters.category}`);
  const title = document.getElementById('sectionTitle');
  title.textContent = parts.length
    ? `Oportunidades — ${parts.join(' · ')}`
    : 'Todas las oportunidades';
}

/* ─── Likes ──────────────────────────────────────── */
async function handleLike(e) {
  const btn   = e.currentTarget;
  const id    = btn.dataset.id;
  const likes = parseInt(btn.dataset.likes, 10);

  if (likedIds.has(id)) {
    showToast('¡Ya le diste like a esta oportunidad! 👍', 'success');
    return;
  }

  // Optimistic UI
  btn.disabled = true;
  const icon  = btn.querySelector('.like-icon');
  const count = btn.querySelector('.like-count');
  icon.textContent  = '❤️';
  count.textContent = likes + 1;
  btn.classList.add('liked');

  try {
    await updateLikes(id, likes);
    btn.dataset.likes = likes + 1;
    likedIds.add(id);
    localStorage.setItem('liked_ids', JSON.stringify([...likedIds]));
    showToast('¡Like registrado! ❤️', 'success');
    // Actualizar stat de likes
    const total = parseInt(document.getElementById('statLikes').textContent) + 1;
    document.getElementById('statLikes').textContent = total;
  } catch (e) {
    // Revertir si falla
    icon.textContent  = '🤍';
    count.textContent = likes;
    btn.classList.remove('liked');
    console.error(e);
    showToast('Error al registrar el like.', 'error');
  } finally {
    btn.disabled = false;
  }
}

/* ─── Modal ──────────────────────────────────────── */
function openModal() {
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('fieldName').focus();
}
function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.body.style.overflow = '';
  document.getElementById('opportunityForm').reset();
  clearErrors();
}

document.getElementById('btnOpenModal').addEventListener('click', openModal);
document.getElementById('btnCloseModal').addEventListener('click', closeModal);
document.getElementById('btnCancelModal').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});

/* Cerrar con Escape */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* ─── Formulario ─────────────────────────────────── */
function clearErrors() {
  document.querySelectorAll('.form-group input, .form-group select, .form-group textarea')
    .forEach(el => el.classList.remove('error'));
}

function validateForm() {
  clearErrors();
  const fields = ['fieldName','fieldCity','fieldCountry','fieldProblem','fieldSolution','fieldCategory','fieldPotential'];
  let valid = true;
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) { el.classList.add('error'); valid = false; }
  });
  return valid;
}

document.getElementById('opportunityForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!validateForm()) {
    showToast('Por favor, completa todos los campos.', 'error');
    return;
  }

  const btn     = document.getElementById('btnSubmit');
  const txtNorm = btn.querySelector('.btn-submit-text');
  const txtLoad = btn.querySelector('.btn-submit-loading');
  btn.disabled  = true;
  txtNorm.classList.add('hidden');
  txtLoad.classList.remove('hidden');

  const payload = {
    name:        document.getElementById('fieldName').value.trim(),
    city:        document.getElementById('fieldCity').value.trim(),
    country:     document.getElementById('fieldCountry').value.trim(),
    problem:     document.getElementById('fieldProblem').value.trim(),
    ai_solution: document.getElementById('fieldSolution').value.trim(),
    category:    document.getElementById('fieldCategory').value,
    potential:   document.getElementById('fieldPotential').value,
    likes:       0
  };

  try {
    await insertOpportunity(payload);
    closeModal();
    showToast('¡Oportunidad publicada con éxito! 🚀', 'success');
    await loadOpportunities();
  } catch (err) {
    console.error(err);
    showToast('Error al publicar. Intenta de nuevo.', 'error');
  } finally {
    btn.disabled = false;
    txtNorm.classList.remove('hidden');
    txtLoad.classList.add('hidden');
  }
});

/* ─── Filtros ────────────────────────────────────── */
document.getElementById('btnFilter').addEventListener('click', applyFilters);
document.getElementById('sortBy').addEventListener('change', applyFilters);

document.getElementById('filterCity').addEventListener('keydown',    e => { if (e.key === 'Enter') applyFilters(); });
document.getElementById('filterCountry').addEventListener('keydown', e => { if (e.key === 'Enter') applyFilters(); });

function applyFilters() {
  const city     = document.getElementById('filterCity').value.trim();
  const country  = document.getElementById('filterCountry').value.trim();
  const category = document.getElementById('filterCategory').value;
  loadOpportunities({ city, country, category });
}

document.getElementById('btnClear').addEventListener('click', () => {
  document.getElementById('filterCity').value     = '';
  document.getElementById('filterCountry').value  = '';
  document.getElementById('filterCategory').value = '';
  loadOpportunities();
});

/* ─── Toast ──────────────────────────────────────── */
let toastTimer;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent  = msg;
  toast.className    = `toast ${type}`;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

/* ─── Init ───────────────────────────────────────── */
loadOpportunities();
