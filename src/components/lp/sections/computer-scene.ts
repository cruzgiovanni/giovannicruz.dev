import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  createScreenHole,
  createScreenLayer,
  framingDistance,
  getScreenFrame,
  type ScreenFrame,
} from './computer-screen'

export function initScene(container: HTMLDivElement, onReady?: () => void, onScreenClick?: () => void): () => void {
  // Scene setup
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xc8c4c0)
  scene.fog = new THREE.FogExp2(0xc8c4c0, 0.06)

  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100)
  camera.position.set(2.5, 2, 3.2)
  camera.lookAt(0, 0.8, 0)

  const isMobile = container.clientWidth < 768
  // alpha: the screen hole makes the canvas see-through over the Mac's glass
  const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: true })
  renderer.setClearColor(0xc8c4c0, 1)
  renderer.setSize(container.clientWidth, container.clientHeight, false)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.shadowMap.enabled = false
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  renderer.outputColorSpace = THREE.SRGBColorSpace
  Object.assign(renderer.domElement.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    display: 'block',
  })

  // The Mac's screen is real DOM behind the canvas, seen through the hole over the glass
  const macScreen = createScreenLayer({ screensaverSrc: '/ascii-animation.mp4', computerSrc: '/cruztosh' })
  macScreen.setSize(container.clientWidth, container.clientHeight)
  container.append(macScreen.root, renderer.domElement)

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xfaf0e6, 0.2)
  scene.add(ambientLight)

  const hemiLight = new THREE.HemisphereLight(0xc8d8e8, 0x504030, 0.5)
  scene.add(hemiLight)

  // Environment map for PBR reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()

  const envScene = new THREE.Scene()
  envScene.background = new THREE.Color(0xc8c4c0)
  const envLight1 = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
  )
  envLight1.position.set(0, 5, 0)
  envLight1.rotation.x = Math.PI / 2
  envScene.add(envLight1)
  const envLight2 = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 4),
    new THREE.MeshBasicMaterial({ color: 0xffeedd, side: THREE.DoubleSide }),
  )
  envLight2.position.set(5, 3, 0)
  envLight2.rotation.y = -Math.PI / 2
  envScene.add(envLight2)
  const envRT = pmremGenerator.fromScene(envScene)
  scene.environment = envRT.texture

  // Dispose env scene (only needed for PMREM generation)
  envLight1.geometry.dispose()
  ;(envLight1.material as THREE.Material).dispose()
  envLight2.geometry.dispose()
  ;(envLight2.material as THREE.Material).dispose()

  const dirLight = new THREE.DirectionalLight(0xfff5e0, 2.8)
  dirLight.position.set(5, 8, 4)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 512
  dirLight.shadow.mapSize.height = 512
  dirLight.shadow.camera.near = 0.5
  dirLight.shadow.camera.far = 25
  dirLight.shadow.camera.left = -8
  dirLight.shadow.camera.right = 8
  dirLight.shadow.camera.top = 8
  dirLight.shadow.camera.bottom = -8
  dirLight.shadow.bias = -0.001
  scene.add(dirLight)

  const fillLight = new THREE.DirectionalLight(0xb0c4de, 0.35)
  fillLight.position.set(-3, 4, -2)
  scene.add(fillLight)

  const rimLight = new THREE.DirectionalLight(0xffeedd, 0.5)
  rimLight.position.set(-2, 3, 5)
  scene.add(rimLight)

  const backLight = new THREE.DirectionalLight(0xdde8ff, 0.15)
  backLight.position.set(0, 2, -5)
  scene.add(backLight)

  const areaLight = new THREE.PointLight(0xfff8f0, 0.6, 8)
  areaLight.position.set(0, 3, 1)
  scene.add(areaLight)

  // Floor
  const floorGeom = new THREE.PlaneGeometry(30, 30)
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xb8b0a0,
    roughness: 0.8,
    metalness: 0.0,
    envMapIntensity: 0.2,
  })
  const floor = new THREE.Mesh(floorGeom, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.target.set(0, 0.8, 0)
  controls.minDistance = 3
  controls.maxDistance = 15
  controls.maxPolarAngle = Math.PI / 2.1
  controls.update()

  // ============================
  // Build desk scene
  // ============================
  let monitorGroup: THREE.Group | null = null

  function createDeskScene() {
    const deskGroup = new THREE.Group()

    const birchMat = new THREE.MeshStandardMaterial({
      color: 0xe8d8b8,
      roughness: 0.45,
      metalness: 0.0,
      envMapIntensity: 0.5,
    })
    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf0f0f0,
      roughness: 0.3,
      metalness: 0.2,
      envMapIntensity: 0.6,
    })

    // Desk top
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 1.1), birchMat)
    deskTop.position.set(0, 1.0, 0)
    deskTop.castShadow = true
    deskTop.receiveShadow = true
    deskGroup.add(deskTop)

    // Edge strip
    const edgeStrip = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.02, 0.01), whiteMat)
    edgeStrip.position.set(0, 1.0, 0.555)
    deskGroup.add(edgeStrip)

    // A-frame legs
    function createAFrameLeg(xSign: number) {
      const legGroup = new THREE.Group()
      const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.02, 0.04), whiteMat)
      bar1.position.set(xSign * 0.22, 0.5, 0.35)
      bar1.rotation.z = xSign * 0.08
      bar1.castShadow = true
      legGroup.add(bar1)
      const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.02, 0.04), whiteMat)
      bar2.position.set(xSign * 0.22, 0.5, -0.35)
      bar2.rotation.z = xSign * 0.08
      bar2.castShadow = true
      legGroup.add(bar2)
      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.66), whiteMat)
      cross.position.set(xSign * 0.22, 0.45, 0)
      legGroup.add(cross)
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.76), whiteMat)
      foot.position.set(xSign * 0.27, 0.015, 0)
      legGroup.add(foot)
      return legGroup
    }
    const leftLegs = createAFrameLeg(-1)
    leftLegs.position.x = -1.05
    deskGroup.add(leftLegs)
    const rightLegs = createAFrameLeg(1)
    rightLegs.position.x = 1.05
    deskGroup.add(rightLegs)

    // CRT Monitor - Macintosh Classic GLB loaded async
    monitorGroup = new THREE.Group()
    monitorGroup.position.set(0.1, 1.02, -0.15)
    deskGroup.add(monitorGroup)

    // Keyboard
    const kbMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.3,
      metalness: 0.3,
      envMapIntensity: 0.6,
    })
    const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.13), kbMat)
    keyboard.position.set(0.1, 1.028, 0.25)
    keyboard.castShadow = true
    deskGroup.add(keyboard)

    const keyMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.4,
      metalness: 0.15,
      envMapIntensity: 0.4,
    })
    const keyGeom = new THREE.BoxGeometry(0.024, 0.005, 0.022)
    const keyCount = 4 * 13
    const keyMesh = new THREE.InstancedMesh(keyGeom, keyMat, keyCount)
    const dummy = new THREE.Object3D()
    let idx = 0
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 13; col++) {
        dummy.position.set(0.1 - 0.17 + col * 0.028, 1.038, 0.25 - 0.04 + row * 0.028)
        dummy.updateMatrix()
        keyMesh.setMatrixAt(idx++, dummy.matrix)
      }
    }
    keyMesh.instanceMatrix.needsUpdate = true
    deskGroup.add(keyMesh)

    // Mouse
    const mouseMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.2,
      metalness: 0.25,
      envMapIntensity: 0.7,
    })
    const mouseBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.04, 8, 12), mouseMat)
    mouseBody.position.set(0.5, 1.04, 0.25)
    mouseBody.rotation.x = Math.PI / 2
    mouseBody.castShadow = true
    deskGroup.add(mouseBody)

    // Succulent plant
    const plantGroup = new THREE.Group()
    plantGroup.position.set(0.85, 1.02, -0.3)
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0xb0b0a8,
      roughness: 0.9,
      metalness: 0.0,
      envMapIntensity: 0.2,
    })
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.07, 8), concreteMat)
    pot.position.y = 0.035
    pot.castShadow = true
    plantGroup.add(pot)
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.9 })
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.01, 8), soilMat)
    soil.position.y = 0.07
    plantGroup.add(soil)
    const succMat = new THREE.MeshStandardMaterial({ color: 0x6aaa6a, roughness: 0.5 })
    const succMat2 = new THREE.MeshStandardMaterial({ color: 0x88cc88, roughness: 0.5 })
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), i % 2 === 0 ? succMat : succMat2)
      leaf.position.set(Math.cos(angle) * 0.025, 0.085, Math.sin(angle) * 0.025)
      leaf.scale.set(1, 0.6, 1.2)
      plantGroup.add(leaf)
    }
    const centerLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), succMat2)
    centerLeaf.position.set(0, 0.095, 0)
    plantGroup.add(centerLeaf)
    deskGroup.add(plantGroup)

    // Coffee cup
    const cupMat = new THREE.MeshStandardMaterial({
      color: 0xfaf8f5,
      roughness: 0.4,
      metalness: 0.02,
      envMapIntensity: 0.5,
    })
    const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 16), cupMat)
    cupBody.position.set(0.65, 1.06, 0.15)
    cupBody.castShadow = true
    deskGroup.add(cupBody)
    const coffeeMat = new THREE.MeshStandardMaterial({
      color: 0x3a2010,
      roughness: 0.3,
      metalness: 0.0,
      envMapIntensity: 0.2,
    })
    const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.005, 16), coffeeMat)
    coffee.position.set(0.65, 1.098, 0.15)
    deskGroup.add(coffee)

    // Notebook
    const notebookMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.55,
      metalness: 0.0,
      envMapIntensity: 0.3,
    })
    const notebook = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.01, 0.24), notebookMat)
    notebook.position.set(-0.45, 1.027, 0.25)
    notebook.rotation.y = 0.1
    notebook.castShadow = true
    deskGroup.add(notebook)
    const bandMat = new THREE.MeshStandardMaterial({ color: 0xcc4444, roughness: 0.5 })
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.012, 0.24), bandMat)
    band.position.set(-0.39, 1.033, 0.25)
    band.rotation.y = 0.1
    deskGroup.add(band)

    // Pencil
    const pencilMat = new THREE.MeshStandardMaterial({ color: 0xf0d060, roughness: 0.5 })
    const pencil = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.2, 6), pencilMat)
    pencil.position.set(-0.35, 1.035, 0.35)
    pencil.rotation.z = Math.PI / 2
    pencil.rotation.y = 0.3
    deskGroup.add(pencil)
    const pencilTip = new THREE.Mesh(
      new THREE.ConeGeometry(0.005, 0.015, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a3a2a }),
    )
    pencilTip.position.set(-0.25, 1.035, 0.32)
    pencilTip.rotation.z = Math.PI / 2
    pencilTip.rotation.y = 0.3
    deskGroup.add(pencilTip)

    // Chair
    const chairMat = new THREE.MeshStandardMaterial({
      color: 0xf0ece5,
      roughness: 0.45,
      metalness: 0.0,
      envMapIntensity: 0.4,
    })
    const chairShape = new THREE.Shape()
    const chW = 0.5,
      chH = 0.5,
      chR = 0.06
    chairShape.moveTo(-chW / 2 + chR, -chH / 2)
    chairShape.lineTo(chW / 2 - chR, -chH / 2)
    chairShape.quadraticCurveTo(chW / 2, -chH / 2, chW / 2, -chH / 2 + chR)
    chairShape.lineTo(chW / 2, chH / 2 - chR)
    chairShape.quadraticCurveTo(chW / 2, chH / 2, chW / 2 - chR, chH / 2)
    chairShape.lineTo(-chW / 2 + chR, chH / 2)
    chairShape.quadraticCurveTo(-chW / 2, chH / 2, -chW / 2, chH / 2 - chR)
    chairShape.lineTo(-chW / 2, -chH / 2 + chR)
    chairShape.quadraticCurveTo(-chW / 2, -chH / 2, -chW / 2 + chR, -chH / 2)
    const chairGeom = new THREE.ExtrudeGeometry(chairShape, {
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.06,
      bevelSize: 0.06,
      bevelSegments: 6,
    })
    chairGeom.center()
    const chair = new THREE.Mesh(chairGeom, chairMat)
    chair.position.set(0.1, 0.25, 1.0)
    chair.rotation.x = Math.PI / 2
    chair.castShadow = true
    chair.receiveShadow = true
    deskGroup.add(chair)

    deskGroup.position.set(0, 0, 0)
    scene.add(deskGroup)
    return deskGroup
  }

  const deskScene = createDeskScene()

  let screenMesh: THREE.Mesh | null = null

  // ============================
  // Crucifix on desk
  // ============================
  let crucifixGroup: THREE.Group | null = null
  const gltfLoader = new GLTFLoader()
  gltfLoader.load('/crucifix.glb', (gltf) => {
    const crucifix = gltf.scene

    const box = new THREE.Box3().setFromObject(crucifix)
    const size = new THREE.Vector3()
    box.getSize(size)
    const center = new THREE.Vector3()
    box.getCenter(center)

    const desiredHeight = 0.25
    const scaleFactor = desiredHeight / size.y
    crucifix.scale.setScalar(scaleFactor)

    crucifix.position.set(-center.x * scaleFactor, -box.min.y * scaleFactor, -center.z * scaleFactor)

    crucifixGroup = new THREE.Group()
    crucifixGroup.add(crucifix)

    // White base
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.35, metalness: 0.05 })
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.02, 16), baseMat)
    base.position.y = 0.01
    base.castShadow = true
    base.receiveShadow = true
    crucifixGroup.add(base)

    crucifixGroup.position.set(-0.55, 1.02, -0.3)
    crucifixGroup.rotation.y = -Math.PI / 2

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8b6030,
      roughness: 0.6,
      metalness: 0.0,
      envMapIntensity: 0.5,
    })
    crucifix.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = woodMat
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    scene.add(crucifixGroup)
  })

  // ============================
  // Load Macintosh Classic model
  // ============================
  let screenFrame: ScreenFrame | null = null
  let bootTimer: ReturnType<typeof setTimeout> | undefined
  let disposed = false

  gltfLoader.load('/macintosh_classic_1991.glb', (gltf) => {
    // Loads can't be cancelled; the scene may be gone by now
    if (disposed) return
    const mac = gltf.scene

    const box = new THREE.Box3().setFromObject(mac)
    const size = new THREE.Vector3()
    box.getSize(size)
    const center = new THREE.Vector3()
    box.getCenter(center)

    const desiredHeight = 0.5
    const scaleFactor = desiredHeight / size.y
    mac.scale.setScalar(scaleFactor)
    mac.position.set(-center.x * scaleFactor, -box.min.y * scaleFactor, -center.z * scaleFactor)

    mac.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
        screenMesh = child
      }
    })

    monitorGroup!.add(mac)

    if (screenMesh) {
      screenMesh.add(createScreenHole())
      scene.updateMatrixWorld(true)
      screenFrame = getScreenFrame(screenMesh)
      macScreen.place(screenFrame)
      // On desktop CruzTosh boots in the background, so it's ready behind the screensaver
      if (!isMobile) bootTimer = setTimeout(macScreen.boot, 1000)
    }
  })

  // ============================
  // Zoom state
  // ============================
  const originalCamPos = new THREE.Vector3()
  const originalCamTarget = new THREE.Vector3()
  let isZoomed = false
  let isAnimating = false
  let zoomedTarget: 'computer' | 'crucifix' | null = null

  const animStartPos = new THREE.Vector3()
  const animEndPos = new THREE.Vector3()
  const animStartTarget = new THREE.Vector3()
  const animEndTarget = new THREE.Vector3()
  let animProgress = 0
  const animDuration = 0.8
  let animDirection: 'in' | 'out' = 'in'
  let animStartFOV = 40
  let animEndFOV = 40

  function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  function startCameraAnimation(
    fromPos: THREE.Vector3,
    toPos: THREE.Vector3,
    fromTarget: THREE.Vector3,
    toTarget: THREE.Vector3,
    direction: 'in' | 'out',
    fovIn = 11,
  ) {
    animStartPos.copy(fromPos)
    animEndPos.copy(toPos)
    animStartTarget.copy(fromTarget)
    animEndTarget.copy(toTarget)
    animProgress = 0
    animDirection = direction
    isAnimating = true
    controls.enabled = false
    animStartFOV = camera.fov
    animEndFOV = direction === 'in' ? fovIn : 40
  }

  // ============================
  // Interaction
  // ============================
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  // Tooltip
  const tooltip = document.createElement('div')
  tooltip.textContent = isMobile ? '' : 'Click'
  Object.assign(tooltip.style, {
    position: 'absolute',
    pointerEvents: 'none',
    background: 'rgba(0,0,0,0.75)',
    color: '#C4C4C4',
    fontFamily: 'var(--font-geist-sans, system-ui, sans-serif)',
    fontSize: '12px',
    fontWeight: '500',
    letterSpacing: '-0.01em',
    padding: '5px 10px',
    borderRadius: '0',
    opacity: '0',
    transition: 'opacity 0.2s ease',
    whiteSpace: 'nowrap',
    zIndex: '30',
    transform: 'translate(-50%, -130%)',
  })
  container.appendChild(tooltip)

  let isHoveringMonitor = false
  let isHoveringCrucifix = false

  const onMouseMove = (e: MouseEvent) => {
    if (isAnimating) {
      if (isHoveringMonitor) {
        tooltip.style.opacity = '0'
        isHoveringMonitor = false
      }
      if (isHoveringCrucifix) {
        tooltip.style.opacity = '0'
        isHoveringCrucifix = false
      }
      renderer.domElement.style.cursor = ''
      return
    }

    // Zoomed in on the crucifix (while the computer is in use, the canvas ignores the pointer)
    if (isZoomed) {
      isHoveringCrucifix = false

      const rect = renderer.domElement.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(mouse, camera)

      if (zoomedTarget === 'crucifix' && crucifixGroup) {
        const onCrucifix = raycaster.intersectObject(crucifixGroup, true).length > 0
        renderer.domElement.style.cursor = onCrucifix ? 'default' : 'pointer'
      }
      return
    }

    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)

    const monitorIntersects = monitorGroup ? raycaster.intersectObject(monitorGroup, true) : []

    if (monitorIntersects.length > 0) {
      if (!isHoveringMonitor) {
        isHoveringMonitor = true
        tooltip.textContent = 'Click to enter'
        tooltip.style.opacity = '1'
        renderer.domElement.style.cursor = 'pointer'
      }
      tooltip.style.left = `${e.clientX - rect.left}px`
      tooltip.style.top = `${e.clientY - rect.top}px`
    } else if (isHoveringMonitor) {
      isHoveringMonitor = false
      tooltip.style.opacity = '0'
      renderer.domElement.style.cursor = ''
    }

    // Crucifix hover
    if (crucifixGroup) {
      const crucifixIntersects = raycaster.intersectObject(crucifixGroup, true)
      if (crucifixIntersects.length > 0 && !isHoveringMonitor) {
        if (!isHoveringCrucifix) {
          isHoveringCrucifix = true
          tooltip.textContent = 'Click to zoom'
          tooltip.style.opacity = '1'
          renderer.domElement.style.cursor = 'pointer'
        }
        tooltip.style.left = `${e.clientX - rect.left}px`
        tooltip.style.top = `${e.clientY - rect.top}px`
      } else if (isHoveringCrucifix) {
        isHoveringCrucifix = false
        tooltip.style.opacity = '0'
        renderer.domElement.style.cursor = ''
      }
    }
  }

  // Click to zoom in / zoom out
  let mouseDownTime = 0
  let mouseDownPos = { x: 0, y: 0 }

  const onMouseDown = (e: MouseEvent) => {
    mouseDownTime = performance.now()
    mouseDownPos = { x: e.clientX, y: e.clientY }
  }

  const onMouseUp = (e: MouseEvent) => {
    if (isAnimating) return

    const elapsed = performance.now() - mouseDownTime
    const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y)
    if (elapsed > 300 || dist > 8) return

    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)

    if (isZoomed) {
      if (zoomedTarget === 'computer') {
        exitComputer()
        return
      }
      if (zoomedTarget === 'crucifix' && crucifixGroup) {
        const crucifixHits = raycaster.intersectObject(crucifixGroup, true)
        if (crucifixHits.length > 0) return
      }
      startCameraAnimation(camera.position, originalCamPos, controls.target, originalCamTarget, 'out')
      return
    }

    const monitorIntersects = monitorGroup ? raycaster.intersectObject(monitorGroup, true) : []
    if (monitorIntersects.length > 0 && screenFrame) {
      enterComputer(screenFrame)
      return
    }

    // Crucifix click to zoom
    if (crucifixGroup) {
      const crucifixIntersects = raycaster.intersectObject(crucifixGroup, true)
      if (crucifixIntersects.length > 0) {
        tooltip.style.opacity = '0'
        originalCamPos.copy(camera.position)
        originalCamTarget.copy(controls.target)
        const crucifixWorldPos = new THREE.Vector3()
        crucifixGroup.getWorldPosition(crucifixWorldPos)
        // Crucifix rotated -PI/2 on Y, so its front faces +X; position camera on that side
        const crucifixCenterY = crucifixWorldPos.y + 0.13
        // Position camera in front of the desk (z > crucifixWorldPos.z), slightly to the right
        // matching the general direction of the initial camera angle
        const zoomPos = new THREE.Vector3(crucifixWorldPos.x, crucifixCenterY + 0.15, crucifixWorldPos.z + 0.55)
        const zoomTarget = new THREE.Vector3(crucifixWorldPos.x, crucifixCenterY, crucifixWorldPos.z)
        zoomedTarget = 'crucifix'
        startCameraAnimation(camera.position, zoomPos, controls.target, zoomTarget, 'in', 7)
      }
    }
  }

  renderer.domElement.addEventListener('mousemove', onMouseMove)
  renderer.domElement.addEventListener('mousedown', onMouseDown)
  renderer.domElement.addEventListener('mouseup', onMouseUp)

  // Touch handlers for mobile tap interaction
  let touchStartTime = 0
  let touchStartPos = { x: 0, y: 0 }

  const onTouchStart = (e: TouchEvent) => {
    touchStartTime = performance.now()
    touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (isAnimating) return
    const touch = e.changedTouches[0]
    const elapsed = performance.now() - touchStartTime
    const dist = Math.hypot(touch.clientX - touchStartPos.x, touch.clientY - touchStartPos.y)
    if (elapsed > 300 || dist > 15) return

    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)

    // Phones open CruzTosh on its own page; bigger touch screens use it in place, like a click does
    const monitorIntersects = monitorGroup ? raycaster.intersectObject(monitorGroup, true) : []
    if (monitorIntersects.length > 0) {
      if (isMobile) onScreenClick?.()
      else if (screenFrame) enterComputer(screenFrame)
      return
    }

    // Crucifix zoom still works on mobile
    if (isZoomed) {
      if (zoomedTarget === 'crucifix' && crucifixGroup) {
        const crucifixHits = raycaster.intersectObject(crucifixGroup, true)
        if (crucifixHits.length > 0) return
      }
      startCameraAnimation(camera.position, originalCamPos, controls.target, originalCamTarget, 'out')
      return
    }

    if (crucifixGroup) {
      const crucifixIntersects = raycaster.intersectObject(crucifixGroup, true)
      if (crucifixIntersects.length > 0) {
        originalCamPos.copy(camera.position)
        originalCamTarget.copy(controls.target)
        const crucifixWorldPos = new THREE.Vector3()
        crucifixGroup.getWorldPosition(crucifixWorldPos)
        const crucifixCenterY = crucifixWorldPos.y + 0.13
        const zoomPos = new THREE.Vector3(crucifixWorldPos.x, crucifixCenterY + 0.15, crucifixWorldPos.z + 0.55)
        const zoomTarget = new THREE.Vector3(crucifixWorldPos.x, crucifixCenterY, crucifixWorldPos.z)
        zoomedTarget = 'crucifix'
        startCameraAnimation(camera.position, zoomPos, controls.target, zoomTarget, 'in', 7)
      }
    }
  }

  renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true })
  renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true })

  // ============================
  // Computer mode: fly into the screen and use CruzTosh in place
  // ============================
  const COMPUTER_FOV = 11
  // Share of the view the screen takes up, leaving some bezel around it to click out
  const SCREEN_FILL = 0.88
  // easeInOutCubic, so the layout keeps pace with the camera
  const EXPAND_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
  // OrbitControls.update() clamps to this even while disabled, and the screen sits much closer
  const orbitMinDistance = controls.minDistance
  let computerActive = false

  function computerPose(frame: ScreenFrame, aspect: number) {
    const distance = framingDistance(frame, COMPUTER_FOV, aspect, SCREEN_FILL)
    return { position: frame.center.clone().addScaledVector(frame.normal, distance), target: frame.center.clone() }
  }

  function placeCamera({ position, target }: { position: THREE.Vector3; target: THREE.Vector3 }) {
    camera.position.copy(position)
    controls.target.copy(target)
    camera.lookAt(target)
  }

  // While in use, the scene breaks out of the hero into a fixed, full-viewport layer
  function expandContainer() {
    const { left, top, width, height } = container.getBoundingClientRect()
    Object.assign(container.style, {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      zIndex: '60',
    })
    // Commit the starting box so the transition runs from it
    void container.offsetWidth
    Object.assign(container.style, {
      transition: ['left', 'top', 'width', 'height'].map((p) => `${p} ${animDuration}s ${EXPAND_EASE}`).join(', '),
      left: '0px',
      top: '0px',
      width: '100vw',
      height: '100dvh',
    })
    document.documentElement.style.overflow = 'hidden'
  }

  // Heads back to the spot in the hero the scene came from
  function collapseContainer() {
    const parent = container.parentElement
    if (!parent) return
    const { left, top } = parent.getBoundingClientRect()
    Object.assign(container.style, {
      left: `${left + parent.clientLeft}px`,
      top: `${top + parent.clientTop}px`,
      width: `${parent.clientWidth}px`,
      height: `${parent.clientHeight}px`,
    })
  }

  function restoreContainer() {
    container.removeAttribute('style')
    document.documentElement.style.overflow = ''
  }

  function enterComputer(frame: ScreenFrame) {
    if (isMobile || isAnimating || isZoomed) return
    tooltip.style.opacity = '0'
    isHoveringMonitor = false
    isHoveringCrucifix = false
    renderer.domElement.style.cursor = ''
    originalCamPos.copy(camera.position)
    originalCamTarget.copy(controls.target)
    zoomedTarget = 'computer'
    controls.minDistance = 0
    macScreen.boot()
    macScreen.wake()
    expandContainer()
    // Framed for the full viewport the container is growing into
    const pose = computerPose(frame, window.innerWidth / window.innerHeight)
    startCameraAnimation(camera.position, pose.position, controls.target, pose.target, 'in', COMPUTER_FOV)
  }

  // Once the camera has landed, the pointer goes to the screen instead of the scene
  function activateComputer() {
    computerActive = true
    if (screenFrame) placeCamera(computerPose(screenFrame, window.innerWidth / window.innerHeight))
    renderer.domElement.style.pointerEvents = 'none'
    macScreen.setInteractive(true)
  }

  function exitComputer() {
    if (!computerActive || isAnimating) return
    computerActive = false
    macScreen.setInteractive(false)
    macScreen.releaseFocus()
    renderer.domElement.style.pointerEvents = ''
    tooltip.style.opacity = '0'
    collapseContainer()
    startCameraAnimation(camera.position, originalCamPos, controls.target, originalCamTarget, 'out')
  }

  // Around the screen: a hint, and a click leaves the computer
  const isOnScreen = (target: EventTarget | null) => target instanceof Node && macScreen.element.contains(target)

  const onLayerPointer = (e: MouseEvent) => {
    if (!computerActive || isOnScreen(e.target)) {
      tooltip.style.opacity = '0'
      return
    }
    const rect = container.getBoundingClientRect()
    tooltip.textContent = 'Click to exit'
    tooltip.style.opacity = '1'
    tooltip.style.left = `${e.clientX - rect.left}px`
    tooltip.style.top = `${e.clientY - rect.top}px`
  }

  const onLayerLeave = () => {
    tooltip.style.opacity = '0'
  }

  const onLayerClick = (e: MouseEvent) => {
    if (!isOnScreen(e.target)) exitComputer()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') exitComputer()
  }

  // CruzTosh asks to leave when Esc is pressed with no windows open
  const onMessage = (e: MessageEvent) => {
    if (e.origin !== window.location.origin || !macScreen.isFrom(e.source)) return
    if (e.data?.type === 'cruztosh:exit') exitComputer()
  }

  macScreen.root.addEventListener('mousemove', onLayerPointer)
  macScreen.root.addEventListener('mouseover', onLayerPointer)
  macScreen.root.addEventListener('mouseleave', onLayerLeave)
  macScreen.root.addEventListener('click', onLayerClick)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('message', onMessage)

  // ============================
  // Animation loop
  // ============================
  let animFrameId: number
  const clock = new THREE.Clock()
  let firstFrame = true
  let pendingResize = false
  let lastW = container.clientWidth
  let lastH = container.clientHeight

  function finishCameraAnimation() {
    isAnimating = false
    if (animDirection === 'in') {
      isZoomed = true
      controls.enabled = false
      if (zoomedTarget === 'computer') activateComputer()
    } else {
      if (zoomedTarget === 'computer') {
        restoreContainer()
        controls.minDistance = orbitMinDistance
      }
      isZoomed = false
      zoomedTarget = null
      controls.enabled = true
      renderer.domElement.style.cursor = ''
    }
  }

  function animate() {
    animFrameId = requestAnimationFrame(animate)
    const dt = clock.getDelta()

    if (pendingResize) {
      pendingResize = false
      const w = container.clientWidth
      const h = container.clientHeight
      if (w > 0 && h > 0 && (w !== lastW || h !== lastH)) {
        lastW = w
        lastH = h
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h, false)
        macScreen.setSize(w, h)
        if (computerActive && screenFrame) placeCamera(computerPose(screenFrame, camera.aspect))
      }
    }

    // Camera animation
    if (isAnimating) {
      animProgress = Math.min(animProgress + dt / animDuration, 1)
      const t = easeInOutCubic(animProgress)
      camera.position.lerpVectors(animStartPos, animEndPos, t)
      controls.target.lerpVectors(animStartTarget, animEndTarget, t)
      camera.fov = animStartFOV + (animEndFOV - animStartFOV) * t
      camera.updateProjectionMatrix()
      camera.lookAt(controls.target)
      controls.update()
      if (animProgress === 1) finishCameraAnimation()
    }

    if (!isZoomed && !isAnimating) {
      controls.update()
    }

    renderer.render(scene, camera)
    macScreen.render(camera)

    if (firstFrame) {
      firstFrame = false
      onReady?.()
    }
  }
  animate()

  // ============================
  // Resize handling
  // ============================
  const resizeObserver = new ResizeObserver(() => {
    pendingResize = true
  })
  resizeObserver.observe(container)

  // ============================
  // Cleanup
  // ============================
  return () => {
    disposed = true
    cancelAnimationFrame(animFrameId)
    resizeObserver.disconnect()

    renderer.domElement.removeEventListener('mousemove', onMouseMove)
    renderer.domElement.removeEventListener('mousedown', onMouseDown)
    renderer.domElement.removeEventListener('mouseup', onMouseUp)
    renderer.domElement.removeEventListener('touchstart', onTouchStart)
    renderer.domElement.removeEventListener('touchend', onTouchEnd)
    tooltip.remove()

    clearTimeout(bootTimer)
    macScreen.root.removeEventListener('mousemove', onLayerPointer)
    macScreen.root.removeEventListener('mouseover', onLayerPointer)
    macScreen.root.removeEventListener('mouseleave', onLayerLeave)
    macScreen.root.removeEventListener('click', onLayerClick)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('message', onMessage)
    macScreen.dispose()
    // Unmounting mid-use must not leave the page locked
    if (zoomedTarget === 'computer') restoreContainer()

    function disposeScene(s: THREE.Scene | THREE.Group) {
      s.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    }
    disposeScene(scene)
    if (crucifixGroup) disposeScene(crucifixGroup)
    envRT.texture.dispose()
    pmremGenerator.dispose()
    controls.dispose()

    renderer.dispose()
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement)
    }
  }
}
