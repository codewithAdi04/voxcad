import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from "three/examples/jsm/controls/TransformControls";

// ─── STATE ───────────────────────────────────────────────────────────────────
let scene, camera, renderer, orbitControls, transformControls;
let animationId;
let objects = [];
let selectedObject = null;
let onSelectCallback = null;
let gridHelper, axesHelper;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ─── INIT ─────────────────────────────────────────────────────────────────────
export function initScene(container) {
  if (renderer) disposeScene();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050a14);
  scene.fog = new THREE.Fog(0x050a14, 30, 100);

  camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.01,
    1000
  );
  camera.position.set(8, 6, 10);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  setupLights();

  gridHelper = new THREE.GridHelper(30, 30, 0x0d2040, 0x0a1830);
  scene.add(gridHelper);

  axesHelper = new THREE.AxesHelper(3);
  scene.add(axesHelper);

  // ✅ FIX 1: Full 360° rotation — removed maxPolarAngle restriction
  orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.06;
  orbitControls.screenSpacePanning = true;
  orbitControls.minDistance = 0.5;
  orbitControls.maxDistance = 200;
  // maxPolarAngle = Math.PI allows full vertical rotation
  orbitControls.maxPolarAngle = Math.PI;
  orbitControls.target.set(0, 0, 0);

  transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.setSize(0.8);
  transformControls.addEventListener("dragging-changed", (e) => {
    orbitControls.enabled = !e.value;
  });
  transformControls.addEventListener("objectChange", () => {
    if (selectedObject && onSelectCallback) {
      onSelectCallback(getObjectInfo(selectedObject));
    }
  });
  scene.add(transformControls);

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("resize", () => onWindowResize(container));

  animate();
  return disposeScene;
}

// ─── LIGHTS ──────────────────────────────────────────────────────────────────
function setupLights() {
  const ambient = new THREE.AmbientLight(0x1a2a4a, 1.5);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.position.set(10, 20, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 100;
  sun.shadow.camera.left = -20;
  sun.shadow.camera.right = 20;
  sun.shadow.camera.top = 20;
  sun.shadow.camera.bottom = -20;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x4488ff, 0.6);
  fill.position.set(-5, 5, -10);
  scene.add(fill);

  const rim = new THREE.PointLight(0x00d4ff, 1.2, 40);
  rim.position.set(-8, 8, -8);
  scene.add(rim);
}

// ─── ANIMATE ─────────────────────────────────────────────────────────────────
function animate() {
  animationId = requestAnimationFrame(animate);
  orbitControls?.update();
  renderer?.render(scene, camera);
}

