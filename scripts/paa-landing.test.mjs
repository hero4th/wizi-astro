import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

// Run the actual landing script with a small DOM fixture and a mocked API.
// These tests never send email, open WhatsApp, or connect to a database.
const source = readFileSync(new URL('../src/pages/cursos/[slug].astro', import.meta.url), 'utf8');
const scriptMatch = source.match(/<script define:vars=[^>]*>([\s\S]*?)<\/script>/);
const script = scriptMatch[1];
const flush = () => new Promise(resolve => setImmediate(resolve));

function setup(response = async () => ({ ok: true, json: async () => ({ success: true }) })) {
  const node = (dataset = {}) => ({
    dataset, attrs: {}, listeners: {}, children: [], textContent: '', disabled: false, style: {},
    addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); },
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; },
    append(child) { this.children.push(child); },
    focus() { document.activeElement = this; },
    click() { this.listeners.click?.forEach(fn => fn({})); },
  });
  const tabs = [node({ index: '0' }), node({ index: '1' }), node({ index: '2' }), node({ index: '3' })];
  const panels = [node({ index: '0' }), node({ index: '1' }), node({ index: '2' }), node({ index: '3' })];
  panels[1].hidden = true;
  panels[2].hidden = true;
  panels[3].hidden = true;
  const root = node();
  root.querySelectorAll = selector => selector === '[data-exam-tab]' ? tabs : panels;
  const fields = Object.fromEntries(['nombre', 'correo', 'telefono'].map(name => [name, node()]));
  const submit = node(), status = node(), form = node();
  form.values = { nombre: 'Estudiante PAA', correo: 'aspirante@tec.mx', telefono: '5512345678' };
  form.querySelector = selector => selector.startsWith('button') ? submit : fields[selector.match(/name="(.*?)"/)[1]];
  form.querySelectorAll = () => Object.values(fields);
  const document = {
    activeElement: null, callbacks: {},
    querySelector: () => root,
    getElementById: id => id === 'course-msg-form' ? form : status,
    createElement: () => node(),
    addEventListener(type, fn) { this.callbacks[type] = fn; },
  };
  const calls = [], events = [];
  vm.runInNewContext(`const isModernCourse = true, exam = 'PAA', whatsapp = '15555550100';\n${script}`, {
    document, window: { location: { href: 'http://local.test/cursos/paa' }, dataLayer: events },
    FormData: class { constructor(f) { this.values = f.values; } get(key) { return this.values[key]; } },
    AbortController, setTimeout, clearTimeout,
    fetch: (...args) => { calls.push(args); return response(...args); },
  });
  const send = () => form.listeners.submit[0]({ preventDefault() {} });
  return { document, root, tabs, panels, form, fields, submit, status, calls, events, send };
}

test('PAA 4 tabs switch panel, ARIA state and keyboard focus across all sections', () => {
  const ui = setup();
  // Click on Math tab (index 2)
  ui.tabs[2].click();
  assert.equal(ui.panels[0].hidden, true);
  assert.equal(ui.panels[2].hidden, false);
  assert.equal(ui.tabs[2].attrs['aria-selected'], 'true');
  assert.equal(ui.tabs[0].attrs['aria-selected'], 'false');

  // Navigate with keyboard
  ui.tabs[2].focus();
  ui.root.listeners.keydown[0]({ key: 'ArrowRight', preventDefault() {} });
  assert.equal(ui.document.activeElement, ui.tabs[3]);
  assert.equal(ui.panels[3].hidden, false);

  // Home key navigates to first tab
  ui.root.listeners.keydown[0]({ key: 'Home', preventDefault() {} });
  assert.equal(ui.document.activeElement, ui.tabs[0]);
  assert.equal(ui.panels[0].hidden, false);
});

test('PAA contact form validates name and email before sending', () => {
  const ui = setup();
  ui.form.values.nombre = '';
  ui.send();
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.fields.nombre.attrs['aria-invalid'], 'true');

  ui.form.values.nombre = 'Aspirante Tec';
  ui.form.values.correo = 'invalido';
  ui.send();
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.fields.correo.attrs['aria-invalid'], 'true');
});

test('PAA contact form prevents double submit and tracks generate_lead', async () => {
  let resolveResponse;
  const promise = new Promise(resolve => { resolveResponse = resolve; });
  const ui = setup(() => promise);
  ui.send();
  assert.equal(ui.submit.disabled, true);
  assert.equal(ui.form.dataset.submitting, 'true');

  // Trigger again while submitting: should not fire second fetch
  ui.send();
  assert.equal(ui.calls.length, 1);

  resolveResponse({ ok: true, json: async () => ({ success: true }) });
  await flush();
  await flush();

  assert.equal(ui.events.length, 1);
  assert.equal(ui.events[0].event, 'generate_lead');
  assert.equal(ui.events[0].lead_exam, 'PAA');
  assert.equal(ui.submit.disabled, false);
});
