/**
 * globe.js — Digital Network Globe (Three.js)
 */
(function () {
  'use strict';

  const container = document.getElementById('globe-container');
  if (!container) return;

  const W = container.clientWidth;
  const H = container.clientHeight;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(0, 0, 3.2);

  const RADIUS = 1.0;

  // Helper: lat/lon → Vector3
  function toVec(lat, lon, r) {
    const phi   = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Grid lines
  const gridMat = new THREE.LineBasicMaterial({ color: 0x4A7A9B, transparent: true, opacity: 0.22 });

  for (let lat = -75; lat <= 75; lat += 15) {
    const pts = [];
    for (let lon = 0; lon <= 360; lon += 3) pts.push(toVec(lat, lon, RADIUS));
    globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }
  for (let lon = 0; lon < 360; lon += 15) {
    const pts = [];
    for (let lat = -90; lat <= 90; lat += 3) pts.push(toVec(lat, lon, RADIUS));
    globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
  }

  // Surface dots (fibonacci sphere distribution)
  const dotCount = 1800;
  const dotPos   = [];
  for (let i = 0; i < dotCount; i++) {
    const phi   = Math.acos(-1 + (2 * i) / dotCount);
    const theta = Math.sqrt(dotCount * Math.PI) * phi;
    dotPos.push(
      RADIUS * Math.sin(phi) * Math.cos(theta),
      RADIUS * Math.cos(phi),
      RADIUS * Math.sin(phi) * Math.sin(theta)
    );
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPos, 3));
  globeGroup.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({
    color: 0x5C8FAA, size: 0.012, transparent: true, opacity: 0.58, sizeAttenuation: true,
  })));

  // Network nodes (major cities)
  const cities = [
    [40, -74], [51, 0], [35, 139], [-34, 151],
    [55, 37],  [1, 103], [19, 73], [37, -122],
    [-23, -43], [48, 2], [25, 121], [-6, 106],
  ];

  const nodeVecs = cities.map(([lat, lon]) => toVec(lat, lon, RADIUS * 1.005));
  const nodePts  = nodeVecs.flatMap(v => [v.x, v.y, v.z]);
  const nodeGeo  = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodePts, 3));
  globeGroup.add(new THREE.Points(nodeGeo, new THREE.PointsMaterial({
    color: 0x7EA8C4, size: 0.032, transparent: true, opacity: 0.85, sizeAttenuation: true,
  })));

  // Connection lines between nearby nodes
  const connMat = new THREE.LineBasicMaterial({ color: 0x9AB8CC, transparent: true, opacity: 0.26 });
  for (let i = 0; i < nodeVecs.length; i++) {
    for (let j = i + 1; j < nodeVecs.length; j++) {
      if (nodeVecs[i].distanceTo(nodeVecs[j]) < 1.0) {
        globeGroup.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([nodeVecs[i], nodeVecs[j]]),
          connMat
        ));
      }
    }
  }

  // Outer glow shell
  globeGroup.add(new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 1.06, 48, 48),
    new THREE.MeshBasicMaterial({ color: 0x3A6080, transparent: true, opacity: 0.05, side: THREE.BackSide })
  ));

  // Mouse interaction
  let targetRotX = 0, targetRotY = 0;
  document.addEventListener('mousemove', (e) => {
    targetRotX = ((e.clientY / window.innerHeight) - 0.5) * 0.36;
    targetRotY = ((e.clientX / window.innerWidth)  - 0.5) * 0.36;
  });

  // Resize
  window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // Render loop
  let autoRot = 0;
  function animate() {
    requestAnimationFrame(animate);
    autoRot += 0.0015;
    globeGroup.rotation.y += (autoRot + targetRotY - globeGroup.rotation.y) * 0.03;
    globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.03;
    renderer.render(scene, camera);
  }
  animate();
})();