// ─── COMPLEX OBJECTS (Car, House, Table etc.) ─────────────────────────────────
// ✅ FIX 2: Complex multi-part objects as a group
const COMPLEX_OBJECTS = {
  car: (color) => {
    const group = new THREE.Group();
    const bodyColor = color || "#cc2222";
    const wheelColor = "#222222";
    const windowColor = "#aaddff";

    // Car body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.7, 4),
      new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.6, roughness: 0.3 })
    );
    body.position.y = 0.6;
    group.add(body);

    // Car roof/cabin
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.6, 2),
      new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.6, roughness: 0.3 })
    );
    roof.position.set(0, 1.25, 0.2);
    group.add(roof);

    // Windshield
    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(1.55, 0.55, 0.05),
      new THREE.MeshStandardMaterial({ color: windowColor, metalness: 0.1, roughness: 0.1, transparent: true, opacity: 0.7 })
    );
    windshield.position.set(0, 1.25, -0.84);
    group.add(windshield);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32);
    const wheelMat = new THREE.MeshStandardMaterial({ color: wheelColor, metalness: 0.2, roughness: 0.8 });
    const wheelPositions = [
      [-1.1, 0.4, 1.3], [1.1, 0.4, 1.3],
      [-1.1, 0.4, -1.3], [1.1, 0.4, -1.3]
    ];
    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);
      group.add(wheel);
    });

    // Headlights
    const lightGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const lightMat = new THREE.MeshStandardMaterial({ color: "#ffffaa", emissive: "#ffff44", emissiveIntensity: 0.5 });
    [[-0.6, 0.6, -2.01], [0.6, 0.6, -2.01]].forEach(([x, y, z]) => {
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(x, y, z);
      group.add(light);
    });

    return group;
  },

  house: (color) => {
    const group = new THREE.Group();
    const wallColor = color || "#e8d5b0";

    // Walls
    const walls = new THREE.Mesh(
      new THREE.BoxGeometry(4, 3, 4),
      new THREE.MeshStandardMaterial({ color: wallColor, metalness: 0.0, roughness: 0.9 })
    );
    walls.position.y = 1.5;
    group.add(walls);

    // Roof
    const roofGeo = new THREE.ConeGeometry(3.2, 2, 4);
    const roof = new THREE.Mesh(
      roofGeo,
      new THREE.MeshStandardMaterial({ color: "#8B2500", metalness: 0.0, roughness: 0.8 })
    );
    roof.position.y = 4;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    // Door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.6, 0.05),
      new THREE.MeshStandardMaterial({ color: "#5C3317", roughness: 0.9 })
    );
    door.position.set(0, 0.8, 2.03);
    group.add(door);

    // Windows
    const winGeo = new THREE.BoxGeometry(0.8, 0.7, 0.05);
    const winMat = new THREE.MeshStandardMaterial({ color: "#aaddff", transparent: true, opacity: 0.7 });
    [[-1.2, 1.8, 2.03], [1.2, 1.8, 2.03]].forEach(([x, y, z]) => {
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(x, y, z);
      group.add(win);
    });

    return group;
  },

  table: (color) => {
    const group = new THREE.Group();
    const woodColor = color || "#8B4513";
    const mat = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.8 });

    // Tabletop
    const top = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 2.5), mat);
    top.position.y = 2;
    group.add(top);

    // 4 Legs
    const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 16);
    [[-1.7, 1, -1], [1.7, 1, -1], [-1.7, 1, 1], [1.7, 1, 1]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(x, y, z);
      group.add(leg);
    });

    return group;
  },

  chair: (color) => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: color || "#5C3317", roughness: 0.8 });

    // Seat
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.2), mat), { position: new THREE.Vector3(0, 1.1, 0) }));
    // Back
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), mat);
    back.position.set(0, 1.7, -0.55);
    group.add(back);
    // Legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.1, 12);
    [[-0.5, 0.55, -0.5], [0.5, 0.55, -0.5], [-0.5, 0.55, 0.5], [0.5, 0.55, 0.5]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(x, y, z);
      group.add(leg);
    });

    return group;
  },

  tree: (color) => {
    const group = new THREE.Group();
    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.3, 2, 12),
      new THREE.MeshStandardMaterial({ color: "#5C3317", roughness: 0.9 })
    );
    trunk.position.y = 1;
    group.add(trunk);
    // Foliage layers
    [[0, 2.5, 1.8], [0, 3.5, 1.4], [0, 4.3, 1.0]].forEach(([x, y, r]) => {
      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(r, 1.2, 16),
        new THREE.MeshStandardMaterial({ color: color || "#228B22", roughness: 0.9 })
      );
      leaves.position.set(x, y, 0);
      group.add(leaves);
    });
    return group;
  },

  robot: (color) => {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: color || "#aaaaaa", metalness: 0.8, roughness: 0.2 });
    const accentMat = new THREE.MeshStandardMaterial({ color: "#00d4ff", emissive: "#00d4ff", emissiveIntensity: 0.3 });

    // Body
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.8), mat), { position: new THREE.Vector3(0, 1.5, 0) }));
    // Head
    group.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.8), mat), { position: new THREE.Vector3(0, 2.7, 0) }));
    // Eyes
    [[-0.2, 2.75, 0.41], [0.2, 2.75, 0.41]].forEach(([x, y, z]) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), accentMat);
      eye.position.set(x, y, z);
      group.add(eye);
    });
    // Arms
    [[-0.85, 1.5, 0], [0.85, 1.5, 0]].forEach(([x, y, z]) => {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 1.2, 12), mat);
      arm.position.set(x, y, z);
      arm.rotation.z = x < 0 ? 0.3 : -0.3;
      group.add(arm);
    });
    // Legs
    [[-0.3, 0.4, 0], [0.3, 0.4, 0]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 1.2, 12), mat);
      leg.position.set(x, y, z);
      group.add(leg);
    });

    return group;
  },
};

