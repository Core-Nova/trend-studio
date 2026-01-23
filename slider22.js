
(function() {
    'use strict';

    function isMobile() {
        return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    var isMobileDevice = isMobile();
    if (isMobileDevice) {
        console.log('Mobile device detected - desktop sliders disabled. Mobile view will be implemented separately.');
    }

    var leftHeroImages = [];
    var rightHeroImages = [];
    var galleryImages = [];

    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    function loadImagesFromConfig() {
        if (typeof window.imagesConfig !== 'undefined') {
            leftHeroImages = window.imagesConfig.hero_left || [];
            rightHeroImages = window.imagesConfig.hero_right || [];
            galleryImages = window.imagesConfig.gallery || [];
            console.log('Images loaded from config:', {
                hero_left: leftHeroImages.length,
                hero_right: rightHeroImages.length,
                gallery: galleryImages.length
            });
        } else {
            console.error('window.imagesConfig not found! Make sure imagesConfig script is loaded before slider.js');
        }
        
        initializeSliders();
    }

    function initializeSliders() {
        if (isMobileDevice) {
            console.log('Skipping slider initialization - mobile device detected');
            return;
        }

        var leftContainer = document.getElementById('three-container-left');
        console.log('Left container found:', !!leftContainer, 'Images:', leftHeroImages.length);
        if (leftContainer && leftHeroImages.length > 0) {
            createImageSlider({
                container: leftContainer,
                images: leftHeroImages,
                direction: 'left-to-right',
                width: 70,
                height: 105
            });
        }

        var rightContainer = document.getElementById('three-container-right');
        console.log('Right container found:', !!rightContainer, 'Images:', rightHeroImages.length);
        if (rightContainer && rightHeroImages.length > 0) {
            setTimeout(function() {
                createImageSlider({
                    container: rightContainer,
                    images: rightHeroImages,
                    direction: 'left-to-right',
                    width: 70,
                    height: 105
                });
            }, 500);
        }

        if (galleryImages.length > 0) {
            initializeGallerySliders();
        }
    }

    ready(function() {
        loadImagesFromConfig();
    });

 
    function createImageSlider(config) {
        var container = config.container;
        var images = config.images || [];
        var direction = config.direction || 'left-to-right';
        var width = config.width || 100;
        var height = config.height || 133;
        var delay = config.delay || 0;

        if (!container || images.length === 0) return;

        setTimeout(function() {
            var root = new THREERoot(container, {
                createCameraControls: false,
                antialias: (window.devicePixelRatio === 1),
                fov: 80
            });

            root.renderer.setClearColor(0x000000, 0);
            if (root.renderer.setPixelRatio) {
                root.renderer.setPixelRatio(window.devicePixelRatio || 1);
            }
            root.camera.position.set(0, 0, 60);

            var slideOut = new Slide(width, height, 'out');
            var slideIn = new Slide(width, height, 'in');
            
            var currentImageIndex = 0;
            var nextImageIndex = 1;
            
            var loader1 = new THREE.ImageLoader();
            if (images[0] && images[0].indexOf('http') === 0) {
                loader1.setCrossOrigin('Anonymous');
            }
            loader1.load(images[0], function(img) {
                console.log('First image loaded successfully:', images[0]);
                slideOut.setImage(img);
                slideOut.time = 0;
            }, undefined, function(error) {
                console.error('Error loading image:', images[0], error);
                console.error('Make sure the image path is correct and file exists');
            });
            root.scene.add(slideOut);

            var loader2 = new THREE.ImageLoader();
            if (images.length > 1) {
                if (images[1] && images[1].indexOf('http') === 0) {
                    loader2.setCrossOrigin('Anonymous');
                }
                loader2.load(images[1], function(img) {
                    slideIn.setImage(img);
                    slideIn.time = 0; // Start hidden
                }, undefined, function(error) {
                    console.error('Error loading image:', images[1], error);
                });
            }
            root.scene.add(slideIn);

            function createContinuousTransition() {
                var outTween = TweenMax.to(slideOut, 3.0, {
                    time: slideOut.totalDuration,
                    ease: Power0.easeInOut
                });
                
                var inTween = TweenMax.to(slideIn, 3.0, {
                    time: slideIn.totalDuration,
                    ease: Power0.easeInOut,
                    onComplete: function() {
                        currentImageIndex = (currentImageIndex + 1) % images.length;
                        nextImageIndex = (currentImageIndex + 1) % images.length;
                        
                        var currentImg = slideIn.material.uniforms.map.value.image;
                        slideOut.setImage(currentImg);
                        slideOut.time = 0;
                        
                        var loader = new THREE.ImageLoader();
                        if (images[nextImageIndex] && images[nextImageIndex].indexOf('http') === 0) {
                            loader.setCrossOrigin('Anonymous');
                        }
                        loader.load(images[nextImageIndex], function(img) {
                            slideIn.setImage(img);
                            slideIn.time = 0;
                        }, undefined, function(error) {
                            console.error('Error loading image:', images[nextImageIndex], error);
                        });
                        
                        setTimeout(function() {
                            createContinuousTransition();
                        }, 1000);
                    }
                });
            }
            
            setTimeout(function() {
                createContinuousTransition();
            }, delay + 1000);

            return { root: root };
        }, delay);
    }

    function initializeGallerySliders() {
        var numContainers = 4;
        for (var i = 0; i < numContainers; i++) {
            var containerId = 'gallery-container-' + (i + 1);
            var container = document.getElementById(containerId);
            
            if (!container) continue;

            var staggeredImages = [];
            for (var j = 0; j < galleryImages.length; j++) {
                var imageIndex = (i + j) % galleryImages.length;
                staggeredImages.push(galleryImages[imageIndex]);
            }
            var firstImageIndex = i % galleryImages.length;
            staggeredImages.push(galleryImages[firstImageIndex]);

            createImageSlider({
                container: container,
                images: staggeredImages,
                direction: 'left-to-right',
                width: 120,
                height: 160,
                delay: i * 200
            });
        }
    }

    function Slide(width, height, animationPhase) {
        var plane = new THREE.PlaneGeometry(width, height, width * 2, height * 2);

        THREE.BAS.Utils.separateFaces(plane);

        var geometry = new SlideGeometry(plane);
        geometry.bufferUVs();

        var aAnimation = geometry.createAttribute('aAnimation', 2);
        var aStartPosition = geometry.createAttribute('aStartPosition', 3);
        var aControl0 = geometry.createAttribute('aControl0', 3);
        var aControl1 = geometry.createAttribute('aControl1', 3);
        var aEndPosition = geometry.createAttribute('aEndPosition', 3);

        var i, i2, i3, v;

        var minDuration = 0.8;
        var maxDuration = 1.2;
        var maxDelayX = 0.9;
        var maxDelayY = 0.125;
        var stretch = 0.11;

        this.totalDuration = maxDuration + maxDelayX + maxDelayY + stretch;

        var startPosition = new THREE.Vector3();
        var control0 = new THREE.Vector3();
        var control1 = new THREE.Vector3();
        var endPosition = new THREE.Vector3();
        var tempPoint = new THREE.Vector3();

        function getControlPoint0(centroid) {
            var signY = Math.sign(centroid.y);
            tempPoint.x = THREE.Math.randFloat(0.1, 0.3) * 50;
            tempPoint.y = signY * THREE.Math.randFloat(0.1, 0.3) * 70;
            tempPoint.z = THREE.Math.randFloatSpread(20);
            return tempPoint;
        }

        function getControlPoint1(centroid) {
            var signY = Math.sign(centroid.y);
            tempPoint.x = THREE.Math.randFloat(0.3, 0.6) * 50;
            tempPoint.y = -signY * THREE.Math.randFloat(0.3, 0.6) * 70;
            tempPoint.z = THREE.Math.randFloatSpread(20);
            return tempPoint;
        }

        for (i = 0, i2 = 0, i3 = 0; i < geometry.faceCount; i++, i2 += 6, i3 += 9) {
            var face = plane.faces[i];
            var centroid = THREE.BAS.Utils.computeCentroid(plane, face);

            var duration = THREE.Math.randFloat(minDuration, maxDuration);
            var delayX = THREE.Math.mapLinear(centroid.x, -width * 0.5, width * 0.5, 0.0, maxDelayX);
            var delayY;

            if (animationPhase === 'in') {
                delayY = THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, 0.0, maxDelayY);
            } else {
                delayY = THREE.Math.mapLinear(Math.abs(centroid.y), 0, height * 0.5, maxDelayY, 0.0);
            }

            for (v = 0; v < 6; v += 2) {
                aAnimation.array[i2 + v] = delayX + delayY + (Math.random() * stretch * duration);
                aAnimation.array[i2 + v + 1] = duration;
            }

            endPosition.copy(centroid);
            startPosition.copy(centroid);

            if (animationPhase === 'in') {
                control0.copy(centroid).sub(getControlPoint0(centroid));
                control1.copy(centroid).sub(getControlPoint1(centroid));
            } else {
                control0.copy(centroid).add(getControlPoint0(centroid));
                control1.copy(centroid).add(getControlPoint1(centroid));
            }

            for (v = 0; v < 9; v += 3) {
                aStartPosition.array[i3 + v] = startPosition.x;
                aStartPosition.array[i3 + v + 1] = startPosition.y;
                aStartPosition.array[i3 + v + 2] = startPosition.z;

                aControl0.array[i3 + v] = control0.x;
                aControl0.array[i3 + v + 1] = control0.y;
                aControl0.array[i3 + v + 2] = control0.z;

                aControl1.array[i3 + v] = control1.x;
                aControl1.array[i3 + v + 1] = control1.y;
                aControl1.array[i3 + v + 2] = control1.z;

                aEndPosition.array[i3 + v] = endPosition.x;
                aEndPosition.array[i3 + v + 1] = endPosition.y;
                aEndPosition.array[i3 + v + 2] = endPosition.z;
            }
        }

        var material = new THREE.BAS.BasicAnimationMaterial(
            {
                shading: THREE.FlatShading,
                side: THREE.DoubleSide,
                uniforms: {
                    uTime: {type: 'f', value: 0}
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
                    'attribute vec3 aEndPosition;',
                ],
                shaderVertexInit: [
                    'float tDelay = aAnimation.x;',
                    'float tDuration = aAnimation.y;',
                    'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
                    'float tProgress = ease(tTime, 0.0, 1.0, tDuration);'
                ],
                shaderTransformPosition: [
                    (animationPhase === 'in' ? 'transformed *= tProgress;' : 'transformed *= 1.0 - tProgress;'),
                    'transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);'
                ]
            },
            {
                map: new THREE.Texture(),
            }
        );

        THREE.Mesh.call(this, geometry, material);
        this.frustumCulled = false;
    }
    Slide.prototype = Object.create(THREE.Mesh.prototype);
    Slide.prototype.constructor = Slide;
    Object.defineProperty(Slide.prototype, 'time', {
        get: function () {
            return this.material.uniforms['uTime'].value;
        },
        set: function (v) {
            this.material.uniforms['uTime'].value = v;
        }
    });

    Slide.prototype.setImage = function(image) {
        this.material.uniforms.map.value.image = image;
        this.material.uniforms.map.value.needsUpdate = true;
    };

    Slide.prototype.transition = function() {
        return TweenMax.fromTo(this, 3.0, {time:0.0}, {time:this.totalDuration, ease:Power0.easeInOut});
    };

    function SlideGeometry(model) {
        THREE.BAS.ModelBufferGeometry.call(this, model);
    }
    SlideGeometry.prototype = Object.create(THREE.BAS.ModelBufferGeometry.prototype);
    SlideGeometry.prototype.constructor = SlideGeometry;
    SlideGeometry.prototype.bufferPositions = function () {
        var positionBuffer = this.createAttribute('position', 3).array;

        for (var i = 0; i < this.faceCount; i++) {
            var face = this.modelGeometry.faces[i];
            var centroid = THREE.BAS.Utils.computeCentroid(this.modelGeometry, face);

            var a = this.modelGeometry.vertices[face.a];
            var b = this.modelGeometry.vertices[face.b];
            var c = this.modelGeometry.vertices[face.c];

            positionBuffer[face.a * 3] = a.x - centroid.x;
            positionBuffer[face.a * 3 + 1] = a.y - centroid.y;
            positionBuffer[face.a * 3 + 2] = a.z - centroid.z;

            positionBuffer[face.b * 3] = b.x - centroid.x;
            positionBuffer[face.b * 3 + 1] = b.y - centroid.y;
            positionBuffer[face.b * 3 + 2] = b.z - centroid.z;

            positionBuffer[face.c * 3] = c.x - centroid.x;
            positionBuffer[face.c * 3 + 1] = c.y - centroid.y;
            positionBuffer[face.c * 3 + 2] = c.z - centroid.z;
        }
    };

    function THREERoot(container, params) {
        params = utils.extend({
            fov: 60,
            zNear: 10,
            zFar: 100000,
            createCameraControls: true
        }, params);

        this.container = container;

        this.renderer = new THREE.WebGLRenderer({
            antialias: params.antialias,
            alpha: true
        });
        if (this.renderer.setPixelRatio) {
            this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
        }
        container.appendChild(this.renderer.domElement);

        this.camera = new THREE.PerspectiveCamera(
            params.fov,
            container.clientWidth / container.clientHeight,
            params.zNear,
            params.zFar
        );

        this.scene = new THREE.Scene();

        if (params.createCameraControls && THREE.OrbitControls) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        }

        this.resize = this.resize.bind(this);
        this.tick = this.tick.bind(this);

        this.resize();
        this.tick();

        window.addEventListener('resize', this.resize, false);
    }
    THREERoot.prototype = {
        tick: function () {
            this.update();
            this.render();
            requestAnimationFrame(this.tick);
        },
        update: function () {
            this.controls && this.controls.update();
        },
        render: function () {
            this.renderer.render(this.scene, this.camera);
        },
        resize: function () {
            if (!this.container) return;
            
            var width = this.container.clientWidth;
            var height = this.container.clientHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }
    };

    ////////////////////
    // UTILS
    ////////////////////

    var utils = {
        extend: function (dst, src) {
            for (var key in src) {
                dst[key] = src[key];
            }
            return dst;
        }
    };

})();