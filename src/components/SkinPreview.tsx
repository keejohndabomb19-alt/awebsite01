import { useEffect, useRef } from "react";
import type { SkinConfig } from "@/lib/skins";

export function SkinPreview({ skin }: { skin: SkinConfig }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    async function mountPreview() {
      const [THREE, models] = await Promise.all([
        import("three"),
        import("@/lib/skin-models"),
      ]);
      if (cancelled || !hostRef.current) return;

      const host = hostRef.current;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
      camera.position.set(0, 0.15, 3.1);
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      host.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x202030, 2.5));
      const key = new THREE.DirectionalLight(0xffffff, 3.4);
      key.position.set(3, 4, 5);
      scene.add(key);
      const rim = new THREE.PointLight(skin.color, 5, 6);
      rim.position.set(-2, 1, 2);
      scene.add(rim);

      const model = models.createSkinModel(THREE, skin);
      model.scale.setScalar(1.18);
      model.rotation.set(0.35, -0.55, 0.08);
      scene.add(model);

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let frame = 0;
      function resize() {
        const size = Math.max(1, host.clientWidth);
        renderer.setSize(size, Math.max(1, host.clientHeight), false);
        camera.aspect = size / Math.max(1, host.clientHeight);
        camera.updateProjectionMatrix();
      }
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      resize();

      function render() {
        if (!reducedMotion) model.rotation.y += 0.008;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      }
      render();

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        models.disposeSkinModel(model);
        renderer.dispose();
        if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
      };
    }

    mountPreview();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [skin]);

  return <div ref={hostRef} className="h-32 w-full" aria-hidden="true" />;
}