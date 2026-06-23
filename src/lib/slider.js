/* globals THREE, TweenMax, Power0 */

export const createImageSlider = ({ container, images, width, height, delay = 0, autoPlay = true, onReady }) => {
  if (!container || !images.length) return null
  if (typeof THREE === 'undefined' || typeof TweenMax === 'undefined') return null

  const fov = 80
  const root = new THREERoot(container, {
    antialias: window.devicePixelRatio === 1,
    fov
  })
  root.renderer.setClearColor(0x000000, 0)

  const fitDistance = (height / 2) / Math.tan((fov / 2) * Math.PI / 180)
  root.camera.position.set(0, 0, fitDistance)

  const slideOut = new Slide(width, height, 'out')
  const slideIn = new Slide(width, height, 'in')

  let currentIndex = 0
  let disposed = false
  let pendingTimeout = null
  let transitioning = false
  let paused = false

  const MAX_TEXTURE_SIZE = 2048
  const capTextureSize = (image) => {
    const longest = Math.max(image.width, image.height)
    if (longest <= MAX_TEXTURE_SIZE) return image

    const scale = MAX_TEXTURE_SIZE / longest
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas
  }

  const loadImage = (url, slide) =>
    new Promise((resolve, reject) => {
      const loader = new THREE.ImageLoader()
      if (url.startsWith('http')) loader.setCrossOrigin('Anonymous')
      loader.load(
        url,
        img => {
          const texImage = capTextureSize(img)
          slide.setImage(texImage)
          slide.time = 0
          resolve(texImage)
        },
        undefined,
        reject
      )
    })

  const runTransition = (nextIdx) => {
    if (disposed || transitioning) return
    transitioning = true

    if (nextIdx !== undefined) {
      currentIndex = ((nextIdx % images.length) + images.length) % images.length
    }

    const targetIndex = nextIdx !== undefined
      ? currentIndex
      : (currentIndex + 1) % images.length

    loadImage(images[targetIndex], slideIn).then(() => {
      if (disposed) return

      TweenMax.to(slideOut, 3.0, {
        time: slideOut.totalDuration,
        ease: Power0.easeInOut
      })

      TweenMax.to(slideIn, 3.0, {
        time: slideIn.totalDuration,
        ease: Power0.easeInOut,
        onComplete: () => {
          if (disposed) return
          transitioning = false

          currentIndex = targetIndex

          const currentImg = slideIn.material.uniforms.map.value.image
          slideOut.setImage(currentImg)
          slideOut.time = 0

          const preloadIndex = (currentIndex + 1) % images.length
          loadImage(images[preloadIndex], slideIn).catch(() => {})

          if (autoPlay && !paused) {
            pendingTimeout = setTimeout(() => runTransition(), 1000)
          }
        }
      })
    }).catch(() => { transitioning = false })
  }

  const initialLoads = [loadImage(images[0], slideOut)]
  if (images.length >= 2) {
    initialLoads.push(loadImage(images[1], slideIn))
  }

  Promise.all(initialLoads)
    .then(() => {
      if (disposed) return
      root.scene.add(slideOut, slideIn)
      if (onReady) onReady()
      if (autoPlay && !paused) {
        pendingTimeout = setTimeout(() => runTransition(), delay + 1000)
      }
    })
    .catch(() => {})

  const dispose = () => {
    disposed = true
    if (pendingTimeout) clearTimeout(pendingTimeout)
    TweenMax.killTweensOf(slideOut)
    TweenMax.killTweensOf(slideIn)
    root.dispose()

    if (slideOut.material.uniforms.map.value.image) {
      slideOut.material.uniforms.map.value.dispose()
    }
    if (slideIn.material.uniforms.map.value.image) {
      slideIn.material.uniforms.map.value.dispose()
    }

    slideOut.geometry.dispose()
    slideOut.material.dispose()
    slideIn.geometry.dispose()
    slideIn.material.dispose()
  }

  return {
    dispose,
    next() {
      if (disposed) return
      if (pendingTimeout) clearTimeout(pendingTimeout)
      const nextIdx = (currentIndex + 1) % images.length
      runTransition(nextIdx)
    },
    prev() {
      if (disposed) return
      if (pendingTimeout) clearTimeout(pendingTimeout)
      const prevIdx = (currentIndex - 1 + images.length) % images.length
      runTransition(prevIdx)
    },
    pause() {
      paused = true
      if (pendingTimeout) {
        clearTimeout(pendingTimeout)
        pendingTimeout = null
      }
    },
    resume() {
      paused = false
      if (autoPlay && !transitioning && !pendingTimeout) {
        pendingTimeout = setTimeout(() => runTransition(), 1000)
      }
    },
    getCurrentIndex() {
      return currentIndex
    }
  }
}

