import * as THREE from "three";
import type { Memory } from "./store";
import type { Features } from "./features";
import { moods } from "./theme";
export type CameraPosition = {
  yaw: number;
  pitch: number;
  distance: number;
  x: number;
  y: number;
};
export const initialCamera: CameraPosition = {
  yaw: 0,
  pitch: 0.3,
  distance: 23,
  x: 0,
  y: 0,
};
export function makeGalaxy(
  renderer: THREE.WebGLRenderer,
  memories: Memory[],
  features: Features,
  width: number,
  height: number,
  reduced: boolean,
) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#090719");
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  const targets: THREE.Mesh[] = [];
  const coords = new Map<string, THREE.Vector3>();
  const lines: THREE.Line[] = [];
  memories.forEach((m, i) => {
    const pos = new THREE.Vector3(
      (m.x - 50) * 0.22,
      (50 - m.y) * 0.16,
      Math.sin(i * 2.4) * 4,
    );
    coords.set(m.id, pos);
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 8),
      new THREE.MeshBasicMaterial({ color: moods[m.mood].color }),
    );
    mesh.position.copy(pos);
    mesh.userData.id = m.id;
    scene.add(mesh);
    targets.push(mesh);
    const count = features.reflections.filter(
      (r) => r.memoryId === m.id,
    ).length;
    for (let j = 0; j < Math.min(count, 4); j++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.4 + j * 0.13, 0.014, 5, 40),
        new THREE.MeshBasicMaterial({
          color: moods[m.mood].color,
          transparent: true,
          opacity: 0.55,
        }),
      );
      ring.position.copy(pos);
      scene.add(ring);
    }
  });
  for (const c of features.constellations) {
    const points = c.memoryIds
      .map((id) => coords.get(id))
      .filter((p): p is THREE.Vector3 => !!p);
    if (points.length < 2) continue;
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: "#d4aaff",
        transparent: true,
        opacity: 0.7,
      }),
    );
    scene.add(line);
    lines.push(line);
  }
  const dots: number[] = [];
  for (let i = 0; i < 400; i++)
    dots.push(Math.sin(i * 13.3) * 40, Math.cos(i * 9.7) * 30, -15 - (i % 30));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(dots, 3));
  scene.add(
    new THREE.Points(
      geometry,
      new THREE.PointsMaterial({ color: "#d4c2ed", size: 0.06 }),
    ),
  );
  const start = Date.now();
  const raycaster = new THREE.Raycaster();
  return {
    render(p: CameraPosition) {
      camera.position.set(
        p.x + Math.sin(p.yaw) * Math.cos(p.pitch) * p.distance,
        p.y + Math.sin(p.pitch) * p.distance,
        Math.cos(p.yaw) * Math.cos(p.pitch) * p.distance,
      );
      camera.lookAt(p.x, p.y, 0);
      if (!reduced) {
        const progress = Math.min(1, (Date.now() - start) / 1400);
        for (const line of lines)
          line.geometry.setDrawRange(
            0,
            Math.ceil(progress * line.geometry.getAttribute("position").count),
          );
      }
      renderer.render(scene, camera);
    },
    pick(x: number, y: number) {
      raycaster.setFromCamera(
        new THREE.Vector2((x / width) * 2 - 1, (-y / height) * 2 + 1),
        camera,
      );
      return raycaster.intersectObjects(targets)[0]?.object.userData.id as
        string | undefined;
    },
    dispose() {
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        mesh.geometry?.dispose();
        const materials = mesh.material
          ? Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          : [];
        materials.forEach((m) => m.dispose());
      });
      renderer.dispose();
    },
  };
}
