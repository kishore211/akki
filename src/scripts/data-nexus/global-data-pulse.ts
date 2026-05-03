import type * as Three from 'three';
import { trackNexusEvent } from './analytics';

interface PulseRegion {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  dataSignal: string;
  infrastructure: string;
  governance: string;
  pressure: string;
  accent: string;
}

interface RegionMarker {
  id: string;
  shell: Three.Group;
  hitTarget: Three.Mesh;
  dot: Three.Mesh<Three.SphereGeometry, Three.MeshStandardMaterial>;
  glow: Three.Mesh<Three.SphereGeometry, Three.MeshBasicMaterial>;
}

interface RouteArc {
  mesh: Three.Mesh<Three.TubeGeometry, Three.MeshBasicMaterial>;
  from: string;
  to: string;
}

type ThreeModule = typeof import('three');

const EARTH_TEXTURE_URL = '/assets/data-nexus/earth-blue-marble-2048.jpg';
const CLOUD_TEXTURE_URL = '/assets/data-nexus/earth-clouds-1024.png';

const parseRegions = (value: string): PulseRegion[] => {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is PulseRegion => {
      if (!item || typeof item !== 'object') return false;
      const region = item as Partial<PulseRegion>;
      return Boolean(
        region.id && region.name && typeof region.latitude === 'number' && typeof region.longitude === 'number'
      );
    });
  } catch {
    return [];
  }
};

const supportsWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[character] ?? character;
  });

