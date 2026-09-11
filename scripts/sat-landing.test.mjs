import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

// Run the actual landing script with a small DOM fixture and a mocked API.
// These tests never send email, open WhatsApp, or connect to a database.
const source = readFileSync(new URL('../src/pages/cursos/[slug].astro', import.meta.url), 'utf8');
const script = source.match(/<script define:vars=[^>]*>([\s\S]*?)<\/script>/)[1];
const flush = () => new Promise(resolve => setImmediate(resolve));
function setup(response = async () => ({ ok: true, json: async () => ({ success: true }) })) {
  const node = (dataset = {}) => ({
    dataset, attrs: {}, listeners: {}, children: [], textContent: '', disabled: false,
    addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); },
    setAttribute(key, value) { this.attrs[key] = value; },
    removeAttribute(key) { delete this.attrs[key]; },
    append(child) { this.children.push(child); },
    focus() { document.activeElement = this; },
    click() { this.listeners.click?.forEach(fn => fn({})); },
  });
  const tabs = [node({ index: '0' }), node({ index: '1' })];
  const panels = [node({ index: '0' }), node({ index: '1' })];
  panels[1].hidden = true;
  const root = node();
  root.querySelectorAll = selector => selector === '[data-exam-tab]' ? tabs : panels;
  const fields = Object.fromEntries(['nombre', 'correo', 'telefono'].map(name => [name, node()]));
  const submit = node(), status = node(), form = node();
  form.values = { nombre: 'Prueba local', correo: 'test@example.invalid', telefono: '' };
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
  vm.runInNewContext(`const isSat = true, exam = 'SAT', whatsapp = '15555550100';\n${script}`, {
    document, window: { location: { href: 'http://local.test/cursos/sat' }, dataLayer: events },
    FormData: class { constructor(f) { this.values = f.values; } get(key) { return this.values[key]; } },
    AbortController, setTimeout, clearTimeout,
    fetch: (...args) => { calls.push(args); return response(...args); },
  });
  const send = () => form.listeners.submit[0]({ preventDefault() {} });
  return { document, root, tabs, panels, form, fields, submit, status, calls, events, send };
}

test('SAT tabs switch panel, ARIA state and keyboard focus without duplicate listeners', () => {
  const ui = setup();
  ui.tabs[1].click();
  assert.equal(ui.panels[0].hidden, true);
  assert.equal(ui.panels[1].hidden, false);
  assert.equal(ui.tabs[1].attrs['aria-selected'], 'true');
  ui.tabs[1].focus();
  ui.root.listeners.keydown[0]({ key: 'ArrowLeft', preventDefault() {} });
  assert.equal(ui.document.activeElement, ui.tabs[0]);
  assert.equal(ui.panels[0].hidden, false);
  ui.document.callbacks['astro:page-load']();
  assert.equal(ui.tabs[0].listeners.click.length, 1);
  assert.equal(ui.form.listeners.submit.length, 1);
});

test('invalid name/email do not call the API', () => {
  const ui = setup();
  ui.form.values.nombre = ''; ui.send();
  assert.match(ui.status.textContent, /nombre/);
  ui.form.values.nombre = 'Prueba'; ui.form.values.correo = 'incorrecto'; ui.send();
  assert.match(ui.status.textContent, /correo válido/);
  assert.equal(ui.calls.length, 0);
});

test('HTTP failure offers retry/WhatsApp and never reports success', async () => {
  const ui = setup(async () => ({ ok: false }));
  ui.send(); await flush();
  assert.match(ui.status.textContent, /No pudimos enviar/);
  assert.equal(ui.submit.disabled, false);
  assert.equal(ui.events.length, 0);
  assert.match(ui.status.children[0].href, /^https:\/\/wa.me\//);
});

test('network failure releases the submit button', async () => {
  const ui = setup(async () => { throw new Error('offline'); });
  ui.send(); await flush();
  assert.match(ui.status.textContent, /No pudimos enviar/);
  assert.equal(ui.submit.disabled, false);
});

test('success is confirmed by the API; double submit makes only one request', async () => {
  let complete;
  const ui = setup(() => new Promise(resolve => { complete = resolve; }));
  ui.send(); ui.send();
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.submit.disabled, true);
  assert.equal(JSON.parse(ui.calls[0][1].body).curso, 'SAT');
  complete({ ok: true, json: async () => ({ success: true }) });
  await flush();
  assert.match(ui.status.textContent, /¡Mensaje enviado!/);
  assert.equal(ui.submit.disabled, false);
  assert.equal(ui.events.length, 1);
  assert.equal(ui.status.children[0].rel, 'noopener noreferrer');
});