// ─── ADD OBJECT ──────────────────────────────────────────────────────────────
export function addObject(cmd) {
  const { shape, dimensions = {}, color, position, name } = cmd;

  // ✅ Check if it's a complex object first
  const complexKey = Object.keys(COMPLEX_OBJECTS).find(k => 
    shape?.toLowerCase().includes(k)
  );

  let meshOrGroup;

  if (complexKey) {
    // Build complex group
    const group = COMPLEX_OBJECTS[complexKey](color);
    group.userData = { id: `obj_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, name: name || complexKey, shape: complexKey };
    group.castShadow = true;

    if (position) {
      group.position.set(position.x || 0, position.y || 0, position.z || 0);
    } else {
      const spread = objects.length * 0.5;
      group.position.set(
        (Math.random() - 0.5) * Math.min(spread + 2, 8),
        0,
        (Math.random() - 0.5) * Math.min(spread + 2, 8)
      );
    }

    scene.add(group);
    objects.push(group);
    selectObject(group);
    return group.userData.id;
  }

  // ── Simple primitives ──────────────────────────────────────────────────────
  let geometry;
  const d = dimensions;

  switch (shape) {
    case "cube": case "box":
      geometry = new THREE.BoxGeometry(d.width || d.length || 2, d.height || 2, d.depth || d.width || d.length || 2); break;
    case "sphere": case "ball":
      geometry = new THREE.SphereGeometry(d.radius || 1, 64, 64); break;
    case "cylinder": case "pipe":
      geometry = new THREE.CylinderGeometry(d.radiusTop ?? d.radius ?? 1, d.radiusBottom ?? d.radius ?? 1, d.height || 3, 64); break;
    case "cone":
      geometry = new THREE.ConeGeometry(d.radius || 1, d.height || 3, 64); break;
    case "torus": case "ring":
      geometry = new THREE.TorusGeometry(d.radius || 1.5, d.tube || 0.4, 32, 100); break;
    case "plane": case "floor": case "ground":
      geometry = new THREE.PlaneGeometry(d.width || 5, d.depth || 5); break;
    case "capsule":
      geometry = new THREE.CapsuleGeometry(d.radius || 0.5, d.height || 2, 16, 32); break;
    case "dodecahedron":
      geometry = new THREE.DodecahedronGeometry(d.radius || 1); break;
    case "octahedron":
      geometry = new THREE.OctahedronGeometry(d.radius || 1); break;
    case "tetrahedron":
      geometry = new THREE.TetrahedronGeometry(d.radius || 1); break;
    case "icosahedron":
      geometry = new THREE.IcosahedronGeometry(d.radius || 1); break;
    default:
      geometry = new THREE.BoxGeometry(2, 2, 2);
  }

  const meshColor = color
    ? new THREE.Color(color)
    : new THREE.Color().setHSL(Math.random() * 0.6 + 0.5, 0.8, 0.55);

  const material = new THREE.MeshStandardMaterial({
    color: meshColor, metalness: 0.3, roughness: 0.4,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  if (position) {
    mesh.position.set(position.x || 0, position.y || 0, position.z || 0);
  } else {
    const spread = objects.length * 0.5;
    mesh.position.set(
      (Math.random() - 0.5) * Math.min(spread + 2, 8),
      (geometry.parameters?.height || 2) / 2,
      (Math.random() - 0.5) * Math.min(spread + 2, 8)
    );
  }

  const id = `obj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  mesh.userData = { id, name: name || shape, shape };

  scene.add(mesh);
  objects.push(mesh);
  selectObject(mesh);

  return id;
}

// ─── SELECTION ───────────────────────────────────────────────────────────────
function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  // Check all meshes including inside groups
  const allMeshes = [];
  objects.forEach(o => {
    if (o.isMesh) allMeshes.push(o);
    else o.traverse(child => { if (child.isMesh) allMeshes.push(child); });
  });

  const hits = raycaster.intersectObjects(allMeshes);

  if (hits.length > 0) {
    // Find top-level object (group or mesh)
    let hit = hits[0].object;
    while (hit.parent && !objects.includes(hit)) hit = hit.parent;
    selectObject(hit);
  } else {
    deselectAll();
  }
}

export function selectObject(mesh) {
  if (selectedObject && selectedObject !== mesh) {
    selectedObject.traverse(c => { if (c.isMesh && c.material.emissive) c.material.emissive.set(0x000000); });
  }

  selectedObject = mesh;

  if (mesh) {
    mesh.traverse(c => { if (c.isMesh && c.material.emissive) c.material.emissive.set(0x003344); });
    transformControls.attach(mesh);
    if (onSelectCallback) onSelectCallback(getObjectInfo(mesh));
  } else {
    transformControls.detach();
  }
}

export function deselectAll() {
  if (selectedObject) {
    selectedObject.traverse(c => { if (c.isMesh && c.material.emissive) c.material.emissive.set(0x000000); });
    selectedObject = null;
  }
  transformControls.detach();
  if (onSelectCallback) onSelectCallback(null);
}

export function onObjectSelect(cb) { onSelectCallback = cb; }
export function setTransformMode(mode) { transformControls.setMode(mode); }

// ─── CAMERA ──────────────────────────────────────────────────────────────────
export function cameraFitAll() {
  if (objects.length === 0) return;
  const box = new THREE.Box3();
  objects.forEach((o) => box.expandByObject(o));
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.set(center.x + maxDim * 1.5, center.y + maxDim * 1.2, center.z + maxDim * 1.5);
  orbitControls.target.copy(center);
  orbitControls.update();
}

export function cameraTop() {
  const center = getCenterOf(objects);
  camera.position.set(center.x, 20, center.z);
  orbitControls.target.copy(center); orbitControls.update();
}

export function cameraFront() {
  const center = getCenterOf(objects);
  camera.position.set(center.x, center.y + 2, 20);
  orbitControls.target.copy(center); orbitControls.update();
}

export function cameraSide() {
  const center = getCenterOf(objects);
  camera.position.set(20, center.y + 2, center.z);
  orbitControls.target.copy(center); orbitControls.update();
}

function getCenterOf(objs) {
  const center = new THREE.Vector3();
  if (objs.length > 0) {
    const box = new THREE.Box3();
    objs.forEach((o) => box.expandByObject(o));
    box.getCenter(center);
  }
  return center;
}

export function zoomIn() {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  camera.position.addScaledVector(dir, 2);
  orbitControls.update();
}

export function zoomOut() {
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  camera.position.addScaledVector(dir, -2);
  orbitControls.update();
}

// ─── OBJECT OPS ──────────────────────────────────────────────────────────────
export function deleteSelected() {
  if (!selectedObject) return;
  scene.remove(selectedObject);
  selectedObject.traverse(c => { if (c.isMesh) { c.geometry.dispose(); c.material.dispose(); } });
  objects = objects.filter((o) => o !== selectedObject);
  transformControls.detach();
  selectedObject = null;
  if (onSelectCallback) onSelectCallback(null);
}

export function duplicateSelected() {
  if (!selectedObject) return;
  const clone = selectedObject.clone();
  clone.position.x += 2;
  clone.userData.id = `obj_${Date.now()}`;
  scene.add(clone);
  objects.push(clone);
  selectObject(clone);
}

export function clearScene() {
  objects.forEach((o) => {
    scene.remove(o);
    o.traverse(c => { if (c.isMesh) { c.geometry.dispose(); c.material.dispose(); } });
  });
  objects = [];
  selectedObject = null;
  transformControls.detach();
  if (onSelectCallback) onSelectCallback(null);
}

export function updateObjectProperty(prop, value) {
  if (!selectedObject) return;
  if (prop === "color") {
    selectedObject.traverse(c => { if (c.isMesh) c.material.color.set(value); });
  } else if (prop === "metalness") {
    selectedObject.traverse(c => { if (c.isMesh) c.material.metalness = value; });
  } else if (prop === "roughness") {
    selectedObject.traverse(c => { if (c.isMesh) c.material.roughness = value; });
  } else if (prop === "wireframe") {
    selectedObject.traverse(c => { if (c.isMesh) c.material.wireframe = value; });
  } else if (["x", "y", "z"].includes(prop)) {
    selectedObject.position[prop] = value;
  } else if (prop === "sx") { selectedObject.scale.x = value; }
  else if (prop === "sy") { selectedObject.scale.y = value; }
  else if (prop === "sz") { selectedObject.scale.z = value; }
}

export function getObjectInfo(mesh) {
  if (!mesh) return null;
  // Get color from first mesh child if group
  let color = "#888888";
  mesh.traverse(c => { if (c.isMesh && !color.startsWith("#0") ) color = "#" + c.material.color.getHexString(); });
  return {
    id: mesh.userData.id,
    name: mesh.userData.name,
    shape: mesh.userData.shape,
    position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
    rotation: {
      x: THREE.MathUtils.radToDeg(mesh.rotation.x),
      y: THREE.MathUtils.radToDeg(mesh.rotation.y),
      z: THREE.MathUtils.radToDeg(mesh.rotation.z),
    },
    scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
    color,
    metalness: 0.3,
    roughness: 0.4,
  };
}

export function getObjectList() {
  return objects.map((o) => ({ id: o.userData.id, name: o.userData.name, shape: o.userData.shape }));
}

export function selectById(id) {
  const mesh = objects.find((o) => o.userData.id === id);
  if (mesh) selectObject(mesh);
}

export function toggleGrid(val) { if (gridHelper) gridHelper.visible = val; }
export function toggleAxes(val) { if (axesHelper) axesHelper.visible = val; }

function onWindowResize(container) {
  if (!camera || !renderer) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

export function onResize() {
  const container = renderer?.domElement?.parentElement;
  if (container) onWindowResize(container);
}

export function disposeScene() {
  cancelAnimationFrame(animationId);
  window.removeEventListener("resize", onWindowResize);
  renderer?.domElement?.removeEventListener("pointerdown", onPointerDown);
  clearScene();
  transformControls?.dispose();
  orbitControls?.dispose();
  renderer?.dispose();
  renderer?.domElement?.remove();
  scene = camera = renderer = orbitControls = transformControls = null;
}