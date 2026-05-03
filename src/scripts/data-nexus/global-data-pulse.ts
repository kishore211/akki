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

type ThreeModule = typeof import('three');

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

const bootGlobalDataPulse = async (root: HTMLElement) => {
  if (root.dataset.globalPulseReady === 'true' || root.dataset.globalPulseReady === 'booting') return;
  root.dataset.globalPulseReady = 'booting';

  const canvas = root.querySelector<HTMLCanvasElement>('[data-global-pulse-canvas]');
  const fallback = root.querySelector<HTMLElement>('[data-global-pulse-fallback]');
  const loading = root.querySelector<HTMLElement>('[data-global-pulse-loading]');
  const tooltip = root.querySelector<HTMLElement>('[data-global-pulse-tooltip]');
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
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const markers: Three.Mesh[] = [];

    camera.position.set(0, 0, 6.2);
    scene.add(group);
    group.add(markerGroup);

    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(2, 64, 64),
      new THREE.MeshStandardMaterial({
        color: 0x0f766e,
        roughness: 0.82,
        metalness: 0.16,
        transparent: true,
        opacity: 0.94,
      })
    );
    const wire = new THREE.Mesh(
      new THREE.SphereGeometry(2.012, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x99f6e4, wireframe: true, transparent: true, opacity: 0.14 })
    );
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(2.12, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.08 })
    );

    group.add(globe, wire, atmosphere);
    scene.add(new THREE.AmbientLight(0xbff7ff, 1.6));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.85);
    keyLight.position.set(2, 4, 5);
    scene.add(keyLight);

    regions.forEach((region) => {
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 18, 18),
        new THREE.MeshBasicMaterial({ color: region.accent })
      );
      marker.position.copy(latLongToVector(THREE, region.latitude, region.longitude, 2.18));
      marker.userData.regionId = region.id;
      markerGroup.add(marker);
      markers.push(marker);
    });

    let frameId = 0;
    let isVisible = true;
    let isDragging = false;
    let previousX = 0;
    let previousY = 0;
    let activeRegionId = '';

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const render = () => {
      if (!isVisible) {
        frameId = 0;
        return;
      }

      if (!isDragging) group.rotation.y += 0.0025;
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

    const showRegion = (region: PulseRegion, x = 16, y = 16, shouldTrack = false) => {
      const hasChanged = activeRegionId !== region.id;
      activeRegionId = region.id;

      buttons.forEach((button) => {
        const isActive = button.dataset.regionId === region.id;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
      tooltip.innerHTML = `
          <p class="font-bold text-teal-100">${escapeHtml(region.name)}</p>
          <p class="mt-2 text-slate-200">${escapeHtml(region.dataSignal)}</p>
          <p class="mt-3 text-xs uppercase tracking-[0.14em] text-amber-200">Infrastructure</p>
          <p class="mt-1 text-slate-300">${escapeHtml(region.infrastructure)}</p>
          <p class="mt-3 text-xs uppercase tracking-[0.14em] text-amber-200">Governance</p>
          <p class="mt-1 text-slate-300">${escapeHtml(region.governance)}</p>
        `;
      tooltip.style.opacity = '1';
      tooltip.style.transform = `translate(${Math.min(Math.max(x, 12), canvas.clientWidth - 280)}px, ${Math.min(Math.max(y, 12), canvas.clientHeight - 220)}px)`;
      if (shouldTrack && hasChanged) trackNexusEvent('globe_region_selected', { region: region.id });
    };

    const getRegionFromPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(markers, false)[0];
      return regions.find((region) => region.id === hit?.object.userData.regionId) ?? null;
    };

    canvas.addEventListener('pointerdown', (event) => {
      isDragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener('pointermove', (event) => {
      if (isDragging) {
        const deltaX = event.clientX - previousX;
        const deltaY = event.clientY - previousY;
        group.rotation.y += deltaX * 0.006;
        group.rotation.x += deltaY * 0.003;
        group.rotation.x = Math.max(-0.8, Math.min(0.8, group.rotation.x));
        previousX = event.clientX;
        previousY = event.clientY;
        return;
      }

      const region = getRegionFromPointer(event);
      if (region) showRegion(region, event.offsetX + 12, event.offsetY + 12, true);
    });

    canvas.addEventListener('pointerup', (event) => {
      isDragging = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    });

    canvas.addEventListener('pointerleave', () => {
      isDragging = false;
    });

    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const region = regions.find((item) => item.id === button.dataset.regionId);
        if (region) showRegion(region, 16, 16, true);
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
    showRegion(regions[0], 16, 16);
    hideLoading();
    root.dataset.globalPulseReady = 'true';

    document.addEventListener(
      'astro:before-swap',
      () => {
        stop();
        resizeObserver.disconnect();
        visibilityObserver.disconnect();
        renderer.dispose();
        globe.geometry.dispose();
        wire.geometry.dispose();
        atmosphere.geometry.dispose();
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
