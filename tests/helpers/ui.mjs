import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { IDBFactory } from 'fake-indexeddb';
import initSqlJs from 'sql.js';
import React, { act } from 'react';


// jsdom simulates dialog/cancel APIs; native behavior belongs to e2e tests.
// Top-level node:test cases sharing globals run serially in each test process.
export async function ui(t) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/sip-by-sip/' });
  const { document } = dom.window;
  const previous = new Map();
  for (const [name, value] of Object.entries({ window: dom.window, document: dom.window.document,
    localStorage: dom.window.localStorage, sessionStorage: dom.window.sessionStorage,
    IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  dom.window.matchMedia = () => ({ matches: true });
  dom.window.scrollTo = () => {};
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  let downloads = 0;
  const anchorClick = dom.window.HTMLAnchorElement.prototype.click;
  dom.window.HTMLAnchorElement.prototype.click = function () {
    if (this.hasAttribute('download')) downloads += 1;
    else anchorClick.call(this);
  };
  const server = await createServer({ configFile: false, server: { middlewareMode: true, ws: false }, appType: 'custom' });
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(document.getElementById('root'));
  const pause = () => new Promise(resolve => setTimeout(resolve, 15));
  async function settle() { await act(async () => { await pause(); }); }
  async function until(check) {
    for (let i = 0; i < 80; i += 1) { await settle(); if (check()) return; }
    assert.fail('Timed out waiting for UI');
  }
  function button(text, scope = document) { const found = [...scope.querySelectorAll('button')].find(node => node.textContent.trim() === text); assert.ok(found, `Missing button: ${text}`); return found; }
  async function click(text, scope) { await act(async () => { button(text, scope).click(); await pause(); }); }
  async function choose(backup) {
    const input = document.querySelector('input[type="file"]');
    const text = typeof backup === 'string' ? backup : JSON.stringify(backup);
    Object.defineProperty(input, 'files', { configurable: true, value: [{ size: Buffer.byteLength(text), text: async () => text }] });
    await act(async () => { input.dispatchEvent(new dom.window.Event('change', { bubbles: true })); await pause(); });
  }
  t.after(async () => {
    await act(async () => { root.unmount(); });
    await server.close(); dom.window.close();
    for (const [name, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });

  const load = path => server.ssrLoadModule(`/src/${path}`);
  const database = await load('database.js');
  const profiles = await load('profiles.js');
  const state = await load('state.js');
  await database.initializeDatabase({ SQL: await initSqlJs(), indexedDB: new IDBFactory(), legacyStorage: dom.window.localStorage });
  async function render(Component, props = {}) { await act(async () => { root.render(React.createElement(Component, props)); }); }
  async function input(selector, value) {
    const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
    assert.ok(element, `Missing input: ${selector}`);
    await act(async () => {
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(element, String(value));
      element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    });
  }
  async function submit(selector = 'form') {
    await act(async () => { document.querySelector(selector).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true })); });
  }
  async function escape(selector = 'dialog') {
    await act(async () => { document.querySelector(selector).dispatchEvent(new dom.window.Event('cancel', { cancelable: true })); });
  }
  async function seed() {
    const salt = 'destination-salt';
    const destination = { id: 'destination', username: 'Destination', age: 50, weight: 90,
      goalLiters: 3, onboardingComplete: true, salt, passwordHash: await profiles.hashPassword('destination-password', salt) };
    await database.saveProfile(destination, { create: true });
    await database.saveProgress('aguaApp:perfil:destination', state.addWater(state.newState(), 250, 'glass'));
    profiles.setSession(destination);
    return destination;
  }
  async function dashboard() {
    const profile = await seed();
    const { default: Prototype } = await load('Prototype.jsx');
    await render(Prototype);
    await until(() => document.querySelector('.total')?.textContent === '250 ml');
    return profile;
  }
  return { dom, document, server, root, pause, settle, until, button, click, choose, load, database, profiles, state,
    render, input, submit, escape, seed, dashboard, downloads: () => downloads };
}
