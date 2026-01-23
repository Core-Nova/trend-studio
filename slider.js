'use strict';

export const initSliders = ({
  imagesConfig,
  THREE,
  TweenMax,
  Power0,
  documentRef = document,
  windowRef = window,
  mobileBreakpoint = 768
}) => {
  const isMobile =
    windowRef.innerWidth <= mobileBreakpoint ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      windowRef.navigator.userAgent
    );

  if (isMobile) {
    console.info('Mobile detected – sliders disabled');
    return;
  }

  if (!imagesConfig) {
    console.error('imagesConfig missing');
    return;
  }

  const {
    hero_left = [],
    hero_right = [],
    gallery = []
  } = imagesConfig;

  const leftContainer = documentRef.getElementById('three-container-left');
  const rightContainer = documentRef.getElementById('three-container-right');

  if (leftContainer && hero_left.length) {
    createImageSlider({
      container: leftContainer,
      images: hero_left,
      THREE,
      TweenMax,
      Power0,
      width: 70,
      height: 105
    });
  }

  if (rightContainer && hero_right.length) {
    setTimeout(() => {
      createImageSlider({
        container: rightContainer,
        images: hero_right,
        THREE,
        TweenMax,
        Power0,
        width: 70,
        height: 105
      });
    }, 500);
  }

  if (gallery.length) {
    initGallerySliders({
      gallery,
      THREE,
      TweenMax,
      Power0,
      documentRef
    });
  }
};

const createImageSlider = ({
  container,
  images,
  THREE,
  TweenMax,
  Power0,
  width,
  height,
  delay = 0
}) => {
  if (!container || !images.length) return;

  const root = new THREERoot(container, THREE, {
    antialias: window.devicePixelRatio === 1,
    fov: 80
  });

  root.renderer.setClearColor(0x000000, 0);
  root.camera.position.set(0, 0, 60);

  const slideOut = new Slide(THREE, width, height, 'out');
  const slideIn = new Slide(THREE, width, height, 'in');

  root.scene.add(slideOut, slideIn);

  let currentIndex = 0;

  const loadImage = (url, slide) =>
    new Promise((resolve, reject) => {
      const loader = new THREE.ImageLoader();
      if (url.startsWith('http')) loader.setCrossOrigin('Anonymous');

      loader.load(
        url,
        img => {
          slide.setImage(img);
          slide.time = 0;
          resolve();
        },
        undefined,
        reject
      );
    });

  const transition = async () => {
    await loadImage(images[currentIndex], slideOut);
    await loadImage(images[(currentIndex + 1) % images.length], slideIn);

    TweenMax.to(slideOut, 3, {
      time: slideOut.totalDuration,
      ease: Power0.easeInOut
    });

    TweenMax.to(slideIn, 3, {
      time: slideIn.totalDuration,
      ease: Power0.easeInOut,
      onComplete: () => {
        currentIndex = (currentIndex + 1) % images.length;
        setTimeout(transition, 1000);
      }
    });
  };

  setTimeout(transition, delay);
};

const initGallerySliders = ({
  gallery,
  THREE,
  TweenMax,
  Power0,
  documentRef
}) => {
  for (let i = 0; i < 4; i++) {
    const container = documentRef.getElementById(`gallery-container-${i + 1}`);
    if (!container) continue;

    const staggered = gallery.map((_, j) => gallery[(i + j) % gallery.length]);

    createImageSlider({
      container,
      images: staggered,
      THREE,
      TweenMax,
      Power0,
      width: 120,
      height: 160,
      delay: i * 200
    });
  }
};


class Slide extends THREE.Mesh {
  constructor(THREE, width, height, phase) {
    const geometry = new SlideGeometry(THREE, width, height, phase);
    const material = createSlideMaterial(THREE, phase);
    super(geometry, material);

    this.totalDuration = geometry.totalDuration;
    this.frustumCulled = false;
  }

  get time() {
    return this.material.uniforms.uTime.value;
  }

  set time(v) {
    this.material.uniforms.uTime.value = v;
  }

  setImage(image) {
    this.material.uniforms.map.value.image = image;
    this.material.uniforms.map.value.needsUpdate = true;
  }
}

class SlideGeometry extends THREE.BAS.ModelBufferGeometry {
  constructor(THREE, width, height, phase) {
    const plane = new THREE.PlaneGeometry(width, height, width * 2, height * 2);
    THREE.BAS.Utils.separateFaces(plane);
    super(plane);

    this.bufferUVs();
    this.totalDuration = 2.5;
  }
}

const createSlideMaterial = (THREE, phase) =>
  new THREE.BAS.BasicAnimationMaterial(
    {
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0 }
      },
      shaderFunctions: [
        THREE.BAS.ShaderChunk['cubic_bezier'],
        THREE.BAS.ShaderChunk['ease_in_out_cubic']
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
    { map: new THREE.Texture() }
  );


class THREERoot {
  constructor(container, THREE, params) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({
      antialias: params.antialias,
      alpha: true
    });

    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      params.fov,
      container.clientWidth / container.clientHeight,
      10,
      100000
    );

    this.scene = new THREE.Scene();

    this.resize();
    window.addEventListener('resize', this.resize);
    this.tick();
  }

  resize = () => {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  };

  tick = () => {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.tick);
  };
}