const latLongToVector = (THREE: ThreeModule, latitude: number, longitude: number, radius: number) => {
  const phi = ((90 - latitude) * Math.PI) / 180;
  const theta = ((longitude + 180) * Math.PI) / 180;

  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getShortestAngle = (from: number, to: number) => {
  const fullTurn = Math.PI * 2;
  return ((to - from + Math.PI + fullTurn) % fullTurn) - Math.PI;
};

const createGlobeTexture = (THREE: ThreeModule) => {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 1024;
  textureCanvas.height = 512;
  const context = textureCanvas.getContext('2d');
  if (!context) return null;

  const width = textureCanvas.width;
  const height = textureCanvas.height;
  const ocean = context.createLinearGradient(0, 0, width, height);
  ocean.addColorStop(0, '#042f4f');
  ocean.addColorStop(0.42, '#075985');
  ocean.addColorStop(1, '#0f766e');
  context.fillStyle = ocean;
  context.fillRect(0, 0, width, height);

  const point = (longitude: number, latitude: number) => [
    ((longitude + 180) / 360) * width,
    ((90 - latitude) / 180) * height,
  ];
  const drawLand = (coordinates: number[][], fill: string) => {
    context.beginPath();
    coordinates.forEach(([longitude, latitude], index) => {
      const [x, y] = point(longitude, latitude);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = 'rgba(236, 253, 245, 0.2)';
    context.lineWidth = 1.5;
    context.stroke();
  };

  [
    {
      fill: '#166534',
      coordinates: [
        [-168, 66],
        [-140, 72],
        [-104, 58],
        [-83, 47],
        [-66, 33],
        [-80, 17],
        [-101, 18],
        [-118, 32],
        [-132, 48],
        [-158, 55],
      ],
    },
    {
      fill: '#15803d',
      coordinates: [
        [-82, 13],
        [-61, 7],
        [-48, -8],
        [-53, -24],
        [-66, -54],
        [-78, -42],
        [-74, -15],
        [-85, 3],
      ],
    },
    {
      fill: '#4d7c0f',
      coordinates: [
        [-11, 36],
        [18, 58],
        [54, 56],
        [96, 62],
        [139, 50],
        [149, 26],
        [107, 4],
        [74, 9],
        [47, 26],
        [18, 34],
      ],
    },
    {
      fill: '#65a30d',
      coordinates: [
        [-18, 34],
        [32, 32],
        [51, 10],
        [43, -27],
        [20, -35],
        [4, -19],
        [-12, 6],
      ],
    },
    {
      fill: '#84cc16',
      coordinates: [
        [109, -10],
        [154, -10],
        [164, -32],
        [136, -44],
        [114, -31],
      ],
    },
    {
      fill: '#bef264',
      coordinates: [
        [-62, 72],
        [-30, 75],
        [-18, 64],
        [-44, 58],
        [-70, 62],
      ],
    },
  ].forEach((shape) => drawLand(shape.coordinates, shape.fill));

  context.strokeStyle = 'rgba(191, 219, 254, 0.14)';
  context.lineWidth = 1;
  for (let longitude = -150; longitude <= 180; longitude += 30) {
    const [x] = point(longitude, 0);
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let latitude = -60; latitude <= 60; latitude += 20) {
    const [, y] = point(0, latitude);
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.globalAlpha = 0.2;
  context.fillStyle = '#e0f2fe';
  for (let index = 0; index < 700; index += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 1.1 + 0.25;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
};

const createCloudTexture = (THREE: ThreeModule) => {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 1024;
  textureCanvas.height = 512;
  const context = textureCanvas.getContext('2d');
  if (!context) return null;

  context.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
  for (let band = 0; band < 8; band += 1) {
    const y = 80 + band * 48 + Math.random() * 20;
    context.beginPath();
    context.moveTo(0, y);
    for (let x = 0; x <= textureCanvas.width; x += 48) {
      context.lineTo(x, y + Math.sin(x * 0.018 + band) * 16 + Math.random() * 8);
    }
    context.strokeStyle = `rgba(255,255,255,${0.08 + Math.random() * 0.12})`;
    context.lineWidth = 16 + Math.random() * 20;
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.needsUpdate = true;
  return texture;
};

const loadTexture = async (THREE: ThreeModule, url: string) => {
  const loader = new THREE.TextureLoader();

  return new Promise<Three.Texture | null>((resolve) => {
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 4;
        texture.needsUpdate = true;
        resolve(texture);
      },
      undefined,
      () => resolve(null)
    );
  });
};

const createRoute = (THREE: ThreeModule, from: PulseRegion, to: PulseRegion, color: string): RouteArc => {
  const start = latLongToVector(THREE, from.latitude, from.longitude, 2.2);
  const end = latLongToVector(THREE, to.latitude, to.longitude, 2.2);
  const middle = start.clone().add(end).normalize().multiplyScalar(2.88);
  const curve = new THREE.CatmullRomCurve3([start, middle, end]);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 56, 0.008, 8, false),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.26,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  return { mesh, from: from.id, to: to.id };
};

const disposeObject = (object: Three.Object3D) => {
  object.traverse((child) => {
    const mesh = child as Three.Mesh<Three.BufferGeometry, Three.Material | Three.Material[]>;
    mesh.geometry?.dispose();
    if (Array.isArray(mesh.material)) mesh.material.forEach((material) => material.dispose());
    else mesh.material?.dispose();
  });
};

const bootGlobalDataPulse = async (root: HTMLElement) => {
  if (root.dataset.globalPulseReady === 'true' || root.dataset.globalPulseReady === 'booting') return;
  root.dataset.globalPulseReady = 'booting';

  const canvas = root.querySelector<HTMLCanvasElement>('[data-global-pulse-canvas]');
  const fallback = root.querySelector<HTMLElement>('[data-global-pulse-fallback]');
  const loading = root.querySelector<HTMLElement>('[data-global-pulse-loading]');
  const tooltip = root.querySelector<HTMLElement>('[data-global-pulse-tooltip]');
  const liveRegion = root.querySelector<HTMLElement>('[data-global-pulse-live]');
  const dataScript = root.querySelector<HTMLScriptElement>('[data-pulse-regions]');
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-region-button]'));
  const regions = parseRegions(dataScript?.textContent ?? '[]');

  const hideLoading = () => {
    loading?.classList.add('hidden');
  };

  const revealFallback = () => {
    hideLoading();
    fallback?.classList.remove('hidden');
    fallback?.classList.add('grid');
  };

  if (!canvas || !tooltip || regions.length === 0) {
    root.dataset.globalPulseReady = 'fallback';
    revealFallback();
    return;
  }

  if (!supportsWebGL()) {
    root.dataset.globalPulseReady = 'fallback';
    revealFallback();
    return;
  }

  try {
    const THREE = await import('three');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const group = new THREE.Group();
    const markerGroup = new THREE.Group();
    const routeGroup = new THREE.Group();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const markers: RegionMarker[] = [];
    const hitTargets: Three.Mesh[] = [];
    const routes: RouteArc[] = [];

    renderer.setClearColor(0x020617, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;

    camera.position.set(0, 0, 6.05);
    scene.add(group);
    group.add(routeGroup, markerGroup);

    const [downloadedGlobeTexture, downloadedCloudTexture] = await Promise.all([
      loadTexture(THREE, EARTH_TEXTURE_URL),
      loadTexture(THREE, CLOUD_TEXTURE_URL),
    ]);
    const globeTexture = downloadedGlobeTexture ?? createGlobeTexture(THREE);
    const cloudTexture = downloadedCloudTexture ?? createCloudTexture(THREE);
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(2, 96, 96),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: globeTexture ?? undefined,
        roughness: 0.58,
        metalness: 0.02,
      })
    );
    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(2.025, 96, 96),
      new THREE.MeshBasicMaterial({
        map: cloudTexture ?? undefined,
        color: 0xffffff,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(2.018, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0xbfdbfe, wireframe: true, transparent: true, opacity: 0.1 })
    );
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.3, 96, 96),
      new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    group.add(globe, clouds, wire, atmosphere);
    scene.add(new THREE.HemisphereLight(0xdbeafe, 0x020617, 1.45));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.1);
    keyLight.position.set(3.6, 4.8, 5.4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x67e8f9, 1.25);
    rimLight.position.set(-4, 1.2, -3);
    scene.add(rimLight);

    regions.forEach((region) => {
      const shell = new THREE.Group();
      shell.position.copy(latLongToVector(THREE, region.latitude, region.longitude, 2.24));
      shell.lookAt(new THREE.Vector3(0, 0, 0));

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 24, 24),
        new THREE.MeshStandardMaterial({
          color: region.accent,
          emissive: region.accent,
          emissiveIntensity: 1.8,
          roughness: 0.25,
        })
      );
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 24, 24),
        new THREE.MeshBasicMaterial({
          color: region.accent,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      const hitTarget = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 18, 18),
        new THREE.MeshBasicMaterial({ color: region.accent, transparent: true, opacity: 0.001, depthWrite: false })
      );
      hitTarget.userData.regionId = region.id;
      shell.add(glow, dot, hitTarget);
      markerGroup.add(shell);
      markers.push({ id: region.id, shell, hitTarget, dot, glow });
      hitTargets.push(hitTarget);
    });

    regions.slice(1).forEach((region, index) => {
      const route = createRoute(THREE, regions[0], region, region.accent);
      route.mesh.userData.phase = index * 0.7;
      routeGroup.add(route.mesh);
      routes.push(route);
    });

    let frameId = 0;
    let isVisible = true;
    let isDragging = false;
    let previousX = 0;
    let previousY = 0;
    let dragDistance = 0;
    let velocityX = 0;
    let activeRegionId = '';
    let targetRotationX = -0.12;
    let targetRotationY = 0.28;
    let focusUntil = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const setFocusTarget = (region: PulseRegion) => {
      targetRotationX = clamp((region.latitude / 90) * 0.55, -0.62, 0.62);
      targetRotationY = THREE.MathUtils.degToRad(-region.longitude) - Math.PI / 2;
      focusUntil = performance.now() + 1800;
    };

    const render = () => {
      if (!isVisible) {
        frameId = 0;
        return;
      }

      const elapsed = performance.now() * 0.001;
      const shouldFocus = !isDragging && performance.now() < focusUntil;
      if (shouldFocus) {
        group.rotation.x += (targetRotationX - group.rotation.x) * 0.045;
        group.rotation.y += getShortestAngle(group.rotation.y, targetRotationY) * 0.045;
      } else if (!isDragging) {
        group.rotation.y += 0.0018 + velocityX;
        velocityX *= 0.94;
      }

      clouds.rotation.y += 0.0009;
      routeGroup.rotation.y = Math.sin(elapsed * 0.18) * 0.018;

      markers.forEach((marker, index) => {
        const isActive = marker.id === activeRegionId;
        const pulse = 1 + Math.sin(elapsed * 3.2 + index * 0.8) * 0.09;
        marker.shell.scale.setScalar(isActive ? 1.55 + Math.sin(elapsed * 4.6) * 0.08 : pulse);
        marker.glow.material.opacity = isActive ? 0.42 : 0.2 + Math.sin(elapsed * 3 + index) * 0.08;
        marker.dot.material.emissiveIntensity = isActive ? 2.8 : 1.5;
      });

      routes.forEach((route, index) => {
        const isActive = route.from === activeRegionId || route.to === activeRegionId;
        const phase = Number(route.mesh.userData.phase ?? index);
        route.mesh.material.opacity = isActive ? 0.62 : 0.2 + Math.sin(elapsed * 2.4 + phase) * 0.1;
      });

      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    const start = () => {
      if (frameId === 0) frameId = window.requestAnimationFrame(render);
    };

    const stop = () => {
      if (frameId !== 0) window.cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const hideTooltip = () => {
      tooltip.style.opacity = '0';
      tooltip.setAttribute('aria-hidden', 'true');
    };

    const showRegion = (region: PulseRegion, x = 16, y = 16, shouldTrack = false, shouldShowTooltip = true) => {
      const hasChanged = activeRegionId !== region.id;
      activeRegionId = region.id;
      setFocusTarget(region);

      buttons.forEach((button) => {
        const isActive = button.dataset.regionId === region.id;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
      if (shouldShowTooltip) {
        tooltip.innerHTML = `
          <p class="font-bold text-teal-100">${escapeHtml(region.name)}</p>
          <p class="mt-2 text-slate-200">${escapeHtml(region.dataSignal)}</p>
          <p class="mt-3 text-xs uppercase tracking-[0.14em] text-amber-200">Infrastructure</p>
          <p class="mt-1 text-slate-300">${escapeHtml(region.infrastructure)}</p>
          <p class="mt-3 text-xs uppercase tracking-[0.14em] text-amber-200">Governance</p>
          <p class="mt-1 text-slate-300">${escapeHtml(region.governance)}</p>
        `;
        const maxX = Math.max(12, canvas.clientWidth - 300);
        const maxY = Math.max(12, canvas.clientHeight - 236);
        tooltip.style.opacity = '1';
        tooltip.setAttribute('aria-hidden', 'false');
        tooltip.style.transform = `translate(${Math.min(Math.max(x, 12), maxX)}px, ${Math.min(Math.max(y, 12), maxY)}px)`;
      } else {
        hideTooltip();
      }
      if (liveRegion) liveRegion.textContent = `${region.name} selected. ${region.pressure}`;
      if (shouldTrack && hasChanged) {
        trackNexusEvent('globe_region_selected', { region: region.id });
        window.dispatchEvent(new CustomEvent('nexus:globe_region_selected', { detail: { region: region.id } }));
      }
    };

    const getRegionFromPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hitTargets, false)[0];
      return regions.find((region) => region.id === hit?.object.userData.regionId) ?? null;
    };

    canvas.addEventListener('pointerdown', (event) => {
      isDragging = true;
      focusUntil = 0;
      dragDistance = 0;
      velocityX = 0;
      previousX = event.clientX;
      previousY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('pointermove', (event) => {
      if (isDragging) {
        const deltaX = event.clientX - previousX;
        const deltaY = event.clientY - previousY;
        dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
        velocityX = deltaX * 0.00042;
        group.rotation.y += deltaX * 0.006;
        group.rotation.x += deltaY * 0.003;
        group.rotation.x = clamp(group.rotation.x, -0.78, 0.78);
        previousX = event.clientX;
        previousY = event.clientY;
        return;
      }

      const region = getRegionFromPointer(event);
      if (region) showRegion(region, event.offsetX + 12, event.offsetY + 12, true);
      else hideTooltip();
    });

    canvas.addEventListener('pointerup', (event) => {
      isDragging = false;
      canvas.style.cursor = 'grab';
      if (dragDistance < 8) {
        const region = getRegionFromPointer(event);
        if (region) showRegion(region, event.offsetX + 12, event.offsetY + 12, true);
      }
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    });

    canvas.addEventListener('pointerleave', () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    });

    canvas.style.cursor = 'grab';

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const region = regions.find((item) => item.id === button.dataset.regionId);
        if (region) showRegion(region, 16, 16, true, false);
      });
    });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = Boolean(entry?.isIntersecting);
        if (isVisible) start();
        else stop();
      },
      { threshold: 0.12 }
    );

    visibilityObserver.observe(root);
    resize();
    start();
    showRegion(regions[0], 16, 16, false, false);
    hideLoading();
    root.dataset.globalPulseReady = 'true';

    document.addEventListener(
      'astro:before-swap',
      () => {
        stop();
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        renderer.dispose();
        globeTexture?.dispose();
        cloudTexture?.dispose();
        disposeObject(group);
      },
      { once: true }
    );
  } catch {
    root.dataset.globalPulseReady = 'fallback';
    revealFallback();
  }
};

export const initGlobalDataPulse = () => {
  document.querySelectorAll<HTMLElement>('[data-global-pulse]').forEach((root) => {
    if (root.dataset.globalPulseReady) return;
    root.dataset.globalPulseReady = 'queued';

    const start = () => {
      void bootGlobalDataPulse(root);
    };

    if (!('IntersectionObserver' in window)) {
      start();
      return;
    }

    const warmupObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        warmupObserver.disconnect();
        start();
      },
      { rootMargin: '640px 0px', threshold: 0.01 }
    );

    warmupObserver.observe(root);

    document.addEventListener('astro:before-swap', () => warmupObserver.disconnect(), { once: true });
  });
};
