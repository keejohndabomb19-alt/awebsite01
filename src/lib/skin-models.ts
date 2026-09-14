import type * as ThreeTypes from "three";
import type { SkinConfig } from "./skins";

type ThreeModule = typeof import("three");

function standard(
  THREE: ThreeModule,
  options: ThreeTypes.MeshStandardMaterialParameters
) {
  const material = new THREE.MeshStandardMaterial(options);
  material.userData["originalColor"] = material.color.getHex();
  material.userData["originalEmissive"] = material.emissive.getHex();
  material.userData["originalEmissiveIntensity"] = material.emissiveIntensity;
  return material;
}

function mesh(
  THREE: ThreeModule,
  geometry: ThreeTypes.BufferGeometry,
  material: ThreeTypes.Material
) {
  const part = new THREE.Mesh(geometry, material);
  part.castShadow = true;
  part.receiveShadow = true;
  return part;
}

export function createSkinModel(THREE: ThreeModule, skin: SkinConfig) {
  const model = new THREE.Group();
  model.userData["skinId"] = skin.id;

  if (skin.id === "classic") {
    const core = mesh(
      THREE,
      new THREE.SphereGeometry(0.46, 32, 24),
      standard(THREE, {
        color: skin.color,
        emissive: skin.emissive,
        emissiveIntensity: 0.65,
        roughness: 0.16,
        metalness: 0.75,
      })
    );
    model.add(core);
    [0, Math.PI / 2].forEach((rotation, index) => {
      const ring = mesh(
        THREE,
        new THREE.TorusGeometry(0.51, 0.025, 8, 48),
        standard(THREE, {
          color: index ? 0xffffff : 0x00ffff,
          emissive: 0x00ddff,
          emissiveIntensity: 1.7,
          roughness: 0.1,
          metalness: 0.8,
        })
      );
      ring.rotation.x = rotation;
      model.add(ring);
    });
  } else if (skin.id === "donut") {
    const dough = mesh(
      THREE,
      new THREE.TorusGeometry(0.34, 0.2, 24, 48),
      standard(THREE, { color: 0xd99655, roughness: 0.82, metalness: 0.02 })
    );
    dough.rotation.y = Math.PI / 2;
    model.add(dough);
    const frosting = mesh(
      THREE,
      new THREE.TorusGeometry(0.34, 0.145, 20, 48),
      standard(THREE, {
        color: skin.color,
        emissive: skin.emissive,
        emissiveIntensity: 0.3,
        roughness: 0.55,
        metalness: 0.02,
      })
    );
    frosting.rotation.y = Math.PI / 2;
    frosting.position.x = 0.11;
    model.add(frosting);
    const sprinkleColors = [0xffee55, 0x55ddff, 0xffffff, 0x66ee88, 0xff6688];
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const sprinkle = mesh(
        THREE,
        new THREE.CapsuleGeometry(0.018, 0.07, 3, 5),
        standard(THREE, {
          color: sprinkleColors[i % sprinkleColors.length] ?? 0xffffff,
          roughness: 0.45,
        })
      );
      sprinkle.position.set(0.27, Math.cos(angle) * 0.34, Math.sin(angle) * 0.34);
      sprinkle.rotation.x = angle + (i % 3) * 0.7;
      sprinkle.rotation.z = Math.PI / 2;
      model.add(sprinkle);
    }
  } else if (skin.id === "lava") {
    model.add(
      mesh(
        THREE,
        new THREE.IcosahedronGeometry(0.55, 1),
        standard(THREE, { color: 0x241411, roughness: 0.92, metalness: 0.08 })
      )
    );
    const cracks = mesh(
      THREE,
      new THREE.IcosahedronGeometry(0.558, 1),
      standard(THREE, {
        color: skin.color,
        emissive: 0xff2200,
        emissiveIntensity: 2,
        wireframe: true,
        roughness: 0.25,
      })
    );
    model.add(cracks);
    const core = mesh(
      THREE,
      new THREE.IcosahedronGeometry(0.43, 1),
      standard(THREE, {
        color: 0xffaa00,
        emissive: 0xff3300,
        emissiveIntensity: 1.5,
        roughness: 0.3,
      })
    );
    model.add(core);
  } else if (skin.id === "dice") {
    model.add(
      mesh(
        THREE,
        new THREE.BoxGeometry(0.82, 0.82, 0.82, 3, 3, 3),
        standard(THREE, {
          color: skin.color,
          emissive: skin.emissive,
          emissiveIntensity: 0.14,
          roughness: 0.36,
          metalness: 0.08,
        })
      )
    );
    const pipMaterial = standard(THREE, { color: 0x201b24, roughness: 0.7 });
    const patterns: Array<{
      axis: "x" | "y" | "z";
      side: number;
      points: Array<[number, number]>;
    }> = [
      { axis: "x", side: 1, points: [[0, 0]] },
      { axis: "z", side: 1, points: [[-0.19, -0.19], [0.19, 0.19]] },
      { axis: "y", side: 1, points: [[-0.2, -0.2], [0, 0], [0.2, 0.2]] },
      { axis: "x", side: -1, points: [[-0.19, -0.19], [-0.19, 0.19], [0.19, -0.19], [0.19, 0.19]] },
      { axis: "z", side: -1, points: [[-0.2, -0.2], [-0.2, 0.2], [0, 0], [0.2, -0.2], [0.2, 0.2]] },
      { axis: "y", side: -1, points: [[-0.2, -0.2], [-0.2, 0], [-0.2, 0.2], [0.2, -0.2], [0.2, 0], [0.2, 0.2]] },
    ];
    patterns.forEach(({ axis, side, points }) => {
      points.forEach(([a, b]) => {
        const pip = mesh(THREE, new THREE.SphereGeometry(0.055, 10, 8), pipMaterial);
        if (axis === "x") pip.position.set(side * 0.41, a, b);
        if (axis === "y") pip.position.set(a, side * 0.41, b);
        if (axis === "z") pip.position.set(a, b, side * 0.41);
        model.add(pip);
      });
    });
  } else if (skin.id === "emerald") {
    const gemGeometry = new THREE.DodecahedronGeometry(0.55, 0);
    model.add(
      mesh(
        THREE,
        gemGeometry,
        standard(THREE, {
          color: skin.color,
          emissive: skin.emissive,
          emissiveIntensity: 0.65,
          roughness: 0.08,
          metalness: 0.72,
        })
      )
    );
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(gemGeometry, 10),
      new THREE.LineBasicMaterial({ color: 0xaaffdd, transparent: true, opacity: 0.9 })
    );
    model.add(edges);
    model.add(
      mesh(
        THREE,
        new THREE.OctahedronGeometry(0.31, 0),
        standard(THREE, {
          color: 0x9effc8,
          emissive: 0x19ee88,
          emissiveIntensity: 1.2,
          transparent: true,
          opacity: 0.72,
          roughness: 0.05,
        })
      )
    );
  } else {
    const body = mesh(
      THREE,
      new THREE.CapsuleGeometry(0.34, 0.42, 12, 24),
      standard(THREE, {
        color: skin.color,
        emissive: skin.emissive,
        emissiveIntensity: 0.22,
        roughness: 0.05,
        metalness: 1,
      })
    );
    body.rotation.z = Math.PI / 2;
    model.add(body);
    [-0.22, 0, 0.22].forEach((x, index) => {
      const band = mesh(
        THREE,
        new THREE.TorusGeometry(0.345, index === 1 ? 0.035 : 0.022, 10, 32),
        standard(THREE, {
          color: index === 1 ? 0x22ddff : 0x26344c,
          emissive: index === 1 ? 0x0088aa : 0x111827,
          emissiveIntensity: index === 1 ? 1 : 0.25,
          roughness: 0.15,
          metalness: 0.95,
        })
      );
      band.rotation.y = Math.PI / 2;
      band.position.x = x;
      model.add(band);
    });
  }

  return model;
}

