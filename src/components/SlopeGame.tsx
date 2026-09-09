import { useEffect, useRef, useState } from "react";
import type * as THREE from "three";

interface GameState {
  score: number;
  speed: number;
  isPlaying: boolean;
  isGameOver: boolean;
}

export function SlopeGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    speed: 0,
    isPlaying: false,
    isGameOver: false,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanupFn: (() => void) | undefined;
    let cancelled = false;

    async function initGame() {
      const THREE = await import("three");
      if (cancelled) return;

      const container = containerRef.current;
      if (!container) return;

      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0f);
      scene.fog = new THREE.Fog(0x0a0a0f, 20, 120);

      const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 5, 12);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);

      // Lights
      const ambientLight = new THREE.AmbientLight(0x404080, 0.5);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xaaccff, 1.2);
      dirLight.position.set(10, 30, 10);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 100;
      dirLight.shadow.camera.left = -30;
      dirLight.shadow.camera.right = 30;
      dirLight.shadow.camera.top = 30;
      dirLight.shadow.camera.bottom = -30;
      scene.add(dirLight);

      const neonLight = new THREE.PointLight(0x00ffff, 2, 50);
      neonLight.position.set(0, 5, 0);
      scene.add(neonLight);

      // Ball
      const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
      const ballMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x0088aa,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8,
      });
      const ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.castShadow = true;
      scene.add(ball);

      // Track parameters
      const trackWidth = 10;
      const segmentLength = 4;
      const visibleSegments = 40;
      const segments: THREE.Group[] = [];
      const obstacles: THREE.Mesh[] = [];
      const obstacleBodies: { mesh: THREE.Mesh; active: boolean }[] = [];

      // Materials
      const trackMaterial = new THREE.MeshStandardMaterial({
        color: 0x111116,
        roughness: 0.6,
        metalness: 0.3,
      });

      const edgeMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00aaaa,
        emissiveIntensity: 0.8,
      });

      const obstacleMaterial = new THREE.MeshStandardMaterial({
        color: 0xff2244,
        emissive: 0xaa0022,
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.5,
      });

      // Create track segment
      function createSegment(z: number) {
        const group = new THREE.Group();

        // Floor
        const floorGeometry = new THREE.BoxGeometry(trackWidth, 0.4, segmentLength);
        const floor = new THREE.Mesh(floorGeometry, trackMaterial);
        floor.receiveShadow = true;
        floor.position.y = -0.2;
        group.add(floor);

        // Side edges
        const edgeGeometry = new THREE.BoxGeometry(0.2, 0.6, segmentLength);
        const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        leftEdge.position.set(-trackWidth / 2 - 0.1, 0.1, 0);
        group.add(leftEdge);

        const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        rightEdge.position.set(trackWidth / 2 + 0.1, 0.1, 0);
        group.add(rightEdge);

        // Center line
        const lineGeometry = new THREE.BoxGeometry(0.1, 0.05, segmentLength * 0.6);
        const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.position.set(0, 0.01, 0);
        group.add(line);

        group.position.z = z;
        scene.add(group);
        segments.push(group);

        // Add obstacles randomly
        if (z < -10 && Math.random() > 0.55) {
          const laneCount = 5;
          const laneWidth = trackWidth / laneCount;
          const lane = Math.floor(Math.random() * laneCount);
          const x = (lane - laneCount / 2 + 0.5) * laneWidth;

          const size = 1 + Math.random() * 0.8;
          const obstacleGeometry = new THREE.BoxGeometry(size, size, size);
          const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
          obstacle.position.set(x, size / 2, z);
          obstacle.castShadow = true;
          obstacle.receiveShadow = true;
          scene.add(obstacle);
          obstacles.push(obstacle);
          obstacleBodies.push({ mesh: obstacle, active: true });
        }
      }

      // Initialize track
      for (let i = 0; i < visibleSegments; i++) {
        createSegment(-i * segmentLength);
      }

      // Game variables
      let ballX = 0;
      let targetBallX = 0;
      let ballVelocityX = 0;
      let score = 0;
      const baseSpeed = 15;
      let currentSpeed = baseSpeed;
      let isPlaying = false;
      let isGameOver = false;
      let animationId: number;
      let lastTime = performance.now();

      // Input handling
      const keys = { left: false, right: false };

      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          keys.left = true;
        }
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
          keys.right = true;
        }
        if (e.key === " " && !isPlaying && !isGameOver) {
          startGame();
        }
        if (e.key === " " && isGameOver) {
          resetGame();
        }
      }

      function handleKeyUp(e: KeyboardEvent) {
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
          keys.left = false;
        }
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
          keys.right = false;
        }
      }

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      // Touch controls
      let touchStartX = 0;
      function handleTouchStart(e: TouchEvent) {
        touchStartX = e.touches[0].clientX;
      }
      function handleTouchMove(e: TouchEvent) {
        const deltaX = e.touches[0].clientX - touchStartX;
        targetBallX = Math.max(
          -trackWidth / 2 + 1,
          Math.min(trackWidth / 2 - 1, ballX + deltaX * 0.02)
        );
        touchStartX = e.touches[0].clientX;
      }
      container.addEventListener("touchstart", handleTouchStart);
      container.addEventListener("touchmove", handleTouchMove);

      function startGame() {
        isPlaying = true;
        isGameOver = false;
        setGameState((s) => ({ ...s, isPlaying: true, isGameOver: false }));
      }

      function gameOver() {
        isPlaying = false;
        isGameOver = true;
        setGameState((s) => ({ ...s, isPlaying: false, isGameOver: true }));
      }

      function resetGame() {
        score = 0;
        currentSpeed = baseSpeed;
        ballX = 0;
        targetBallX = 0;
        ballVelocityX = 0;
        ball.position.set(0, 0.5, 0);
        ball.rotation.set(0, 0, 0);

        // Clear obstacles and segments
        segments.forEach((seg) => scene.remove(seg));
        obstacles.forEach((obs) => scene.remove(obs));
        segments.length = 0;
        obstacles.length = 0;
        obstacleBodies.length = 0;

        for (let i = 0; i < visibleSegments; i++) {
          createSegment(-i * segmentLength);
        }

        isGameOver = false;
        isPlaying = true;
        setGameState({
          score: 0,
          speed: 0,
          isPlaying: true,
          isGameOver: false,
        });
      }

      function animate() {
        animationId = requestAnimationFrame(animate);

        const now = performance.now();
        const delta = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        if (isPlaying && !isGameOver) {
          // Increase speed over time
          currentSpeed = baseSpeed + score * 0.03;

          // Move track segments toward camera (ball stays at z=0 visually)
          const moveDistance = currentSpeed * delta;
          score += moveDistance;

          // Move segments
          for (let i = segments.length - 1; i >= 0; i--) {
            segments[i].position.z += moveDistance;
            if (segments[i].position.z > 10) {
              scene.remove(segments[i]);
              segments.splice(i, 1);
            }
          }

          // Move obstacles
          for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].position.z += moveDistance;
            if (obstacles[i].position.z > 10) {
              scene.remove(obstacles[i]);
              obstacles.splice(i, 1);
              obstacleBodies.splice(i, 1);
            }
          }

          // Spawn new segments
          const lastSegmentZ =
            segments.length > 0
              ? segments[segments.length - 1].position.z
              : 0;
          if (lastSegmentZ < -segmentLength * (visibleSegments - 5)) {
            createSegment(lastSegmentZ - segmentLength);
          }

          // Ball physics
          const maxSpeed = 12;
          const acceleration = 30;
          const friction = 8;

          if (keys.left) ballVelocityX -= acceleration * delta;
          if (keys.right) ballVelocityX += acceleration * delta;
          ballVelocityX -= ballVelocityX * friction * delta;
          ballVelocityX = Math.max(-maxSpeed, Math.min(maxSpeed, ballVelocityX));

          ballX += ballVelocityX * delta;
          ballX = Math.max(
            -trackWidth / 2 + 0.6,
            Math.min(trackWidth / 2 - 0.6, ballX)
          );

          // Smooth interpolation toward target for touch
          if (!keys.left && !keys.right) {
            ballX += (targetBallX - ballX) * 5 * delta;
          }

          ball.position.x = ballX;
          ball.position.y = 0.5;
          ball.position.z = 0;

          // Rotate ball based on movement
          ball.rotation.x -= (currentSpeed / 0.5) * delta;
          ball.rotation.z -= (ballVelocityX / 0.5) * delta;

          // Collision detection
          const ballBox = new THREE.Box3().setFromObject(ball);
          for (const obs of obstacleBodies) {
            if (!obs.active) continue;
            const obsBox = new THREE.Box3().setFromObject(obs.mesh);
            if (ballBox.intersectsBox(obsBox)) {
              gameOver();
              break;
            }
          }

          // Update neon light to follow ball
          neonLight.position.x = ballX;

          // Update game state display
          setGameState((s) => ({
            ...s,
            score: Math.floor(score),
            speed: Math.floor(currentSpeed * 2),
          }));
        }

        // Camera follow
        camera.position.x += (ballX * 0.4 - camera.position.x) * 0.1;
        camera.position.y = 5 + Math.sin(now * 0.001) * 0.2;
        camera.position.z = 12;
        camera.lookAt(ballX * 0.3, 0.5, -5);

        renderer.render(scene, camera);
      }

      animate();

      // Resize handler
      function handleResize() {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      }
      window.addEventListener("resize", handleResize);

      cleanupFn = () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("resize", handleResize);
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        renderer.dispose();
        container.removeChild(renderer.domElement);
      };
    }

    initGame();

    return () => {
      cancelled = true;
      cleanupFn?.();
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      <div ref={containerRef} className="h-full w-full" />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-black/40 px-4 py-2 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-cyan-400">
              Score
            </p>
            <p className="font-mono text-3xl font-bold text-white">
              {gameState.score.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-black/40 px-4 py-2 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-cyan-400">
              Speed
            </p>
            <p className="font-mono text-3xl font-bold text-white">
              {gameState.speed}
              <span className="text-lg text-white/60"> km/h</span>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-white/50">
            Use ← → or A/D to steer • Space to start/restart
          </p>
        </div>
      </div>

      {/* Start screen */}
      {!gameState.isPlaying && !gameState.isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-7xl font-black tracking-tighter text-transparent">
              SLOPE
            </h1>
            <p className="mb-8 text-lg text-white/70">
              Roll down the endless neon slope. Avoid the red obstacles.
            </p>
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", { key: " " });
                window.dispatchEvent(event);
              }}
              className="rounded-full bg-cyan-500 px-8 py-3 font-bold text-black shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 hover:bg-cyan-400"
            >
              Press Space to Start
            </button>
          </div>
        </div>
      )}

      {/* Game over screen */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="mb-2 text-6xl font-black text-red-500">CRASHED</h2>
            <p className="mb-2 text-xl text-white">Final Score</p>
            <p className="mb-8 font-mono text-5xl font-bold text-white">
              {gameState.score.toLocaleString()}
            </p>
            <button
              onClick={() => {
                const event = new KeyboardEvent("keydown", { key: " " });
                window.dispatchEvent(event);
              }}
              className="rounded-full bg-cyan-500 px-8 py-3 font-bold text-black shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 hover:bg-cyan-400"
            >
              Press Space to Restart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
