import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type * as THREE from "three";
import { Leaderboard, leaderboardQueryKey } from "./Leaderboard";
import { submitScore } from "@/lib/leaderboard.functions";
import { getPlayerId } from "@/lib/player";
import { getMap } from "@/lib/maps";


interface GameState {
  score: number;
  speed: number;
  isPlaying: boolean;
  isGameOver: boolean;
  message: string;
  coins: number;
  highScore: number;
  newBest: boolean;
  timers: { speed: number; jump: number; shield: number };
}

type BlockType = "crash" | "slow" | "boost" | "bounce";
type PowerUp = "speed" | "jump" | "shield";

const POWER_UPS: Record<
  PowerUp,
  { cost: number; duration: number; label: string; hint: string; color: string; key: string }
> = {
  speed: {
    cost: 15,
    duration: 8,
    label: "Turbo",
    hint: "Much faster ride",
    color: "#00ff88",
    key: "1",
  },
  jump: {
    cost: 12,
    duration: 12,
    label: "Long Jump",
    hint: "Float further off bounces",
    color: "#aa55ff",
    key: "2",
  },
  shield: {
    cost: 25,
    duration: 6,
    label: "Invincible",
    hint: "Smash through red blocks",
    color: "#ffd700",
    key: "3",
  },
};

export function SlopeGame({
  playerName,
  onChangeName,
  mapId,
  onChangeMap,
}: {
  playerName: string;
  onChangeName: () => void;
  mapId: string;
  onChangeMap: () => void;
}) {
  const map = getMap(mapId);

  const containerRef = useRef<HTMLDivElement>(null);
  const buyRef = useRef<((p: PowerUp) => void) | null>(null);
  const queryClient = useQueryClient();

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    speed: 0,
    isPlaying: false,
    isGameOver: false,
    message: "",
    coins: 0,
    highScore: 0,
    newBest: false,
    timers: { speed: 0, jump: 0, shield: 0 },
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

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(map.bg);
      scene.fog = new THREE.Fog(map.bg, map.fog[0], map.fog[1]);

      const camera = new THREE.PerspectiveCamera(
        62,
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

      scene.add(new THREE.AmbientLight(map.ambient, 0.6));

      const dirLight = new THREE.DirectionalLight(map.dirLight, 1.2);
      dirLight.position.set(10, 30, 10);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 120;
      dirLight.shadow.camera.left = -40;
      dirLight.shadow.camera.right = 40;
      dirLight.shadow.camera.top = 40;
      dirLight.shadow.camera.bottom = -40;
      scene.add(dirLight);

      const neonLight = new THREE.PointLight(map.accent, 2.5, 50);
      scene.add(neonLight);

      // Ball
      const ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 32, 32),
        new THREE.MeshStandardMaterial({
          color: 0x00ffff,
          emissive: 0x0088aa,
          emissiveIntensity: 0.5,
          roughness: 0.2,
          metalness: 0.8,
        })
      );
      ball.castShadow = true;
      scene.add(ball);

      // ---- Track path (curves + slopes) -------------------------------
      const trackWidth = 10;
      const segmentLength = 4;
      const visibleSegments = 55;

      const pathX = (d: number) =>
        map.curve.a * Math.sin(d * map.curve.af) +
        map.curve.b * Math.sin(d * map.curve.bf + 1.3);
      const pathY = (d: number) =>
        map.slope.a * Math.sin(d * map.slope.af) +
        map.slope.b * Math.sin(d * map.slope.bf + 0.7) -
        d * map.slope.drop;

      const trackMaterial = new THREE.MeshStandardMaterial({
        color: map.track,
        roughness: 0.6,
        metalness: 0.3,
      });
      const edgeMaterial = new THREE.MeshStandardMaterial({
        color: map.accent,
        emissive: map.accent,
        emissiveIntensity: 0.8,
      });
      const lineMaterial = new THREE.MeshBasicMaterial({ color: map.accent });

      const blockStyles: Record<
        BlockType,
        { color: number; emissive: number; label: string }
      > = {
        crash: { color: 0xff2244, emissive: 0xaa0022, label: "Crash" },
        slow: { color: 0xffaa00, emissive: 0xaa6600, label: "Slowed down!" },
        boost: { color: 0x00ff88, emissive: 0x00aa55, label: "Boost!" },
        bounce: { color: 0xaa55ff, emissive: 0x6622aa, label: "Bounce!" },
      };
      const blockMaterials = {
        crash: new THREE.MeshStandardMaterial({
          color: blockStyles.crash.color,
          emissive: blockStyles.crash.emissive,
          emissiveIntensity: 0.6,
          roughness: 0.3,
          metalness: 0.5,
        }),
        slow: new THREE.MeshStandardMaterial({
          color: blockStyles.slow.color,
          emissive: blockStyles.slow.emissive,
          emissiveIntensity: 0.6,
          roughness: 0.5,
          metalness: 0.3,
        }),
        boost: new THREE.MeshStandardMaterial({
          color: blockStyles.boost.color,
          emissive: blockStyles.boost.emissive,
          emissiveIntensity: 0.7,
          roughness: 0.3,
          metalness: 0.6,
        }),
        bounce: new THREE.MeshStandardMaterial({
          color: blockStyles.bounce.color,
          emissive: blockStyles.bounce.emissive,
          emissiveIntensity: 0.7,
          roughness: 0.4,
          metalness: 0.4,
        }),
      };

      interface Seg {
        group: THREE.Group;
        d: number;
      }
      interface Block {
        mesh: THREE.Mesh;
        d: number;
        lateral: number;
        size: number;
        type: BlockType;
        active: boolean;
      }
      interface Coin {
        mesh: THREE.Mesh;
        d: number;
        lateral: number;
      }

      const coinGeometry = new THREE.TorusGeometry(0.38, 0.13, 12, 24);
      const coinMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xaa7700,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.9,
      });

      const segments: Seg[] = [];
      const blocks: Block[] = [];
      const coins: Coin[] = [];
      let spawnDistance = 0;

      function pickType(): BlockType {
        const r = Math.random();
        if (r < 0.52) return "crash";
        if (r < 0.72) return "slow";
        if (r < 0.89) return "boost";
        return "bounce";
      }

      function createSegment(d: number) {
        const group = new THREE.Group();

        const floor = new THREE.Mesh(
          new THREE.BoxGeometry(trackWidth, 1, segmentLength + 0.15),
          trackMaterial
        );
        floor.receiveShadow = true;
        floor.position.y = -0.5;
        group.add(floor);

        const edgeGeometry = new THREE.BoxGeometry(0.2, 0.6, segmentLength + 0.15);
        const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        leftEdge.position.set(-trackWidth / 2 - 0.1, 0.1, 0);
        group.add(leftEdge);
        const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        rightEdge.position.set(trackWidth / 2 + 0.1, 0.1, 0);
        group.add(rightEdge);

        const line = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.05, segmentLength * 0.6),
          lineMaterial
        );
        line.position.y = 0.02;
        group.add(line);

        // Bank + pitch the segment to follow the path
        const ahead = 2;
        group.rotation.z = -Math.atan2(pathX(d + ahead) - pathX(d - ahead), ahead * 2) * 0.35;
        group.rotation.x = Math.atan2(pathY(d + ahead) - pathY(d - ahead), ahead * 2);

        scene.add(group);
        segments.push({ group, d });

        // Blocks
        if (d > 40 && Math.random() > 0.5) {
          const count = Math.random() > 0.82 ? 2 : 1;
          const lanes = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);
          for (let c = 0; c < count; c++) {
            const laneWidth = trackWidth / 5;
            const lateral = (lanes[c]! - 2) * laneWidth;
            const type = pickType();
            const size = type === "crash" ? 1 + Math.random() * 0.8 : 1.1;
            const mesh = new THREE.Mesh(
              new THREE.BoxGeometry(size, size, size),
              blockMaterials[type]
            );
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            scene.add(mesh);
            blocks.push({ mesh, d, lateral, size, type, active: true });
          }
        }

        // Coins
        if (d > 20 && Math.random() > 0.55) {
          const laneWidth = trackWidth / 5;
          const lane = Math.floor(Math.random() * 5) - 2;
          const lateral = lane * laneWidth;
          const clash = blocks.some(
            (b) => b.d === d && Math.abs(b.lateral - lateral) < 1.2
          );
          if (!clash) {
            const mesh = new THREE.Mesh(coinGeometry, coinMaterial);
            mesh.castShadow = true;
            scene.add(mesh);
            coins.push({ mesh, d, lateral });
          }
        }
      }

      function buildTrack() {
        spawnDistance = 0;
        for (let i = 0; i < visibleSegments; i++) {
          createSegment(spawnDistance);
          spawnDistance += segmentLength;
        }
      }
      buildTrack();

      // ---- Game state --------------------------------------------------
      let lateralPos = 0;
      let lateralVel = 0;
      let targetLateral = 0;
      let lastInput: "key" | "touch" = "key";
      let distance = 0;
      let ballHeight = 0;
      let verticalVel = 0;
      let score = 0;
      const baseSpeed = map.baseSpeed;
      let currentSpeed = baseSpeed;
      let speedModifier = 0;
      let isPlaying = false;
      let isGameOver = false;
      let animationId = 0;
      let lastTime = performance.now();
      let messageTimer = 0;

      // ---- Coins & power-ups -------------------------------------------
      const stored = Number(window.localStorage.getItem("slope-coins") ?? "0");
      let coinCount = Number.isFinite(stored) ? stored : 0;
      const storedBest = Number(window.localStorage.getItem("slope-highscore") ?? "0");
      let highScore = Number.isFinite(storedBest) ? storedBest : 0;
      const timers: Record<PowerUp, number> = { speed: 0, jump: 0, shield: 0 };

      function saveCoins() {
        window.localStorage.setItem("slope-coins", String(coinCount));
      }
      saveCoins();

      function saveHighScore() {
        window.localStorage.setItem("slope-highscore", String(highScore));
      }
      saveHighScore();

      function flash(msg: string) {
        messageTimer = 1.2;
        setGameState((s) => ({ ...s, message: msg }));
      }

      function syncMeta() {
        setGameState((s) => ({
          ...s,
          coins: coinCount,
          highScore,
          timers: { ...timers },
        }));
      }
      syncMeta();

      function buyPowerUp(p: PowerUp) {
        const info = POWER_UPS[p];
        if (coinCount < info.cost) {
          flash("Not enough coins");
          syncMeta();
          return;
        }
        coinCount -= info.cost;
        saveCoins();
        timers[p] = info.duration;
        if (p === "shield") {
          (ball.material as THREE.MeshStandardMaterial).color.set(0xffd700);
        }
        flash(`${info.label} activated!`);
        syncMeta();
      }
      buyRef.current = buyPowerUp;

      const keys = { left: false, right: false };

      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.left = true;
        if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.right = true;
        if (e.key === "1") buyPowerUp("speed");
        if (e.key === "2") buyPowerUp("jump");
        if (e.key === "3") buyPowerUp("shield");
        if (e.key === " ") {
          if (isGameOver) resetGame();
          else if (!isPlaying) startGame();
        }
      }
      function handleKeyUp(e: KeyboardEvent) {
        if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.left = false;
        if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.right = false;
      }
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      let touchStartX = 0;
      function handleTouchStart(e: TouchEvent) {
        touchStartX = e.touches[0]!.clientX;
      }
      function handleTouchMove(e: TouchEvent) {
        lastInput = "touch";
        const deltaX = e.touches[0]!.clientX - touchStartX;
        targetLateral = Math.max(
          -trackWidth / 2 + 0.6,
          Math.min(trackWidth / 2 - 0.6, lateralPos + deltaX * 0.02)
        );
        touchStartX = e.touches[0]!.clientX;
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
        const finalScore = Math.floor(score);
        let newBest = false;
        if (finalScore > highScore) {
          highScore = finalScore;
          newBest = true;
          saveHighScore();
        }
        setGameState((s) => ({
          ...s,
          score: finalScore,
          isPlaying: false,
          isGameOver: true,
          highScore,
          newBest,
        }));

      }

      function resetGame() {
        score = 0;
        distance = 0;
        currentSpeed = baseSpeed;
        speedModifier = 0;
        lateralPos = 0;
        targetLateral = 0;
        lateralVel = 0;
        lastInput = "key";
        ballHeight = 0;
        verticalVel = 0;
        timers.speed = 0;
        timers.jump = 0;
        timers.shield = 0;
        (ball.material as THREE.MeshStandardMaterial).color.set(0x00ffff);

        segments.forEach((s) => scene.remove(s.group));
        blocks.forEach((b) => scene.remove(b.mesh));
        coins.forEach((c) => scene.remove(c.mesh));
        segments.length = 0;
        blocks.length = 0;
        coins.length = 0;
        buildTrack();

        isGameOver = false;
        isPlaying = true;
        setGameState({
          score: 0,
          speed: 0,
          isPlaying: true,
          isGameOver: false,
          message: "",
          coins: coinCount,
          highScore,
          newBest: false,
          timers: { speed: 0, jump: 0, shield: 0 },
        });
      }

      function animate() {
        animationId = requestAnimationFrame(animate);

        const now = performance.now();
        const delta = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        if (isPlaying && !isGameOver) {
          // Power-up timers
          let expired = false;
          (Object.keys(timers) as PowerUp[]).forEach((p) => {
            if (timers[p] > 0) {
              timers[p] = Math.max(0, timers[p] - delta);
              if (timers[p] === 0) {
                expired = true;
                if (p === "shield") {
                  (ball.material as THREE.MeshStandardMaterial).color.set(0x00ffff);
                }
                flash(`${POWER_UPS[p].label} over`);
              }
            }
          });
          if (expired) syncMeta();

          speedModifier += (0 - speedModifier) * Math.min(1, delta * 0.8);
          currentSpeed = Math.max(
            8,
            baseSpeed + score * 0.02 + speedModifier + (timers.speed > 0 ? 10 : 0)
          );

          const moveDistance = currentSpeed * delta;
          distance += moveDistance;
          score += moveDistance;

          // Recycle + spawn segments
          for (let i = segments.length - 1; i >= 0; i--) {
            if (segments[i]!.d - distance < -12) {
              scene.remove(segments[i]!.group);
              segments.splice(i, 1);
            }
          }
          while (spawnDistance - distance < segmentLength * (visibleSegments - 6)) {
            createSegment(spawnDistance);
            spawnDistance += segmentLength;
          }
          for (let i = blocks.length - 1; i >= 0; i--) {
            if (blocks[i]!.d - distance < -12) {
              scene.remove(blocks[i]!.mesh);
              blocks.splice(i, 1);
            }
          }
          for (let i = coins.length - 1; i >= 0; i--) {
            if (coins[i]!.d - distance < -12) {
              scene.remove(coins[i]!.mesh);
              coins.splice(i, 1);
            }
          }

          // Steering
          const maxSpeed = 12;
          const acceleration = 34;
          if (keys.left) lateralVel -= acceleration * delta;
          if (keys.right) lateralVel += acceleration * delta;
          if (keys.left || keys.right) {
            lastInput = "key";
            targetLateral = lateralPos;
          }
          lateralVel *= Math.exp(-8 * delta);
          lateralVel = Math.max(-maxSpeed, Math.min(maxSpeed, lateralVel));
          lateralPos += lateralVel * delta;
          if (!keys.left && !keys.right && lastInput === "touch") {
            lateralPos += (targetLateral - lateralPos) * 5 * delta;
          }
          lateralPos = Math.max(
            -trackWidth / 2 + 0.6,
            Math.min(trackWidth / 2 - 0.6, lateralPos)
          );

          // Vertical (bounce) physics
          const gravity = timers.jump > 0 ? 12 : 26;
          if (ballHeight > 0 || verticalVel > 0) {
            verticalVel -= gravity * delta;
            ballHeight += verticalVel * delta;
            if (ballHeight <= 0) {
              ballHeight = 0;
              verticalVel = 0;
            }
          }

          // Coin pickups
          for (let i = coins.length - 1; i >= 0; i--) {
            const c = coins[i]!;
            if (Math.abs(c.d - distance) > 0.9) continue;
            if (Math.abs(c.lateral - lateralPos) > 1) continue;
            if (ballHeight > 1.4) continue;
            scene.remove(c.mesh);
            coins.splice(i, 1);
            coinCount += 1;
            saveCoins();
            syncMeta();
          }

          // Collisions
          for (const b of blocks) {
            if (!b.active) continue;
            const dz = b.d - distance;
            if (Math.abs(dz) > b.size / 2 + 0.5) continue;
            if (Math.abs(b.lateral - lateralPos) > b.size / 2 + 0.5) continue;
            if (ballHeight > b.size) continue;

            if (b.type === "crash") {
              if (timers.shield > 0) {
                b.active = false;
                scene.remove(b.mesh);
                flash("Smashed!");
                continue;
              }
              gameOver();
              break;
            }
            b.active = false;
            if (b.type === "slow") {
              speedModifier = -7;
              scene.remove(b.mesh);
              flash(blockStyles.slow.label);
            } else if (b.type === "boost") {
              speedModifier = 12;
              scene.remove(b.mesh);
              flash(blockStyles.boost.label);
            } else {
              verticalVel = timers.jump > 0 ? 12 : 9;
              b.mesh.scale.y = 0.4;
              flash(blockStyles.bounce.label);
            }
          }

          if (messageTimer > 0) {
            messageTimer -= delta;
            if (messageTimer <= 0) setGameState((s) => ({ ...s, message: "" }));
          }

          setGameState((s) => ({
            ...s,
            score: Math.floor(score),
            speed: Math.floor(currentSpeed * 2),
            coins: coinCount,
            highScore,
            timers: { ...timers },
          }));
        }

        // Position world objects relative to current distance
        for (const s of segments) {
          s.group.position.set(pathX(s.d), pathY(s.d), -(s.d - distance));
        }
        for (const b of blocks) {
          b.mesh.position.set(
            pathX(b.d) + b.lateral,
            pathY(b.d) + (b.size * b.mesh.scale.y) / 2,
            -(b.d - distance)
          );
        }
        for (const c of coins) {
          c.mesh.position.set(
            pathX(c.d) + c.lateral,
            pathY(c.d) + 0.8,
            -(c.d - distance)
          );
          c.mesh.rotation.y += delta * 3;
        }

        const ballWorldX = pathX(distance) + lateralPos;
        const ballWorldY = pathY(distance) + 0.5 + ballHeight;
        ball.position.set(ballWorldX, ballWorldY, 0);
        ball.rotation.x -= currentSpeed * 2 * delta;
        ball.rotation.z -= lateralVel * 2 * delta;

        neonLight.position.set(ballWorldX, ballWorldY + 3, 0);

        // Camera follows the curving, sloping track
        const camTargetX = pathX(distance) + lateralPos * 0.4;
        const camTargetY = pathY(distance) + 5;
        camera.position.x += (camTargetX - camera.position.x) * Math.min(1, delta * 5);
        camera.position.y += (camTargetY - camera.position.y) * Math.min(1, delta * 4);
        camera.position.z = 12;
        const aheadD = distance + 22;
        camera.lookAt(
          pathX(aheadD) * 0.6 + ballWorldX * 0.4,
          pathY(aheadD) + 1.5,
          -22
        );

        renderer.render(scene, camera);
      }

      animate();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  // Send the finished run to the worldwide leaderboard
  useEffect(() => {
    if (!gameState.isGameOver) return;
    const distance = gameState.score;
    if (distance <= 0) return;
    let cancelled = false;
    submitScore({
      data: { playerId: getPlayerId(), name: playerName, distance },
    })
      .then(() => {
        if (!cancelled) queryClient.invalidateQueries({ queryKey: leaderboardQueryKey });
      })
      .catch((err) => console.error("leaderboard submit failed", err));
    return () => {
      cancelled = true;
    };
  }, [gameState.isGameOver, gameState.score, playerName, queryClient]);


  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      <div ref={containerRef} className="h-full w-full" />

      {/* HUD */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6">
        <div className="flex items-start justify-between">
          <div className="rounded-lg bg-black/40 px-4 py-2 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-cyan-400">Score</p>
            <p className="font-mono text-3xl font-bold text-white">
              {gameState.score.toLocaleString()}
            </p>
            <p className="font-mono text-xs text-cyan-200/70">
              Best {gameState.highScore.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-black/40 px-4 py-2 text-center backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-yellow-400">Coins</p>
            <p className="font-mono text-3xl font-bold text-yellow-300">
              {gameState.coins}
            </p>
          </div>
          <div className="rounded-lg bg-black/40 px-4 py-2 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-widest text-cyan-400">Speed</p>
            <p className="font-mono text-3xl font-bold text-white">
              {gameState.speed}
              <span className="text-lg text-white/60"> km/h</span>
            </p>
          </div>
        </div>

        {gameState.message && (
          <p className="text-center font-mono text-4xl font-black text-white drop-shadow-[0_0_12px_rgba(0,255,255,0.8)]">
            {gameState.message}
          </p>
        )}

        <div className="space-y-3 text-center">
          <div className="pointer-events-auto flex justify-center gap-3">
            {(Object.keys(POWER_UPS) as PowerUp[]).map((p) => {
              const info = POWER_UPS[p];
              const active = gameState.timers[p] > 0;
              const affordable = gameState.coins >= info.cost;
              return (
                <button
                  key={p}
                  onClick={() => buyRef.current?.(p)}
                  disabled={!affordable}
                  style={{ borderColor: info.color }}
                  className={`min-w-[9rem] rounded-xl border bg-black/50 px-4 py-2 text-left backdrop-blur-sm transition-all ${
                    affordable ? "hover:scale-105" : "opacity-40"
                  } ${active ? "ring-2 ring-white/70" : ""}`}
                >
                  <p
                    className="text-sm font-bold"
                    style={{ color: info.color }}
                  >
                    {info.key} · {info.label}
                  </p>
                  <p className="font-mono text-xs text-white/70">
                    {active
                      ? `${gameState.timers[p].toFixed(1)}s left`
                      : `${info.cost} coins`}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="text-sm text-white/50">
            ← → or A/D to steer • Space to start/restart • 1/2/3 to buy power-ups
          </p>
        </div>
      </div>

      {/* Start screen */}
      {!gameState.isPlaying && !gameState.isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/70 py-8 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="mb-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-7xl font-black tracking-tighter text-transparent">
              SLOPE
            </h1>
            <p className="mb-4 text-lg" style={{ color: map.swatch }}>
              {map.name} — {map.tagline}
            </p>
            <p className="mb-6 text-sm text-white/60">
              Playing as <span className="font-mono text-cyan-300">{playerName}</span>{" "}
              <button
                onClick={onChangeName}
                className="ml-1 underline underline-offset-4 hover:text-white"
              >
                change name
              </button>
              {" · "}
              <button
                onClick={onChangeMap}
                className="underline underline-offset-4 hover:text-white"
              >
                change map
              </button>
            </p>
            <div className="mx-auto mb-6 flex max-w-md items-center justify-center gap-6 font-mono text-sm">
              <p className="text-cyan-300">
                Top score: {gameState.highScore.toLocaleString()}
              </p>
              <p className="text-yellow-300">Coins: {gameState.coins}</p>
            </div>
            <div className="mb-6">
              <Leaderboard />
            </div>

            <div className="mx-auto mb-8 grid max-w-md grid-cols-2 gap-3 text-left text-sm">
              <div className="flex items-center gap-2 text-white/80">
                <span className="h-3 w-3 rounded-sm bg-[#ff2244]" /> Red — crash
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="h-3 w-3 rounded-sm bg-[#ffaa00]" /> Orange — slows you
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="h-3 w-3 rounded-sm bg-[#00ff88]" /> Green — speed boost
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="h-3 w-3 rounded-sm bg-[#aa55ff]" /> Purple — bounces you
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="h-3 w-3 rounded-full bg-[#ffd700]" /> Gold — collect coins
              </div>
            </div>
            <div className="mx-auto mb-8 max-w-md rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm">
              <p className="mb-2 font-bold text-yellow-300">
                Coin shop — you have {gameState.coins} coins
              </p>
              {(Object.keys(POWER_UPS) as PowerUp[]).map((p) => (
                <p key={p} className="text-white/70">
                  <span style={{ color: POWER_UPS[p].color }}>
                    Press {POWER_UPS[p].key} — {POWER_UPS[p].label}
                  </span>{" "}
                  · {POWER_UPS[p].cost} coins · {POWER_UPS[p].duration}s ·{" "}
                  {POWER_UPS[p].hint}
                </p>
              ))}
            </div>
            <button
              onClick={() =>
                window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }))
              }
              className="rounded-full bg-cyan-500 px-8 py-3 font-bold text-black shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 hover:bg-cyan-400"
            >
              Press Space to Start
            </button>
          </div>
        </div>
      )}

      {/* Game over screen */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-black/80 py-8 backdrop-blur-sm">
          <div className="text-center">
            <h2 className="mb-2 text-6xl font-black text-red-500">CRASHED</h2>
            {gameState.newBest && (
              <p className="mb-2 animate-pulse font-mono text-lg font-bold text-yellow-300">
                ★ New top score! ★
              </p>
            )}
            <p className="mb-2 text-xl text-white">Final Score</p>
            <p className="mb-2 font-mono text-5xl font-bold text-white">
              {gameState.score.toLocaleString()}
            </p>
            <p className="mb-4 font-mono text-sm text-cyan-200/70">
              Top score: {gameState.highScore.toLocaleString()}
            </p>
            <div className="mb-6">
              <Leaderboard />
            </div>

            <button
              onClick={() =>
                window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }))
              }
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
