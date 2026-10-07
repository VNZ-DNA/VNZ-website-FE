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
const source = readFileSync(new URL('../src/components/member-sprite.tsx', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
})
const componentModule = { exports: {} }
new Function('require', 'module', 'exports', compiled.outputText)(
  websiteRequire, componentModule, componentModule.exports,
)
const { MemberSprite } = componentModule.exports

let dom, root, container, images, draws, timers, reducedMotion, motionListeners, alphaData
const originalGlobals = new Map()
const spriteUrl = 'https://res.cloudinary.com/example/image/upload/v1/tan-hat.png'
const avatarUrl = 'https://res.cloudinary.com/example/image/upload/v1/tan.png'

beforeEach(() => {
  dom = new JSDOM('<div id="root"></div>')
  for (const key of ['window', 'document', 'IS_REACT_ACT_ENVIRONMENT']) {
    originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
  }
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  images = []
  draws = []
  alphaData = null
  timers = new Map()
  reducedMotion = false
  motionListeners = new Set()
  dom.window.Image = function () {
    const image = dom.window.document.createElement('img')
    images.push(image)
    return image
  }
  dom.window.HTMLCanvasElement.prototype.getContext = () => ({
    clearRect() {},
    drawImage(...args) { draws.push(args) },
    getImageData() {
      if (!alphaData) throw new Error('Image pixels are unavailable')
      return { data: alphaData }
    },
    imageSmoothingEnabled: true,
  })
  let timerId = 0
  dom.window.setInterval = (callback, delay) => {
    const id = ++timerId
    timers.set(id, { callback, delay })
    return id
  }
  dom.window.clearInterval = (id) => timers.delete(id)
  dom.window.matchMedia = () => ({
    get matches() { return reducedMotion },
    addEventListener(type, listener) { if (type === 'change') motionListeners.add(listener) },
    removeEventListener(type, listener) { if (type === 'change') motionListeners.delete(listener) },
  })
  container = dom.window.document.getElementById('root')
  root = createRoot(container)
})

afterEach(async () => {
  await act(() => root.unmount())
  dom.window.close()
  for (const [key, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor)
    else delete globalThis[key]
  }
})

async function renderSprite(props = {}) {
  await act(() => root.render(createElement(MemberSprite, {
    animationUrl: spriteUrl, avatarUrl, alt: 'Tân', ...props,
  })))
}

async function loadImage(image = images.at(-1), width = 1536, height = 2048) {
  assert.ok(image, 'The player must request the sprite image before it can load')
  Object.defineProperties(image, {
    naturalWidth: { value: width },
    naturalHeight: { value: height },
  })
  await act(() => image.dispatchEvent(new dom.window.Event('load')))
}

async function tick(count = 1) {
  await act(() => {
    for (let i = 0; i < count; i++) {
      for (const timer of [...timers.values()]) timer.callback()
    }
  })
}

test('shows the avatar without requesting an image when animationUrl is absent', async () => {
  await renderSprite({ animationUrl: null })
  assert.equal(container.querySelector('img')?.getAttribute('src'), avatarUrl)
  assert.equal(images.length, 0)
  assert.equal(timers.size, 0)
})

test('keeps the avatar visible until the Cloudinary sprite is loaded', async () => {
  await renderSprite()
  assert.equal(container.querySelector('img')?.hidden, false)
  assert.equal(images[0]?.src, spriteUrl)
  assert.equal(timers.size, 0)
  await loadImage()
  assert.equal(container.querySelector('img')?.hidden, true)
  assert.equal(container.querySelector('canvas')?.hidden, false)
  assert.deepEqual(draws[0].slice(1), [0, 0, 512, 512, 0, 0, 512, 512])
})

test('plays all twelve cells in row order at seven FPS and loops to the first cell', async () => {
  await renderSprite()
  await loadImage()
  assert.equal([...timers.values()][0]?.delay, 1000 / 7)
  await tick(3)
  assert.deepEqual(draws[3].slice(1), [0, 512, 512, 512, 0, 0, 512, 512])
  await tick(8)
  assert.deepEqual(draws[11].slice(1), [1024, 1536, 512, 512, 0, 0, 512, 512])
  await tick()
  assert.deepEqual(draws[12].slice(1), [0, 0, 512, 512, 0, 0, 512, 512])
})

