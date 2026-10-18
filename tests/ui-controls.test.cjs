const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const results = [];
const test = (name, callback) => {
  try { callback(); results.push({ name, status: 'PASS' }); }
  catch (error) { results.push({ name, status: 'FAIL', error: error.message }); }
};

function node() {
  return { style: {}, listeners: {}, setAttribute(name, value) { this[name] = value; },
    addEventListener(name, callback) { (this.listeners[name] ??= []).push(callback); } };
}

function fixture() {
  const events = {};
  const containers = Array.from({ length: 12 }, (_, index) => {
    const elements = Object.fromEntries(['.bal-before', '.bal-afterPosition', '.bal-handle', '.bal-before-inset']
      .map(key => [key, node()]));
    return { ...node(), elements, offsetWidth: 300, offsetLeft: 10,
      getBoundingClientRect() { return { left: 100 + index * 310, width: this.offsetWidth }; },
      querySelector(selector) { return elements[selector]; } };
  });
  const window = { addEventListener(name, callback) { (events[name] ??= []).push(callback); } };
  const document = { querySelector(selector) { return containers[Number(selector.replace('#example', '')) - 1]; } };
  const context = vm.createContext({ window, document });
  vm.runInContext(fs.readFileSync(path.join(root, 'static/js/script.js'), 'utf8') + '\nglobalThis.BeforeAfter = BeforeAfter;', context);
  containers.forEach((_, index) => new context.BeforeAfter({ id: '#example' + (index + 1) }));
  return { events, containers };
}

test('all comparison images resize', () => {
  const { events, containers } = fixture();
  containers.forEach(container => container.offsetWidth = 180);
  events.resize.forEach(callback => callback());
  containers.forEach(container => assert.equal(container.elements['.bal-before-inset'].style.width, '180px'));
});

test('mouse coordinates are relative to the comparison, not a child', () => {
  const { containers } = fixture(), container = containers[4];
  container.listeners.mousemove[0]({ clientX: container.getBoundingClientRect().left + 210, offsetX: 20 });
  assert.equal(container.elements['.bal-before'].style.width, '70%');
});

test('touch movement has one listener and uses the same coordinate space', () => {
  const { containers } = fixture(), container = containers[7];
  for (let i = 0; i < 3; i++) (container.listeners.touchstart || []).forEach(callback => callback({}));
  assert.equal(container.listeners.touchmove.length, 1);
  container.listeners.touchmove[0]({ changedTouches: [{ clientX: container.getBoundingClientRect().left + 90 }] });
  assert.equal(container.elements['.bal-before'].style.width, '30%');
});

test('absent interpolation panel does not preload missing assets', () => {
  const requests = [], document = { querySelector: () => null };
  const wrapper = { click() { return this; }, on() { return this; }, prop() { return this; },
    empty() { return this; }, append() { return this; }, toggleClass() { return this; }, ready(callback) { callback(); } };
  const context = vm.createContext({ window: {}, document, $: () => wrapper, console,
    Image: class { set src(value) { requests.push(value); } },
    bulmaCarousel: { attach: () => [] }, bulmaSlider: { attach: () => [] } });
  vm.runInContext(fs.readFileSync(path.join(root, 'static/js/index.js'), 'utf8'), context);
  assert.equal(requests.length, 0);
});

test('offscreen video does not start and leaving the viewport pauses it', () => {
  let callback;
  const observed = [];
  const video = { plays: 0, pauses: 0,
    play() { this.plays++; return Promise.resolve(); }, pause() { this.pauses++; } };
  class Observer {
    constructor(listener) { callback = listener; }
    observe(target) { observed.push(target); }
  }
  const context = vm.createContext({ window: { IntersectionObserver: Observer }, IntersectionObserver: Observer,
    document: { querySelectorAll: () => [video] } });
  vm.runInContext(fs.readFileSync(path.join(root, 'static/js/media.js'), 'utf8'), context);
  assert.deepEqual(observed, [video]);
  assert.equal(video.plays, 0);
  callback([{ target: video, isIntersecting: true }]);
  assert.equal(video.plays, 1);
  callback([{ target: video, isIntersecting: false }]);
  assert.equal(video.pauses, 1);
});

test('older browsers retain native controls without a script error', () => {
  const context = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(root, 'static/js/media.js'), 'utf8'), context);
});

console.log(JSON.stringify(results, null, 2));
process.exitCode = results.every(result => result.status === 'PASS') ? 0 : 1;