class Slide extends THREE.Mesh {
  constructor(width, height, phase) {
    const geometry = new SlideGeometry(width, height, phase)
    const material = createSlideMaterial(phase)
    super(geometry, material)

    this.totalDuration = geometry.totalDuration
    this.frustumCulled = false
  }

  get time() {
    return this.material.uniforms.uTime.value
  }

  set time(v) {
    this.material.uniforms.uTime.value = v
  }

  setImage(image) {
    this.material.uniforms.map.value.image = image
    this.material.uniforms.map.value.needsUpdate = true
  }
}

class SlideGeometry extends THREE.BAS.ModelBufferGeometry {
  constructor(width, height, phase) {
    const plane = new THREE.PlaneGeometry(width, height, width * 2, height * 2)
    THREE.BAS.Utils.separateFaces(plane)
    super(plane)

    this.bufferUVs()
    this.bufferAnimationAttributes(plane, width, height, phase)
  }

  bufferPositions() {
    const positionBuffer = this.createAttribute('position', 3).array

    for (let i = 0; i < this.faceCount; i++) {
      const face = this.modelGeometry.faces[i]
      const centroid = THREE.BAS.Utils.computeCentroid(this.modelGeometry, face)

      const a = this.modelGeometry.vertices[face.a]
      const b = this.modelGeometry.vertices[face.b]
      const c = this.modelGeometry.vertices[face.c]

      positionBuffer[face.a * 3] = a.x - centroid.x
      positionBuffer[face.a * 3 + 1] = a.y - centroid.y
      positionBuffer[face.a * 3 + 2] = a.z - centroid.z

      positionBuffer[face.b * 3] = b.x - centroid.x
      positionBuffer[face.b * 3 + 1] = b.y - centroid.y
      positionBuffer[face.b * 3 + 2] = b.z - centroid.z

      positionBuffer[face.c * 3] = c.x - centroid.x
      positionBuffer[face.c * 3 + 1] = c.y - centroid.y
      positionBuffer[face.c * 3 + 2] = c.z - centroid.z
    }
  }

  bufferAnimationAttributes(plane, width, height, phase) {
    const aAnimation = this.createAttribute('aAnimation', 2)
    const aStartPosition = this.createAttribute('aStartPosition', 3)
    const aControl0 = this.createAttribute('aControl0', 3)
    const aControl1 = this.createAttribute('aControl1', 3)
    const aEndPosition = this.createAttribute('aEndPosition', 3)

    const minDuration = 0.8
    const maxDuration = 1.2
    const maxDelayX = 0.9
    const maxDelayY = 0.125
    const stretch = 0.11

    this.totalDuration = maxDuration + maxDelayX + maxDelayY + stretch

    const startPosition = new THREE.Vector3()
    const control0 = new THREE.Vector3()
    const control1 = new THREE.Vector3()
    const endPosition = new THREE.Vector3()
    const tempPoint = new THREE.Vector3()

    const getControlPoint0 = (centroid) => {
      const signY = Math.sign(centroid.y)
      tempPoint.x = THREE.Math.randFloat(0.1, 0.3) * 50
      tempPoint.y = signY * THREE.Math.randFloat(0.1, 0.3) * 70
      tempPoint.z = THREE.Math.randFloatSpread(20)
      return tempPoint
    }

    const getControlPoint1 = (centroid) => {
      const signY = Math.sign(centroid.y)
      tempPoint.x = THREE.Math.randFloat(0.3, 0.6) * 50
      tempPoint.y = -signY * THREE.Math.randFloat(0.3, 0.6) * 70
      tempPoint.z = THREE.Math.randFloatSpread(20)
      return tempPoint
    }

    for (let i = 0, i2 = 0, i3 = 0; i < this.faceCount; i++, i2 += 6, i3 += 9) {
      const face = plane.faces[i]
      const centroid = THREE.BAS.Utils.computeCentroid(plane, face)

      const duration = THREE.Math.randFloat(minDuration, maxDuration)
      const delayX = THREE.Math.mapLinear(centroid.x, -width * 0.5, width * 0.5, 0.0, maxDelayX)
      const delayY = phase === 'in'
        ? THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0.0, maxDelayY)
        : THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, maxDelayY, 0.0)

