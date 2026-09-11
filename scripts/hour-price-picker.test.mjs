import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const data = ts.transpile(readFileSync(new URL('../src/data/hour-packages.ts', import.meta.url), 'utf8'), {module: ts.ModuleKind.CommonJS});
const exports = {};
vm.runInNewContext(data, {exports});
const source = readFileSync(new URL('../src/components/HourPricePicker.astro', import.meta.url), 'utf8');
const script = ts.transpile(source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import .*?;/s, ''), {target: ts.ScriptTarget.ES2022});

test('hour picker visits only approved prices, bounds buttons and initializes once', () => {
  let Picker;
  vm.runInNewContext(script, {
    HTMLElement: class {},
    nextPackageIndex: exports.nextPackageIndex,
    customElements: {get: () => undefined, define: (_, ctor) => { Picker = ctor; }},
  });
  const ui = new Picker();
  ui.dataset = {packages: JSON.stringify(exports.PAA_HOUR_PACKAGES), initialIndex: '1'};
  const elements = Object.fromEntries(['minus','plus','price','hours','announcement'].map(key => [key, {
    textContent: '', disabled: false, handlers: [], addEventListener(_, fn) {this.handlers.push(fn);},
    click() {if (!this.disabled) this.handlers.forEach(fn => fn());},
  }]));
  ui.querySelector = selector => elements[selector.match(/data-(\w+)/)[1]];
  ui.connectedCallback(); ui.connectedCallback();
  assert.equal(elements.plus.handlers.length, 1);
  const check = (hours, price) => {assert.equal(elements.hours.textContent, String(hours)); assert.equal(elements.price.textContent, price);};
  elements.minus.click(); check(5, '$4,900'); assert.equal(elements.minus.disabled,true);
  elements.minus.click(); check(5, '$4,900');
  elements.plus.click(); check(10, '$8,900');
  elements.plus.click(); check(20, '$16,900');
  elements.plus.click(); check(30, '$22,900'); assert.equal(elements.plus.disabled,true);
  elements.plus.click(); check(30, '$22,900');
  elements.minus.click(); check(20, '$16,900');
  assert.match(elements.announcement.textContent, /20 horas por \$16,900 MXN/);
});