test('keeps the avatar when the image fails or has the wrong sheet dimensions', async () => {
  await renderSprite()
  assert.ok(images[0], 'The player must request the sprite image')
  await act(() => images[0].dispatchEvent(new dom.window.Event('error')))
  assert.equal(container.querySelector('img')?.hidden, false)
  assert.equal(timers.size, 0)
  await renderSprite({ animationUrl: `${spriteUrl}?invalid` })
  await loadImage(images.at(-1), 512, 512)
  assert.equal(container.querySelector('img')?.hidden, false)
  assert.equal(timers.size, 0)
  assert.equal(draws.length, 0)
})

test('stops the outgoing player and ignores its late image load after a URL change', async () => {
  await renderSprite()
  const outgoingImage = images[0]
  await renderSprite({ animationUrl: `${spriteUrl}?second` })
  await loadImage(outgoingImage)
  assert.equal(draws.length, 0)
  await loadImage()
  await tick()
  assert.equal(draws.at(-1)[0], images.at(-1))
  await renderSprite({ animationUrl: null })
  assert.equal(timers.size, 0)
  assert.equal(container.querySelector('img')?.hidden, false)
})

test('releases the animation timer and motion listener when deselected or unmounted', async () => {
  await renderSprite()
  await loadImage()
  assert.equal(timers.size, 1)
  await act(() => root.render(null))
  assert.equal(timers.size, 0)
  assert.equal(motionListeners.size, 0)
})

test('shows a still frame for reduced motion and resumes when the preference changes', async () => {
  reducedMotion = true
  await renderSprite()
  await loadImage()
  assert.equal(container.querySelector('canvas')?.hidden, false)
  assert.equal(timers.size, 0)
  reducedMotion = false
  await act(() => { for (const listener of motionListeners) listener() })
  assert.equal(timers.size, 1)
  await tick()
  assert.deepEqual(draws.at(-1).slice(1), [512, 0, 512, 512, 0, 0, 512, 512])
})

test('fits the character using shared transparent bounds across all twelve frames', async () => {
  alphaData = new Uint8ClampedArray(1536 * 2048 * 4)
  alphaData[(20 * 1536 + 10) * 4 + 3] = 255
  alphaData[((1536 + 130) * 1536 + 1024 + 80) * 4 + 3] = 255
  await renderSprite({ trimTransparent: true })
  await loadImage()
  const canvas = container.querySelector('canvas')
  assert.equal(canvas.width, 71)
  assert.equal(canvas.height, 111)
  assert.deepEqual(draws.at(-1).slice(1), [10, 20, 71, 111, 0, 0, 71, 111])
  await tick(11)
  assert.deepEqual(draws.at(-1).slice(1), [1034, 1556, 71, 111, 0, 0, 71, 111])
  assert.equal(canvas.width, 71)
  assert.equal(canvas.height, 111)
})

test('fits a static avatar to its visible bounds without an animation timer', async () => {
  alphaData = new Uint8ClampedArray(200 * 300 * 4)
  alphaData[(50 * 200 + 20) * 4 + 3] = 255
  alphaData[(280 * 200 + 120) * 4 + 3] = 255
  await renderSprite({ animationUrl: null, trimTransparent: true })
  assert.equal(images.at(-1)?.src, avatarUrl)
  await loadImage(images.at(-1), 200, 300)
  assert.equal(container.querySelector('img').hidden, true)
  assert.deepEqual(draws.at(-1).slice(1), [20, 50, 101, 231, 0, 0, 101, 231])
  assert.equal(timers.size, 0)
})

test('preserves the native avatar if cross-origin images cannot be normalized', async () => {
  await renderSprite({ trimTransparent: true })
  await act(() => images.at(-1).dispatchEvent(new dom.window.Event('error')))
  assert.equal(images.at(-1)?.src, avatarUrl)
  await act(() => images.at(-1).dispatchEvent(new dom.window.Event('error')))
  assert.equal(container.querySelector('img').hidden, false)
  assert.equal(timers.size, 0)
})
