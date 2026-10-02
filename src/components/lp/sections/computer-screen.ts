import * as THREE from 'three'
import { CSS3DObject, CSS3DRenderer } from 'three/addons/renderers/CSS3DRenderer.js'

// The glass of macintosh_classic_1991.glb: the two front-face triangles the baked texture paints the
// screen on, in the mesh's local units (bottom-left, bottom-right, top-right, top-left).
const GLASS: ReadonlyArray<readonly [number, number, number]> = [
  [91.390152, -31.0375137, 329.743866],
  [653.409668, -31.0375137, 329.743866],
  [653.409668, 373.874146, 279.470612],
  [91.390152, 373.874146, 279.470612],
]

// Lifts the hole off the glass so the two never z-fight (mesh units, ~0.25mm in the scene)
const HOLE_LIFT = 0.5

// CSS transforms lose precision at the scene's millimetre scale, so the DOM layer
// works in a copy of the world scaled up by this factor
const CSS_WORLD_SCALE = 1000

function glassCorners() {
  return GLASS.map(([x, y, z]) => new THREE.Vector3(x, y, z))
}

const [glassBL, glassBR, , glassTL] = glassCorners()

// Layout size of the DOM screen in CSS pixels: a fixed width and the glass's aspect ratio
export const SCREEN_WIDTH = 1024
export const SCREEN_HEIGHT = Math.round((SCREEN_WIDTH * glassBL.distanceTo(glassTL)) / glassBL.distanceTo(glassBR))

/**
 * A see-through patch over the glass, to be added to the Macintosh mesh. It writes transparent pixels into
 * the WebGL canvas, revealing the DOM screen layered behind it, and is still hidden by anything in front of
 * the glass (like the bezel, seen at an angle).
 */
export function createScreenHole() {
  const [bl, br, tr, tl] = glassCorners()
  const lift = new THREE.Vector3()
    .subVectors(br, bl)
    .cross(new THREE.Vector3().subVectors(tl, bl))
    .setLength(HOLE_LIFT)
  const geometry = new THREE.BufferGeometry().setFromPoints([bl, br, tr, tl].map((p) => p.add(lift)))
  geometry.setIndex([0, 1, 2, 0, 2, 3])
  const material = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0,
    blending: THREE.NoBlending,
    fog: false,
    toneMapped: false,
  })
  return new THREE.Mesh(geometry, material)
}

export interface ScreenFrame {
  center: THREE.Vector3
  normal: THREE.Vector3
  quaternion: THREE.Quaternion
  width: number
  height: number
}

/** The glass in world space. `mesh` is the Macintosh mesh and needs an up-to-date world matrix. */
export function getScreenFrame(mesh: THREE.Object3D): ScreenFrame {
  const [bl, br, , tl] = glassCorners().map((p) => mesh.localToWorld(p))
  const right = new THREE.Vector3().subVectors(br, bl)
  const up = new THREE.Vector3().subVectors(tl, bl)
  const width = right.length()
  const height = up.length()
  right.divideScalar(width)
  up.divideScalar(height)
  const normal = new THREE.Vector3().crossVectors(right, up)
  return {
    center: new THREE.Vector3().addVectors(br, tl).multiplyScalar(0.5),
    normal,
    quaternion: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, normal)),
    width,
    height,
  }
}

/** How far along the glass normal a camera must sit for the screen to fill `fill` of its view. */
export function framingDistance(frame: ScreenFrame, fov: number, aspect: number, fill: number) {
  const tanHalfFov = Math.tan(THREE.MathUtils.degToRad(fov) / 2)
  return Math.max(frame.height / (2 * tanHalfFov * fill), frame.width / (2 * tanHalfFov * aspect * fill))
}

/** Puts the DOM screen exactly over the glass, in the scaled-up CSS world. */
export function placeScreenObject(object: CSS3DObject, frame: ScreenFrame) {
  object.position.copy(frame.center).multiplyScalar(CSS_WORLD_SCALE)
  object.quaternion.copy(frame.quaternion)
  object.scale.set((frame.width * CSS_WORLD_SCALE) / SCREEN_WIDTH, (frame.height * CSS_WORLD_SCALE) / SCREEN_HEIGHT, 1)
}

/** Mirrors the WebGL camera into the scaled-up CSS world. */
export function syncCssCamera(cssCamera: THREE.PerspectiveCamera, camera: THREE.PerspectiveCamera) {
  cssCamera.position.copy(camera.position).multiplyScalar(CSS_WORLD_SCALE)
  cssCamera.quaternion.copy(camera.quaternion)
  if (cssCamera.fov !== camera.fov || cssCamera.aspect !== camera.aspect) {
    cssCamera.fov = camera.fov
    cssCamera.aspect = camera.aspect
    cssCamera.updateProjectionMatrix()
  }
}

