/* global document, window, setTimeout, clearTimeout */
const paths = {
  drop: '<path d="M12 3C10 6 5 11 5 15a7 7 0 0 0 14 0c0-4-5-9-7-12Z"/>',
  bottle: '<path d="M9 2h6v4l3 4v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10l3-4V2Z"/><path d="M9 6h6M6 12h12M9 16h6"/>',
  glass: '<path d="M5 3h14l-2 18H7L5 3Z"/><path d="M6 9h12"/>',
  home: '<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-8h6v8"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  flame: '<path d="M13 2c2 6-5 7-3 12 2-1 3-3 3-5 5 4 7 8 3 12-4 3-10 1-10-5 0-5 5-8 7-14Z"/>',
  undo: '<path d="M3 9h10a7 7 0 0 1 0 14M3 9l5-5M3 9l5 5" transform="translate(0 -2)"/>',
  bell: '<path d="M5 16h14l-2-3V9a5 5 0 0 0-10 0v4l-2 3ZM10 20h4M12 2v2"/>',
  settings: '<path d="m9 3-1 3-3 1-2 4 2 3v3l4 3 3-1 3 1 4-3v-3l2-3-2-4-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/>',
};
function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name]}</svg>`; }
document.querySelectorAll('[data-icon]').forEach(node => { node.innerHTML = icon(node.dataset.icon); });
const $ = selector => document.querySelector(selector);
const format = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const volume = value => value >= 1000 ? `${format.format(value / 1000)} L` : `${format.format(value)} ml`;
const settings = { bottle: 500, glass: 250, goal: 2 };
let entries = [];
let completedToday = false;
let selectedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let noticeTimer;
const today = new Date();
const key = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const todayKey = key(today);
const demoHistory = {};
for (let index = 1; index <= 3; index += 1) {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - index);
  demoHistory[key(date)] = 2000 + index * 150;
}
$('#date').textContent = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(today);
function notify(message) {
  clearTimeout(noticeTimer);
  $('#notice').textContent = message;
  noticeTimer = setTimeout(() => { $('#notice').textContent = ''; }, 2800);
}
function calendar(total) {
  const year = selectedMonth.getFullYear(); const month = selectedMonth.getMonth();
  $('#month').textContent = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(selectedMonth);
  $('#next-month').disabled = year === today.getFullYear() && month === today.getMonth();
  const names = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'];
  let html = names.map(name => `<span class="weekday">${name}</span>`).join('');
  html += '<span aria-hidden="true"></span>'.repeat(new Date(year, month, 1).getDay());
  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day += 1) {
    const date = new Date(year, month, day); const dayKey = key(date);
    const future = dayKey > todayKey; const isToday = dayKey === todayKey;
    const amount = isToday ? total : demoHistory[dayKey];
    const completed = isToday ? completedToday : amount !== undefined;
    const symbol = future ? '—' : completed ? '✓' : isToday ? '·' : '—';
    const label = future ? '' : amount === undefined ? 'Sem dados' : volume(amount);
    const fullDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
    html += `<div class="calendar-day${future ? ' future' : ''}${isToday ? ' today' : ''}${completed ? ' completed' : ''}" aria-label="${fullDate}: ${label || 'Dia futuro'}"><strong>${day}</strong><span aria-hidden="true">${symbol}</span><small>${label}</small></div>`;
  }
  $('#calendar-grid').innerHTML = html;
}
function render() {
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0);
  const remaining = Math.max(0, settings.goal * 1000 - total);
  const percentage = Math.min(total / (settings.goal * 1000), 1);
  if (percentage >= 1) completedToday = true;
  $('#total').textContent = volume(total);
  $('#goal-caption').textContent = `de ${format.format(settings.goal)} L hoje`;
  $('#percentage').textContent = `${Math.floor(percentage * 100)}%`;
  $('#progress-ring').style.strokeDashoffset = 609.47 * (1 - percentage);
  $('#remaining-caption').textContent = remaining > 0 ? `Faltam ${volume(remaining)} para a meta.` : 'Meta alcançada!';
  $('#encouragement').textContent = percentage >= 1 ? 'Um hábito para comemorar!' : percentage >= 0.5 ? 'Você está no caminho!' : 'Cada gole conta.';
  $('#streak').textContent = `${completedToday ? 4 : 3} dias`;
  for (const type of ['bottle', 'glass']) {
    $(`#${type}-button-size`).textContent = `${format.format(settings[type])} ml`;
    $(`#${type}-size`).textContent = `${format.format(settings[type])} ml`;
  }
  const bottles = entries.filter(entry => entry.container === 'bottle').length;
  const glasses = entries.length - bottles;
  $('#counts').textContent = `${bottles} ${bottles === 1 ? 'garrafa' : 'garrafas'} · ${glasses} ${glasses === 1 ? 'copo' : 'copos'}`;
  $('#recorded-vessels').innerHTML = entries.slice(-12).map(entry => icon(entry.container)).join('');
  $('#remaining-total').textContent = volume(remaining);
  $('#remaining-options').hidden = remaining === 0;
  const bottlesNeeded = Math.ceil(remaining / settings.bottle); const glassesNeeded = Math.ceil(remaining / settings.glass);
  $('#bottles-needed').textContent = `${format.format(bottlesNeeded)} ${bottlesNeeded === 1 ? 'garrafa' : 'garrafas'}`;
  $('#glasses-needed').textContent = `${format.format(glassesNeeded)} ${glassesNeeded === 1 ? 'copo' : 'copos'}`;
  $('#bottles-needed-size').textContent = `${format.format(settings.bottle)} ml`;
  $('#glasses-needed-size').textContent = `${format.format(settings.glass)} ml`;
  $('#undo').disabled = !entries.length;
  $('#reset').disabled = !entries.length;
  calendar(total);
}
for (const container of ['bottle', 'glass']) {
  $(`#add-${container}`).addEventListener('click', () => {
    entries.push({ container, amount: settings[container] }); render();
    notify(`+${format.format(settings[container])} ml registrados`);
  });
}
$('#undo').addEventListener('click', () => { entries.pop(); render(); notify('Último registro desfeito'); });
$('#reset').addEventListener('click', () => { if (window.confirm('Zerar os registros de demonstração de hoje?')) { entries = []; render(); } });
for (const [selector, delta] of [['#previous-month', -1], ['#next-month', 1]]) {
  $(selector).addEventListener('click', () => { selectedMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + delta, 1); render(); });
}
function navigate() {
  const destination = window.location.hash === '#benefits' ? 'benefits' : 'home';
  $('#home').hidden = destination !== 'home'; $('#benefits').hidden = destination !== 'benefits';
  document.querySelectorAll('.bottom-nav a').forEach(link => {
    if (link.hash === `#${destination}`) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  $('.phone-content').scrollTop = 0;
  $(`#${destination} h2`).focus({ preventScroll: true });
}
window.addEventListener('hashchange', navigate);
function openSettings() {
  $('#bottle-input').value = settings.bottle; $('#glass-input').value = settings.glass; $('#goal-input').value = settings.goal;
  $('#dark-mode').checked = document.body.classList.contains('dark');
  $('#settings-dialog').showModal();
}
$('#settings').addEventListener('click', openSettings);
$('#edit-sizes').addEventListener('click', openSettings);
$('#cancel-settings').addEventListener('click', () => $('#settings-dialog').close());
$('#settings-form').addEventListener('submit', event => {
  event.preventDefault();
  settings.bottle = Number($('#bottle-input').value); settings.glass = Number($('#glass-input').value); settings.goal = Number($('#goal-input').value);
  document.body.classList.toggle('dark', $('#dark-mode').checked);
  $('#settings-dialog').close(); render();
});
$('#reminders').addEventListener('click', () => notify('Na versão iOS, os lembretes serão configurados pelas notificações do iPhone.'));
render();
navigate();
