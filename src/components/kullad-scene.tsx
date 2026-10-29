"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type KulladSceneProps = {
  onReady?: () => void;
  onFail?: () => void;
};

function canvasTexture(width: number, height: number, paint: (context: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context) paint(context);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createClayTexture() {
  const texture = canvasTexture(512, 256, (context) => {
    const base = context.createLinearGradient(0, 0, 0, 256);
    base.addColorStop(0, "#b8623a");
    base.addColorStop(0.55, "#9e4f2d");
    base.addColorStop(1, "#7a3a1f");
    context.fillStyle = base;
    context.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y += 2) {
      const light = Math.random() > 0.5;
      context.fillStyle = light ? `rgba(255, 214, 170, ${Math.random() * 0.07})` : `rgba(70, 25, 10, ${Math.random() * 0.08})`;
      context.fillRect(0, y, 512, 1 + Math.random() * 2);
    }
    for (let index = 0; index < 3200; index += 1) {
      context.fillStyle = Math.random() > 0.55 ? "rgba(62, 22, 10, 0.32)" : "rgba(255, 222, 186, 0.16)";
      context.beginPath();
      context.arc(Math.random() * 512, Math.random() * 256, Math.random() * 1.3, 0, Math.PI * 2);
      context.fill();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

function createChaiTexture() {
  return canvasTexture(256, 256, (context) => {
    const body = context.createRadialGradient(128, 128, 8, 128, 128, 128);
    body.addColorStop(0, "#6e3a1d");
    body.addColorStop(0.55, "#8f5630");
    body.addColorStop(0.84, "#b07a4c");
    body.addColorStop(1, "#c99a6c");
    context.fillStyle = body;
    context.fillRect(0, 0, 256, 256);
    const shine = context.createRadialGradient(96, 88, 0, 96, 88, 70);
    shine.addColorStop(0, "rgba(255, 242, 222, 0.42)");
    shine.addColorStop(1, "rgba(255, 242, 222, 0)");
    context.fillStyle = shine;
    context.fillRect(0, 0, 256, 256);
  });
}

function createSoftDotTexture(color: string) {
  return canvasTexture(64, 64, (context) => {
    const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, 64, 64);
  });
}

export default function KulladScene({ onReady, onFail }: KulladSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onFail });

  useEffect(() => {
    callbacks.current = { onReady, onFail };
  }, [onReady, onFail]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch {
      callbacks.current.onFail?.();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.55;

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
    const lookTarget = new THREE.Vector3(0, 1.0, 0);

    scene.add(new THREE.HemisphereLight(0xffe7c2, 0x2a140a, 0.45));
    const key = new THREE.DirectionalLight(0xffd8a6, 2.1);
    key.position.set(-3.5, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffb357, 2.1);
    rim.position.set(4, 3.2, -4);
    scene.add(rim);

    const textures: THREE.Texture[] = [];
    const clayTexture = createClayTexture();
    const chaiTexture = createChaiTexture();
    const steamTexture = createSoftDotTexture("rgba(255, 244, 228, 1)");
    const sparkTexture = createSoftDotTexture("rgba(255, 214, 128, 1)");
    const shadowTexture = createSoftDotTexture("rgba(0, 0, 0, 0.85)");
    textures.push(clayTexture, chaiTexture, steamTexture, sparkTexture, shadowTexture);

    const stage = new THREE.Group();
    scene.add(stage);
    const cupGroup = new THREE.Group();
    stage.add(cupGroup);

    const gold = new THREE.MeshStandardMaterial({ color: 0xd9a84e, metalness: 1, roughness: 0.24, envMapIntensity: 1.25 });

    const profile = [
      [0, 0], [0.55, 0], [0.6, 0.04], [0.66, 0.3], [0.76, 0.9], [0.86, 1.45], [0.92, 1.78],
      [0.95, 1.86], [0.9, 1.9], [0.84, 1.86], [0.8, 1.6], [0.7, 0.9], [0.6, 0.25], [0, 0.2]
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const cup = new THREE.Mesh(
      new THREE.LatheGeometry(profile, 120),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        map: clayTexture,
        roughness: 0.74,
        clearcoat: 0.18,
        clearcoatRoughness: 0.55,
        sheen: 0.4,
        sheenColor: new THREE.Color(0xffc49a),
        side: THREE.DoubleSide,
        envMapIntensity: 0.45
      })
    );
    cupGroup.add(cup);

    const chai = new THREE.Mesh(
      new THREE.CircleGeometry(0.79, 72),
      new THREE.MeshPhysicalMaterial({ map: chaiTexture, roughness: 0.38, clearcoat: 0.2, clearcoatRoughness: 0.3, envMapIntensity: 0.2 })
    );
    chai.rotation.x = -Math.PI / 2;
    chai.position.y = 1.6;
    cupGroup.add(chai);

    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.895, 0.042, 24, 140), gold);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 1.885;
    cupGroup.add(lip);

    const band = new THREE.Mesh(new THREE.TorusGeometry(0.822, 0.022, 16, 140), gold);
    band.rotation.x = Math.PI / 2;
    band.position.y = 1.22;
    cupGroup.add(band);

    const beadGeometry = new THREE.SphereGeometry(0.036, 18, 12);
    for (let index = 0; index < 18; index += 1) {
      const angle = (index / 18) * Math.PI * 2;
      const bead = new THREE.Mesh(beadGeometry, gold);
      bead.position.set(Math.cos(angle) * 0.842, 1.22, Math.sin(angle) * 0.842);
      cupGroup.add(bead);
    }

    const saucerProfile = [[0, 0], [1.3, 0], [1.44, 0.04], [1.52, 0.1], [1.46, 0.12], [1.2, 0.07], [0, 0.07]]
      .map(([x, y]) => new THREE.Vector2(x, y));
    const saucer = new THREE.Mesh(
      new THREE.LatheGeometry(saucerProfile, 120),
      new THREE.MeshStandardMaterial({ color: 0x8a6326, metalness: 1, roughness: 0.4, envMapIntensity: 0.85 })
    );
    saucer.position.y = -0.07;
    stage.add(saucer);
    const saucerRim = new THREE.Mesh(new THREE.TorusGeometry(1.49, 0.03, 16, 160), gold);
    saucerRim.rotation.x = Math.PI / 2;
    saucerRim.position.y = 0.04;
    stage.add(saucerRim);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 4.6),
      new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0.75 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.09;
    stage.add(shadow);

    const steamCount = 90;
    const steamPositions = new Float32Array(steamCount * 3);
    const steamLife = new Float32Array(steamCount);
    const steamSeeds = Array.from({ length: steamCount }, () => ({
      speed: 0.16 + Math.random() * 0.14,
      phase: Math.random() * Math.PI * 2,
      x: (Math.random() - 0.5) * 0.7,
      z: (Math.random() - 0.5) * 0.5
    }));
    for (let index = 0; index < steamCount; index += 1) steamLife[index] = Math.random();
    const steamGeometry = new THREE.BufferGeometry();
    steamGeometry.setAttribute("position", new THREE.BufferAttribute(steamPositions, 3));
    steamGeometry.setAttribute("aLife", new THREE.BufferAttribute(steamLife, 1));
    const steamMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: steamTexture },
        uSize: { value: 190 * renderer.getPixelRatio() }
      },
      vertexShader: `
        attribute float aLife;
        uniform float uSize;
        varying float vAlpha;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = uSize * mix(0.55, 1.9, aLife) / -mvPosition.z;
          vAlpha = smoothstep(0.0, 0.18, aLife) * (1.0 - smoothstep(0.5, 1.0, aLife));
        }
      `,
      fragmentShader: `
        uniform sampler2D uMap;
        varying float vAlpha;
        void main() {
          vec4 tex = texture2D(uMap, gl_PointCoord);
          gl_FragColor = vec4(vec3(1.0, 0.96, 0.9), tex.a * vAlpha * 0.15);
        }
      `
    });
    const steam = new THREE.Points(steamGeometry, steamMaterial);
    stage.add(steam);

    const sparkCount = 34;
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let index = 0; index < sparkCount; index += 1) {
      const radius = 1.7 + Math.random() * 0.9;
      const angle = Math.random() * Math.PI * 2;
      sparkPositions[index * 3] = Math.cos(angle) * radius;
      sparkPositions[index * 3 + 1] = 0.2 + Math.random() * 2.6;
      sparkPositions[index * 3 + 2] = Math.sin(angle) * radius;
    }
    const sparkGeometry = new THREE.BufferGeometry();
    sparkGeometry.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMaterial = new THREE.PointsMaterial({
      map: sparkTexture,
      size: 0.09,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
    scene.add(sparks);

    const pointer = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
      pointer.y = THREE.MathUtils.clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const fitHeight = Math.max(3.95, 3.9 / camera.aspect);
      const distance = fitHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
      camera.position.set(0, lookTarget.y + distance * 0.34, distance * 0.94);
      camera.lookAt(lookTarget);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    let lastFrameAt = startedAt;
    const clock = {
      getDelta() {
        const now = performance.now();
        const delta = (now - lastFrameAt) / 1000;
        lastFrameAt = now;
        return delta;
      },
      get elapsedTime() {
        return (lastFrameAt - startedAt) / 1000;
      }
    };
    let frame = 0;
    let visible = true;
    let readySent = false;

    const updateSteam = (delta: number, elapsed: number) => {
      for (let index = 0; index < steamCount; index += 1) {
        const seed = steamSeeds[index];
        let life = steamLife[index] + delta * seed.speed;
        if (life >= 1) life -= 1;
        steamLife[index] = life;
        steamPositions[index * 3] = seed.x * (0.4 + life) + Math.sin(elapsed * 0.9 + seed.phase + life * 5) * 0.16 * life;
        steamPositions[index * 3 + 1] = 1.92 + life * 1.45;
        steamPositions[index * 3 + 2] = seed.z * (0.4 + life);
      }
      steamGeometry.attributes.position.needsUpdate = true;
      steamGeometry.attributes.aLife.needsUpdate = true;
    };

    const draw = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.elapsedTime;
      tilt.x += (pointer.x - tilt.x) * 0.05;
      tilt.y += (pointer.y - tilt.y) * 0.05;
      cupGroup.rotation.y = elapsed * 0.32;
      stage.rotation.x = 0.06 + tilt.y * 0.1;
      stage.rotation.z = -tilt.x * 0.07;
      stage.position.y = Math.sin(elapsed * 1.15) * 0.035;
      sparks.rotation.y = elapsed * 0.05;
      sparkMaterial.opacity = 0.55 + Math.sin(elapsed * 2.2) * 0.25;
      updateSteam(delta, elapsed);
      renderer.render(scene, camera);
      if (!readySent) {
        readySent = true;
        mount.classList.add("is-ready");
        callbacks.current.onReady?.();
      }
    };

    const loop = () => {
      frame = 0;
      if (!visible || document.hidden) return;
      draw();
      if (!reducedMotion) frame = window.requestAnimationFrame(loop);
    };
    const start = () => {
      if (!frame) frame = window.requestAnimationFrame(loop);
    };

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        clock.getDelta();
        start();
      }
    });
    intersection.observe(mount);
    const onVisibility = () => {
      if (!document.hidden) {
        clock.getDelta();
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    try {
      draw();
      if (!reducedMotion) start();
    } catch {
      callbacks.current.onFail?.();
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      intersection.disconnect();
      resizeObserver.disconnect();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(material)) material.forEach((item) => item.dispose());
        else material?.dispose();
      });
      beadGeometry.dispose();
      textures.forEach((texture) => texture.dispose());
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      mount.classList.remove("is-ready");
    };
  }, []);

  return <div ref={mountRef} className="rt-scene" aria-hidden="true" />;
}