export interface ScreenLayer {
  /** Full-size layer to place behind the WebGL canvas; receives clicks around the screen while interactive. */
  root: HTMLDivElement
  /** The screen itself, positioned over the glass. */
  element: HTMLDivElement
  place: (frame: ScreenFrame) => void
  setSize: (width: number, height: number) => void
  render: (camera: THREE.PerspectiveCamera) => void
  setInteractive: (interactive: boolean) => void
  /** Starts loading the computer behind the screensaver. Safe to call more than once. */
  boot: () => void
  /** Fades the screensaver out for good, revealing the computer. */
  wake: () => void
  isFrom: (source: MessageEventSource | null) => boolean
  releaseFocus: () => void
  dispose: () => void
}

/**
 * The Macintosh's screen as real DOM: a screensaver video and, once booted, the CruzTosh page in an iframe.
 * Rendered by a CSS3DRenderer and seen through the hole that `createScreenHole` cuts into the WebGL canvas.
 */
export function createScreenLayer({ screensaverSrc, computerSrc }: { screensaverSrc: string; computerSrc: string }) {
  const renderer = new CSS3DRenderer()
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()

  const root = renderer.domElement as HTMLDivElement
  Object.assign(root.style, {
    position: 'absolute',
    inset: '0',
    background: '#000',
    pointerEvents: 'none',
  })

  const element = document.createElement('div')
  const object = new CSS3DObject(element)
  // CSS3DObject makes its element interactive; it only should be while the computer is in use
  Object.assign(element.style, {
    width: `${SCREEN_WIDTH}px`,
    height: `${SCREEN_HEIGHT}px`,
    background: '#000',
    overflow: 'hidden',
    borderRadius: '6px',
    pointerEvents: 'none',
  })

  const screensaver = document.createElement('video')
  screensaver.muted = true
  screensaver.loop = true
  screensaver.playsInline = true
  screensaver.autoplay = true
  screensaver.setAttribute('aria-hidden', 'true')
  Object.assign(screensaver.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'fill',
    pointerEvents: 'none',
    transition: 'opacity 0.6s ease',
  })
  screensaver.src = screensaverSrc
  screensaver.play().catch(() => {})

  // CRT glass: darker towards the edges, where the screen meets the bezel
  const glass = document.createElement('div')
  Object.assign(glass.style, {
    position: 'absolute',
    inset: '0',
    borderRadius: 'inherit',
    boxShadow: 'inset 0 0 24px rgba(0, 0, 0, 0.25)',
    pointerEvents: 'none',
  })

  element.append(screensaver, glass)

  let frame: HTMLIFrameElement | null = null
  let awake = false

  function stopScreensaver() {
    screensaver.pause()
    screensaver.removeAttribute('src')
    screensaver.load()
    screensaver.remove()
  }

  return {
    root,
    element,

    place(screenFrame: ScreenFrame) {
      placeScreenObject(object, screenFrame)
      if (!object.parent) scene.add(object)
    },

    setSize(width: number, height: number) {
      renderer.setSize(width, height)
    },

    render(sceneCamera: THREE.PerspectiveCamera) {
      if (!object.parent) return
      syncCssCamera(camera, sceneCamera)
      renderer.render(scene, camera)
    },

    setInteractive(interactive: boolean) {
      root.style.pointerEvents = interactive ? 'auto' : 'none'
      root.style.cursor = interactive ? 'zoom-out' : ''
      element.style.pointerEvents = interactive ? 'auto' : 'none'
      if (frame) frame.tabIndex = interactive ? 0 : -1
    },

    boot() {
      if (frame) return
      frame = document.createElement('iframe')
      frame.title = 'CruzTosh'
      frame.tabIndex = -1
      Object.assign(frame.style, {
        position: 'absolute',
        inset: '0',
        width: '100%',
        height: '100%',
        border: '0',
        background: '#000',
      })
      frame.src = computerSrc
      // Underneath the screensaver and the glass
      element.prepend(frame)
    },

    wake() {
      if (awake) return
      awake = true
      screensaver.addEventListener('transitionend', stopScreensaver, { once: true })
      screensaver.style.opacity = '0'
    },

    isFrom(source: MessageEventSource | null) {
      return frame !== null && source !== null && source === frame.contentWindow
    },

    releaseFocus() {
      if (frame && document.activeElement === frame) frame.blur()
    },

    dispose() {
      screensaver.removeEventListener('transitionend', stopScreensaver)
      stopScreensaver()
      scene.remove(object)
      root.remove()
      frame = null
    },
  } satisfies ScreenLayer
}