export function setSkinShield(model: ThreeTypes.Group, active: boolean) {
  model.traverse((object) => {
    if (!(object as ThreeTypes.Mesh).isMesh) return;
    const material = (object as ThreeTypes.Mesh).material;
    if (!(material instanceof Array) && "emissive" in material) {
      const mat = material as ThreeTypes.MeshStandardMaterial;
      if (active) {
        mat.color.set(0xffd84a);
        mat.emissive.set(0xffa500);
        mat.emissiveIntensity = 1.2;
      } else {
        mat.color.set(mat.userData["originalColor"] as number);
        mat.emissive.set(mat.userData["originalEmissive"] as number);
        mat.emissiveIntensity = mat.userData["originalEmissiveIntensity"] as number;
      }
    }
  });
}

export function disposeSkinModel(model: ThreeTypes.Group) {
  model.traverse((object) => {
    if ((object as ThreeTypes.Mesh).isMesh) {
      const part = object as ThreeTypes.Mesh;
      part.geometry.dispose();
      const materials = Array.isArray(part.material) ? part.material : [part.material];
      materials.forEach((material) => material.dispose());
    } else if ((object as ThreeTypes.LineSegments).isLineSegments) {
      const line = object as ThreeTypes.LineSegments;
      line.geometry.dispose();
      const materials = Array.isArray(line.material) ? line.material : [line.material];
      materials.forEach((material) => material.dispose());
    }
  });
}