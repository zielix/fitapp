// ===== Dane =====
// Treningi trzymamy w localStorage telefonu (na start wystarczy, bez serwera).
const STORAGE_KEY = 'fitlog.workouts';

function loadWorkouts() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}
function saveWorkouts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

let workouts = loadWorkouts();

// ===== Pomocnicze =====
const $ = (sel) => document.querySelector(sel);

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // poniedziałek = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}
function volume(w) {
  // objętość = serie × powtórzenia × ciężar
  return w.exercises.reduce((s, e) => s + (e.sets || 0) * (e.reps || 0) * (e.weight || 0), 0);
}
function formatDate(iso) {
  return new Date(iso + 'T00:00').toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ===== Widoki =====
function showView(name) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  $('#view-' + name).classList.add('active');
  $('#fab').classList.toggle('hidden', name !== 'list');
  window.scrollTo(0, 0);
}

function renderList() {
  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  const weekStart = startOfWeek();
  const thisWeek = workouts.filter((w) => new Date(w.date + 'T00:00') >= weekStart);

  $('#statWeek').textContent = thisWeek.length;
  $('#statTotal').textContent = workouts.length;
  $('#statVolume').textContent = Math.round(thisWeek.reduce((s, w) => s + volume(w), 0)).toLocaleString('pl-PL');
  $('#weekSummary').textContent = thisWeek.length
    ? `Dobra robota — ${thisWeek.length} trening(i) w tym tygodniu 💪`
    : 'Czas na pierwszy trening w tym tygodniu';

  $('#emptyState').style.display = workouts.length ? 'none' : 'block';
  $('#workoutList').innerHTML = sorted.map((w) => `
    <li>
      <div class="head">
        <span class="title">${escapeHtml(w.name)}</span>
        <span class="date">${formatDate(w.date)}</span>
      </div>
      <div class="ex">${w.exercises.map((e) =>
        `${escapeHtml(e.name)}${e.sets ? ` — ${e.sets}×${e.reps || '?'}` : ''}${e.weight ? ` @ ${e.weight} kg` : ''}`
      ).join('<br>')}</div>
      ${w.note ? `<div class="note">${escapeHtml(w.note)}</div>` : ''}
      <button class="del" data-id="${w.id}">Usuń</button>
    </li>`).join('');
}

// ===== Formularz =====
function addExerciseRow() {
  const node = $('#exerciseTpl').content.cloneNode(true);
  node.querySelector('.ex-remove').addEventListener('click', (e) => e.target.closest('.exercise').remove());
  $('#exercises').appendChild(node);
}

function openForm() {
  const form = $('#workoutForm');
  form.reset();
  form.date.value = new Date().toISOString().slice(0, 10);
  $('#exercises').innerHTML = '';
  addExerciseRow();
  showView('add');
}

$('#workoutForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const exercises = [...document.querySelectorAll('.exercise')].map((row) => ({
    name: row.querySelector('.ex-name').value.trim(),
    sets: Number(row.querySelector('.ex-sets').value) || 0,
    reps: Number(row.querySelector('.ex-reps').value) || 0,
    weight: Number(row.querySelector('.ex-weight').value) || 0,
  })).filter((ex) => ex.name);

  workouts.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: form.name.value.trim(),
    date: form.date.value,
    note: form.note.value.trim(),
    exercises,
  });
  saveWorkouts(workouts);
  renderList();
  showView('list');
});

$('#workoutList').addEventListener('click', (e) => {
  const id = e.target.dataset.id;
  if (!id || !confirm('Usunąć ten trening?')) return;
  workouts = workouts.filter((w) => w.id !== id);
  saveWorkouts(workouts);
  renderList();
});

$('#fab').addEventListener('click', openForm);
$('#addExercise').addEventListener('click', addExerciseRow);
$('#cancelAdd').addEventListener('click', () => showView('list'));

renderList();

// ===== PWA: service worker (działanie offline) =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(console.error);
}

// ===== Niespodzianka dla Gosi =====
let heartTimer = null;

function spawnHeart() {
  const h = document.createElement('span');
  h.textContent = ['💖', '💕', '🎵', '✨', '🌸'][Math.floor(Math.random() * 5)];
  h.style.left = Math.random() * 100 + 'vw';
  h.style.fontSize = 18 + Math.random() * 22 + 'px';
  h.style.animationDuration = 3 + Math.random() * 3 + 's';
  $('#hearts').appendChild(h);
  h.addEventListener('animationend', () => h.remove());
}

$('#gosiaBtn').addEventListener('click', () => {
  $('#pigOverlay').hidden = false;
  if (navigator.vibrate) navigator.vibrate(50);
  heartTimer = setInterval(spawnHeart, 250);
});

$('#pigOverlay').addEventListener('click', () => {
  $('#pigOverlay').hidden = true;
  clearInterval(heartTimer);
  $('#hearts').innerHTML = '';
});