      for (let v = 0; v < 6; v += 2) {
        aAnimation.array[i2 + v] = delayX + delayY + (Math.random() * stretch * duration)
        aAnimation.array[i2 + v + 1] = duration
      }

      endPosition.copy(centroid)
      startPosition.copy(centroid)

      if (phase === 'in') {
        control0.copy(centroid).sub(getControlPoint0(centroid))
        control1.copy(centroid).sub(getControlPoint1(centroid))
      } else {
        control0.copy(centroid).add(getControlPoint0(centroid))
        control1.copy(centroid).add(getControlPoint1(centroid))
      }

      for (let v = 0; v < 9; v += 3) {
        aStartPosition.array[i3 + v] = startPosition.x
        aStartPosition.array[i3 + v + 1] = startPosition.y
        aStartPosition.array[i3 + v + 2] = startPosition.z

        aControl0.array[i3 + v] = control0.x
        aControl0.array[i3 + v + 1] = control0.y
        aControl0.array[i3 + v + 2] = control0.z

        aControl1.array[i3 + v] = control1.x
        aControl1.array[i3 + v + 1] = control1.y
        aControl1.array[i3 + v + 2] = control1.z

        aEndPosition.array[i3 + v] = endPosition.x
        aEndPosition.array[i3 + v + 1] = endPosition.y
        aEndPosition.array[i3 + v + 2] = endPosition.z
      }
    }
  }
}

const createSlideMaterial = (phase) => {
  const texture = new THREE.Texture()
  texture.generateMipmaps = false
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping

  return new THREE.BAS.BasicAnimationMaterial(
    {
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { type: 'f', value: 0 }
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['cubic_bezier'],
        THREE.BAS.ShaderChunk['ease_in_out_cubic'],
        THREE.BAS.ShaderChunk['quaternion_rotation']
      ],
      shaderParameters: [
        'uniform float uTime;',
        'attribute vec2 aAnimation;',
        'attribute vec3 aStartPosition;',
        'attribute vec3 aControl0;',
        'attribute vec3 aControl1;',
        'attribute vec3 aEndPosition;'
      ],
      shaderVertexInit: [
        'float tDelay = aAnimation.x;',
        'float tDuration = aAnimation.y;',
        'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
        'float tProgress = ease(tTime, 0.0, 1.0, tDuration);'
      ],
      shaderTransformPosition: [
        phase === 'in'
          ? 'transformed *= tProgress;'
          : 'transformed *= 1.0 - tProgress;',
        'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);'
      ]
    },
    { map: texture }
  )
}

class THREERoot {
  constructor(container, params) {
    this.container = container
    this._animationId = null

    this.renderer = new THREE.WebGLRenderer({
      antialias: params.antialias,
      alpha: true
    })
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
    container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(
      params.fov,
      container.clientWidth / container.clientHeight,
      10,
      100000
    )

    this.scene = new THREE.Scene()

    this.resize()
    window.addEventListener('resize', this.resize)
    this.tick()
  }

  resize = () => {
    if (!this.container) return
    const { clientWidth, clientHeight } = this.container
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(clientWidth, clientHeight)
  }

  tick = () => {
    this.renderer.render(this.scene, this.camera)
    this._animationId = requestAnimationFrame(this.tick)
  }

  dispose() {
    if (this._animationId) cancelAnimationFrame(this._animationId)
    this._animationId = null
    window.removeEventListener('resize', this.resize)
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
