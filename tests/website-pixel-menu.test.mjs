import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { afterEach, beforeEach, test } from 'node:test'

const require = createRequire(import.meta.url)
const websiteRequire = createRequire(new URL('../package.json', import.meta.url))
const { JSDOM } = require('jsdom')
const ts = require('typescript')
const { act, createElement } = websiteRequire('react')
const { createRoot } = websiteRequire('react-dom/client')
const { gsap } = websiteRequire('gsap')
const source = readFileSync(new URL('../src/components/pixel-menu.tsx', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
})
const componentModule = { exports: {} }
new Function('require', 'module', 'exports', compiled.outputText)(
  websiteRequire, componentModule, componentModule.exports,
)
const { PixelMenu } = componentModule.exports
let dom, root, container, active, reducedMotion, mediaListeners
const originalGlobals = new Map()
const originalRandom = Math.random

beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>')
  for (const key of ['window', 'document', 'getComputedStyle', 'IS_REACT_ACT_ENVIRONMENT']) {
    originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
  }
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  reducedMotion = false
  mediaListeners = new Set()
  dom.window.matchMedia = () => ({
    get matches() { return reducedMotion },
    addEventListener(type, listener) { if (type === 'change') mediaListeners.add(listener) },
    removeEventListener(type, listener) { if (type === 'change') mediaListeners.delete(listener) },
  })
  active = false
  let randomCalls = 0
  Math.random = () => (++randomCalls % 2 ? 0.1 : 0.9)
  container = dom.window.document.getElementById('root')
  root = createRoot(container)
})

afterEach(async () => {
  await act(() => root.unmount())
  gsap.globalTimeline.clear()
  gsap.ticker.sleep()
  Math.random = originalRandom
  dom.window.close()
  for (const [key, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor)
    else delete globalThis[key]
  }
})

const onActiveChange = (value) => { active = value }
async function renderMenu(open) {
  await act(() => root.render(createElement(PixelMenu, { open, onActiveChange },
    createElement('div', null,
      createElement('a', { href: '/doi-ngu', 'data-menu-item': '' }, 'Đội ngũ'),
      createElement('a', { href: '/tin-tuc', 'data-menu-item': '' }, 'Tin tức'),
    ),
  )))
  gsap.ticker.sleep()
}
const menu = () => container.querySelector('#site-menu')
const linksInert = () => container.querySelector('a').closest('[inert]') !== null
const pixels = () => [...container.querySelectorAll('[data-menu-pixel]')]
const timeline = () => {
  const animation = gsap.getById('site-menu-transition')
  assert.ok(animation, 'The menu must have an animation to reveal its pixel background')
  return animation
}
async function seek(time) {
  await act(() => { timeline().pause().time(time, false) })
}
async function finish() {
  await act(() => { timeline().pause().progress(1, false) })
}

test('reveals scattered pixels across the screen and waits for the slower background before showing links', async () => {
  await renderMenu(false)
  assert.equal(menu().style.visibility, 'hidden')
  await renderMenu(true)
  assert.equal(menu().style.visibility, 'visible')
  assert.equal(active, true)
  assert.equal(menu().hasAttribute('inert'), false, 'The overlay must intercept clicks while its content is disabled')
  assert.equal(linksInert(), true)
  await seek(0.4)
  const top = pixels().filter(pixel => pixel.style.top === '0px')
  const lastTop = pixels().at(-1).style.top
  const bottom = pixels().filter(pixel => pixel.style.top === lastTop)
  assert.ok(top.length > 0 && bottom.length > 0)
  for (const row of [top, bottom]) {
    assert.ok(row.some(pixel => pixel.style.opacity === '1'))
    assert.ok(row.some(pixel => pixel.style.opacity === '0'))
  }
  await seek(0.6)
  assert.ok(pixels().some(pixel => pixel.style.opacity === '0'))
  assert.equal(container.querySelector('[data-menu-item]').style.opacity, '0')
  await seek(0.8)
  assert.ok(pixels().every(pixel => pixel.style.opacity === '1'))
  assert.equal(container.querySelector('[data-menu-item]').style.opacity, '0')
  await finish()
  assert.ok(pixels().every(pixel => pixel.style.opacity === '1'))
  assert.equal(container.querySelector('[data-menu-item]').style.opacity, '1')
  assert.equal(linksInert(), false)
})

test('keeps the overlay active until scattered pixels finish closing', async () => {
  await renderMenu(true)
  await finish()
  await renderMenu(false)
  assert.equal(active, true)
  assert.equal(menu().style.visibility, 'visible')
  assert.equal(linksInert(), true)
  await seek(0.4)
  assert.equal(container.querySelector('[data-menu-item]').style.opacity, '0')
  assert.ok(pixels().some(pixel => pixel.style.opacity === '1'))
  assert.ok(pixels().some(pixel => pixel.style.opacity === '0'))
  await seek(0)
  assert.equal(active, false)
  assert.equal(menu().style.visibility, 'hidden')
})

test('reverses the current animation when toggled repeatedly', async () => {
  await renderMenu(true)
  await seek(0.2)
  const animation = timeline()
  await renderMenu(false)
  await seek(0.1)
  await renderMenu(true)
  assert.equal(timeline(), animation)
  await finish()
  assert.equal(active, true)
  assert.equal(linksInert(), false)
  await renderMenu(false)
  await seek(0)
  assert.equal(active, false)
})

test('covers the resized viewport while retaining the open menu', async () => {
  await renderMenu(true)
  await finish()
  Object.defineProperties(dom.window, {
    innerWidth: { value: 390, configurable: true },
    innerHeight: { value: 844, configurable: true },
  })
  await act(() => dom.window.dispatchEvent(new dom.window.Event('resize')))
  const right = Math.max(...pixels().map(pixel => parseFloat(pixel.style.left) + parseFloat(pixel.style.width)))
  const bottom = Math.max(...pixels().map(pixel => parseFloat(pixel.style.top) + parseFloat(pixel.style.height)))
  assert.ok(right >= 390 && bottom >= 844)
  assert.ok(pixels().every(pixel => pixel.style.width === pixel.style.height))
  assert.ok(pixels().every(pixel => pixel.style.opacity === '1'))
  assert.equal(linksInert(), false)
})

test('opens and closes immediately for reduced motion, including preference changes', async () => {
  reducedMotion = true
  await renderMenu(true)
  assert.equal(menu().style.visibility, 'visible')
  assert.equal(linksInert(), false)
  await renderMenu(false)
  assert.equal(menu().style.visibility, 'hidden')
  assert.equal(active, false)
  reducedMotion = false
  await act(() => { for (const listener of mediaListeners) listener() })
  await renderMenu(true)
  await seek(0.1)
  reducedMotion = true
  await act(() => { for (const listener of mediaListeners) listener() })
  assert.equal(linksInert(), false)
})

test('removes animation and media listeners when unmounted', async () => {
  await renderMenu(true)
  const animation = timeline()
  await act(() => root.render(null))
  assert.equal(animation.parent, null)
  assert.equal(mediaListeners.size, 0)
})
