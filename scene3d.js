'use strict';

/* =========================================================
   عالم ثلاثي الأبعاد: نقطة تفتيش ليلية + سيارات مبنية بالهندسة
   يعتمد على three.js r128 (vendor/three.min.js)
   ========================================================= */

const CAR_CFG = {
  sedan: {
    front: 2.30, rear: -2.30, width: 1.86,
    wheelX: [-1.50, 1.50], wheelY: 0.37, wheelR: 0.38, wheelZ: 0.80,
    glass: { x0: -1.28, x3: -0.86, x2: 0.42, x1: 0.98, yB: 1.03, yT: 1.48, width: 1.72 },
    head: { x: 2.27, y: 0.82 }, tail: { x: -2.28, y: 0.86 }, plate: { x: 2.31, y: 0.56 },
    door: { x: -0.2, y: 0.72 },
  },
  suv: {
    front: 2.40, rear: -2.40, width: 1.94,
    wheelX: [-1.55, 1.50], wheelY: 0.43, wheelR: 0.44, wheelZ: 0.84,
    glass: { x0: -1.58, x3: -1.36, x2: 0.52, x1: 1.05, yB: 1.20, yT: 1.66, width: 1.78 },
    head: { x: 2.36, y: 0.98 }, tail: { x: -2.38, y: 1.00 }, plate: { x: 2.41, y: 0.68 },
    door: { x: -0.3, y: 0.86 },
  },
  truck: {
    front: 2.62, rear: -2.62, width: 1.98,
    wheelX: [-1.72, 1.50], wheelY: 0.47, wheelR: 0.48, wheelZ: 0.86,
    glass: { x0: -1.02, x3: -0.72, x2: 0.42, x1: 0.92, yB: 1.28, yT: 1.76, width: 1.80 },
    head: { x: 2.58, y: 1.02 }, tail: { x: -2.60, y: 1.02 }, plate: { x: 2.63, y: 0.80 },
    door: { x: 0.05, y: 1.0 },
  },
};

function sedanShape() {
  const s = new THREE.Shape();
  s.moveTo(-2.26, 0.44);
  s.lineTo(-1.92, 0.36);
  s.absarc(-1.50, 0.36, 0.42, Math.PI, 0, true);
  s.lineTo(1.08, 0.36);
  s.absarc(1.50, 0.36, 0.42, Math.PI, 0, true);
  s.lineTo(2.26, 0.44);
  s.lineTo(2.30, 0.74);
  s.lineTo(2.14, 0.94);
  s.lineTo(1.72, 1.02);
  s.lineTo(1.00, 1.06);
  s.lineTo(-1.22, 1.06);
  s.lineTo(-1.96, 0.99);
  s.lineTo(-2.22, 0.85);
  s.lineTo(-2.30, 0.66);
  s.closePath();
  return s;
}

function suvShape() {
  const s = new THREE.Shape();
  s.moveTo(-2.36, 0.52);
  s.lineTo(-2.02, 0.42);
  s.absarc(-1.55, 0.42, 0.47, Math.PI, 0, true);
  s.lineTo(1.03, 0.42);
  s.absarc(1.50, 0.42, 0.47, Math.PI, 0, true);
  s.lineTo(2.02, 0.50);
  s.lineTo(2.36, 0.60);
  s.lineTo(2.40, 0.92);
  s.lineTo(2.30, 1.14);
  s.lineTo(1.92, 1.22);
  s.lineTo(1.05, 1.24);
  s.lineTo(-1.30, 1.24);
  s.lineTo(-2.06, 1.18);
  s.lineTo(-2.34, 1.02);
  s.lineTo(-2.40, 0.74);
  s.closePath();
  return s;
}

function truckShape() {
  const s = new THREE.Shape();
  s.moveTo(-2.62, 0.58);
  s.lineTo(-2.24, 0.46);
  s.absarc(-1.72, 0.46, 0.50, Math.PI, 0, true);
  s.lineTo(1.02, 0.46);
  s.absarc(1.50, 0.46, 0.50, Math.PI, 0, true);
  s.lineTo(2.16, 0.52);
  s.lineTo(2.58, 0.64);
  s.lineTo(2.62, 0.98);
  s.lineTo(2.42, 1.18);
  s.lineTo(1.95, 1.24);
  s.lineTo(1.35, 1.27);
  s.lineTo(0.95, 1.30);
  s.lineTo(-0.98, 1.30);
  s.lineTo(-0.98, 1.16);
  s.lineTo(-2.62, 1.16);
  s.closePath();
  return s;
}

/* =========================================================
   شخص حقيقي الملامح مبني بالهندسة: رأس فيه عيون وحواجب وأنف
   وفم وأذنان وشعر/لحية/نظارة، ورقبة وأكتاف وذراعان برُكَب.
   ========================================================= */
function personC(v, fallback) {
  try { return new THREE.Color(v || fallback); } catch (e) { return new THREE.Color(fallback); }
}

function buildPerson(look, opts) {
  const l = Object.assign({
    skin: '#c08a63', hair: '#1a1512', shirt: '#2b3f5c', pants: '#1e232c',
    eye: '#3a2418', style: 'short', build: 'normal', height: 1,
  }, look || {});
  const o = opts || {};
  const seated = !!o.seated;
  const bw = l.build === 'heavy' ? 1.14 : l.build === 'slim' ? 0.9 : 1;
  const style = l.style || 'short';

  /* تحويل الألوان من sRGB إلى الخطّي حتى تظهر بألوانها الحقيقية */
  const srgb = (hex, fallback, mul) => {
    const c = personC(hex, fallback).convertSRGBToLinear();
    return mul ? c.multiplyScalar(mul) : c;
  };
  const skinC = srgb(l.skin, '#c08a63', 0.82);
  const mSkin = new THREE.MeshStandardMaterial({ color: skinC, roughness: 0.78, metalness: 0.02 });
  const mSkinD = new THREE.MeshStandardMaterial({ color: srgb(l.skin, '#c08a63', 0.6), roughness: 0.86 });
  const mHair = new THREE.MeshStandardMaterial({ color: srgb(l.hair, '#1a1512'), roughness: 0.92 });
  const mShirt = new THREE.MeshStandardMaterial({ color: srgb(l.shirt, '#2b3f5c'), roughness: 0.9 });
  const mShirtD = new THREE.MeshStandardMaterial({ color: srgb(l.shirt, '#2b3f5c', 0.72), roughness: 0.92 });
  const mPants = new THREE.MeshStandardMaterial({ color: srgb(l.pants, '#1e232c'), roughness: 0.94 });
  const mShoe = new THREE.MeshStandardMaterial({ color: 0x0b0e13, roughness: 0.72 });
  const mWhite = new THREE.MeshStandardMaterial({ color: 0xf2f7ff, roughness: 0.26 });
  const mIris = new THREE.MeshStandardMaterial({ color: srgb(l.eye, '#3a2418'), roughness: 0.3 });
  const mPupil = new THREE.MeshStandardMaterial({ color: 0x08090c, roughness: 0.4 });
  const mMouth = new THREE.MeshStandardMaterial({ color: srgb('#7d4139', '#7d4139'), roughness: 0.64 });
  const mNavy = new THREE.MeshStandardMaterial({ color: srgb('#1c3355', '#1c3355'), roughness: 0.7 });
  const mGlass = new THREE.MeshStandardMaterial({ color: 0x0b1016, roughness: 0.38, metalness: 0.55 });

  const g = new THREE.Group();
  g.userData.parts = {};

  /* ---------- الجذع ---------- */
  const hip = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * bw, 0.21 * bw, 0.2, 14), mPants);
  hip.scale.z = 0.72;
  hip.position.y = 0.9;
  hip.castShadow = true;
  g.add(hip);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.175 * bw, 0.2 * bw, 0.56, 16, 1), mShirt);
  torso.scale.z = 0.72;
  torso.position.y = 1.17;
  torso.castShadow = true;
  g.add(torso);

  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.078, 14, 10), mShirt);
  shoulderL.position.set(-0.17 * bw, 1.38, 0);
  shoulderL.scale.set(1, 0.9, 0.85);
  g.add(shoulderL);
  const shoulderR = shoulderL.clone();
  shoulderR.position.x = 0.17 * bw;
  g.add(shoulderR);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.125, 0.07, 14), mShirtD);
  collar.position.y = 1.44;
  collar.scale.z = 0.82;
  g.add(collar);

  /* ---------- الرقبة ---------- */
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.11, 12), mSkin);
  neck.position.y = 1.47;
  g.add(neck);

  /* ---------- الرأس ---------- */
  const head = new THREE.Group();
  head.position.y = 1.55;
  head.scale.setScalar(0.94);
  g.add(head);

  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.125, 26, 20), mSkin);
  skull.scale.set(0.93, 1.04, 0.97);
  skull.castShadow = true;
  head.add(skull);

  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), mSkin);
  chin.scale.set(0.9, 0.75, 0.85);
  chin.position.set(0, -0.075, 0.03);
  head.add(chin);

  const earL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), mSkinD);
  earL.scale.set(0.36, 0.95, 0.62);
  earL.position.set(-0.117, -0.004, -0.008);
  head.add(earL);
  const earR = earL.clone();
  earR.position.x = 0.117;
  head.add(earR);

  /* عيون: بياض + قزحية + بؤبؤ */
  [-1, 1].forEach((s) => {
    const socket = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), mSkinD);
    socket.scale.set(1.1, 0.78, 0.45);
    socket.position.set(0.043 * s, 0.025, 0.092);
    head.add(socket);
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), mWhite);
    white.scale.set(1.18, 0.86, 0.55);
    white.position.set(0.043 * s, 0.025, 0.098);
    head.add(white);
    const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0122, 14, 10), mIris);
    iris.scale.set(1, 1, 0.5);
    iris.position.set(0.043 * s, 0.024, 0.106);
    head.add(iris);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 10, 8), mPupil);
    pupil.scale.set(1, 1, 0.45);
    pupil.position.set(0.043 * s, 0.024, 0.109);
    head.add(pupil);

    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.012, 0.018), mHair);
    brow.position.set(0.045 * s, 0.062, 0.095);
    brow.rotation.z = -0.1 * s;
    head.add(brow);
  });

  /* أنف */
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.023, 0.056, 12), mSkin);
  nose.rotation.x = Math.PI / 2 + 0.2;
  nose.position.set(0, -0.006, 0.132);
  head.add(nose);
  const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), mSkinD);
  nostril.scale.set(1.5, 0.65, 0.7);
  nostril.position.set(0, -0.03, 0.118);
  head.add(nostril);

  /* فم وشفتان */
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.013, 0.014), mMouth);
  mouth.position.set(0, -0.058, 0.105);
  head.add(mouth);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.009, 0.012), mSkinD);
  lip.position.set(0, -0.071, 0.102);
  head.add(lip);

  /* شعر / قبعة / لحية / نظارة */
  if (style === 'cap') {
    const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.1325, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), mNavy);
    capTop.rotation.x = -0.16;
    head.add(capTop);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.112, 0.112, 0.014, 20, 1, false, -Math.PI / 2, Math.PI), mNavy);
    brim.position.set(0, 0.056, 0.072);
    brim.rotation.x = -0.14;
    head.add(brim);
  } else if (style !== 'bald') {
    /* قشرة شعر كاملة مدفوعة للخلف حتى يبقى الوجه مكشوفاً */
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.1285, 24, 18), mHair);
    hair.scale.set(1.0, 1.02, 1.0);
    hair.position.set(0, 0.01, -0.034);
    head.add(hair);
    if (style === 'long') {
      [-1, 1].forEach((s) => {
        const side = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), mHair);
        side.scale.set(0.5, 1.55, 0.9);
        side.position.set(0.108 * s, -0.045, -0.02);
        head.add(side);
      });
    }
  }

  if (style === 'beard' || l.mustache) {
    const beard = new THREE.Mesh(new THREE.SphereGeometry(0.1335, 22, 16, 0, Math.PI * 2, Math.PI * 0.69, Math.PI * 0.31), mHair);
    beard.scale.set(0.95, 1.05, 1.0);
    head.add(beard);
    const mous = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.013, 0.014), mHair);
    mous.position.set(0, -0.041, 0.106);
    head.add(mous);
  }

  if (style === 'glasses') {
    [-1, 1].forEach((s) => {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.0045, 8, 20), mGlass);
      ring.position.set(0.044 * s, 0.026, 0.109);
      head.add(ring);
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.006, 0.085), mGlass);
      temple.position.set(0.082 * s, 0.028, 0.055);
      head.add(temple);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.006, 0.006), mGlass);
    bridge.position.set(0, 0.028, 0.11);
    head.add(bridge);
  }

  g.userData.parts.head = head;
  g.userData.headY = 1.55;

  /* ---------- الذراعان ---------- */
  const upperGeo = new THREE.CylinderGeometry(0.053, 0.045, 0.29, 10);
  const foreGeo = new THREE.CylinderGeometry(0.045, 0.038, 0.27, 10);
  const handGeo = new THREE.SphereGeometry(0.05, 12, 10);

  const makeArm = (s) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.2 * s * bw, 1.36, 0);
    const upper = new THREE.Mesh(upperGeo, mShirt);
    upper.position.y = -0.145;
    pivot.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.29;
    const fore = new THREE.Mesh(foreGeo, mShirt);
    fore.position.y = -0.135;
    elbow.add(fore);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), mShirtD);
    cuff.position.y = -0.262;
    elbow.add(cuff);
    const hand = new THREE.Mesh(handGeo, mSkin);
    hand.scale.set(1, 1.12, 0.72);
    hand.position.y = -0.3;
    elbow.add(hand);
    pivot.add(elbow);
    elbow.rotation.x = -0.16;
    pivot.rotation.z = 0.07 * s;
    g.add(pivot);
    return pivot;
  };
  const armL = makeArm(-1);
  const armR = makeArm(1);

  /* ---------- الساقان ---------- */
  const thighGeo = new THREE.CylinderGeometry(0.082, 0.068, 0.42, 12);
  const shinGeo = new THREE.CylinderGeometry(0.068, 0.052, 0.42, 12);

  const makeLeg = (s) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.098 * s * bw, 0.88, 0);
    const thigh = new THREE.Mesh(thighGeo, mPants);
    thigh.position.y = -0.21;
    pivot.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.42;
    const shin = new THREE.Mesh(shinGeo, mPants);
    shin.position.y = -0.21;
    knee.add(shin);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.075, 0.25), mShoe);
    shoe.position.set(0, -0.42, 0.045);
    knee.add(shoe);
    pivot.add(knee);
    g.add(pivot);
    return pivot;
  };
  let legL = makeLeg(-1);
  let legR = makeLeg(1);

  if (seated) {
    legL.rotation.x = -1.5; legR.rotation.x = -1.5;
    legL.children[1].rotation.x = 1.42; legR.children[1].rotation.x = 1.42;
    armL.rotation.x = -1.22; armR.rotation.x = -1.22;
    armL.children[1].rotation.x = 0.42; armR.children[1].rotation.x = 0.42;
  }

  g.userData.limbs = { armL, armR, legL, legR };
  g.userData.body = { torso, hip, seated };
  g.scale.setScalar((l.height || 1) * (o.scale || 1));
  return g;
}

const Scene3D = {
  ready: false,
  renderer: null,
  scene: null,
  camera: null,
  clock: null,
  car: null,
  wheels: [],
  carAnim: null,
  barrierPivot: null,
  barrierTarget: 0,
  barrierAngle: 0,
  barrierTimer: null,
  sirenLight: null,
  sirenTime: 0,
  searchlights: [],
  rain: null,
  rainPos: null,
  pulses: [],
  mode: 'menu',
  lookAt: null,
  plateTex: null,

  /* ---------------- التهيئة ---------------- */
  init(canvas, container) {
    if (typeof THREE === 'undefined') return false;
    try {
      this.container = container;
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.16;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x050a12);
      this.scene.fog = new THREE.FogExp2(0x07101d, 0.024);

      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 240);
      this.camera.position.set(9.4, 4.7, 9.8);
      this.camera.fov = 44;
      this.lookAt = new THREE.Vector3(0.3, 1.1, 0);
      this.camera.lookAt(this.lookAt);

      this.clock = new THREE.Clock();
      this.colliders = [];
      this.interactables = [];
      this.impacts = [];
      this.npc = null;
      this.npcAnim = { flee: false, speed: 2.4, escaped: false };
      this.onInteract = null;
      this.onShootNpc = null;
      this.onNpcEscape = null;

      this.buildLights();
      this.buildSky();
      this.buildGround();
      this.buildProps();
      this.buildRain();
      this.resize();

      if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(container);
      window.addEventListener('resize', () => this.resize());

      this.animate();
      this.ready = true;
      return true;
    } catch (e) {
      return false;
    }
  },

  resize() {
    if (!this.renderer) return;
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  },

  setMode(m) {
    this.mode = m;
  },

  /* ---------------- الإضاءة ---------------- */
  buildLights() {
    const hemi = new THREE.HemisphereLight(0x466c9c, 0x080d14, 1.05);
    this.scene.add(hemi);

    const moon = new THREE.DirectionalLight(0xb2ccff, 1.35);
    moon.position.set(-10, 15, 9);
    moon.castShadow = true;
    moon.shadow.mapSize.set(1024, 1024);
    const sc = moon.shadow.camera;
    sc.left = -15; sc.right = 15; sc.top = 15; sc.bottom = -15; sc.near = 1; sc.far = 45;
    moon.shadow.bias = -0.0006;
    this.scene.add(moon);

    const s1 = new THREE.SpotLight(0xc6e6ff, 2.4, 40, 0.44, 0.5, 1.3);
    s1.position.set(-7.5, 9, -5.5);
    s1.target.position.set(0, 0, 0);
    s1.castShadow = true;
    s1.shadow.mapSize.set(1024, 1024);
    this.scene.add(s1);
    this.scene.add(s1.target);
    this.searchlights.push({ light: s1, base: s1.position.clone(), phase: 0 });

    const s2 = new THREE.SpotLight(0xffd8a8, 1.7, 34, 0.5, 0.6, 1.4);
    s2.position.set(7.8, 7.6, -6.4);
    s2.target.position.set(1, 0, 0.6);
    this.scene.add(s2);
    this.scene.add(s2.target);
    this.searchlights.push({ light: s2, base: s2.position.clone(), phase: 1.7 });

    const warm = new THREE.PointLight(0xffb469, 1.5, 10, 2);
    warm.position.set(4.2, 2.2, -3.4);
    this.scene.add(warm);

    this.sirenLight = new THREE.PointLight(0xff2a44, 0, 12, 2);
    this.sirenLight.position.set(0, 2.6, 0);
    this.scene.add(this.sirenLight);
  },

  skyTexture() {
    const c = document.createElement('canvas');
    c.width = 12; c.height = 256;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#04070e');
    g.addColorStop(0.35, '#081422');
    g.addColorStop(0.55, '#123048');
    g.addColorStop(0.68, '#2a5872');
    g.addColorStop(0.76, '#12283a');
    g.addColorStop(1, '#04070c');
    x.fillStyle = g;
    x.fillRect(0, 0, 12, 256);
    for (let i = 0; i < 80; i++) {
      x.fillStyle = 'rgba(200,225,255,' + (Math.random() * 0.55).toFixed(2) + ')';
      x.fillRect(Math.random() * 12, Math.random() * 90, 1, 1);
    }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  },

  envTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 128);
    g.addColorStop(0, '#050912');
    g.addColorStop(0.5, '#123047');
    g.addColorStop(0.62, '#2c5a76');
    g.addColorStop(0.7, '#0b1622');
    g.addColorStop(1, '#04070b');
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 128);
    const blobs = [[40, 46, 26, '#cfeaff'], [150, 38, 20, '#ffd9a8'], [214, 52, 16, '#aee0ff']];
    blobs.forEach((b) => {
      const rg = x.createRadialGradient(b[0], b[1], 1, b[0], b[1], b[2]);
      rg.addColorStop(0, b[3]);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = rg;
      x.beginPath();
      x.arc(b[0], b[1], b[2], 0, Math.PI * 2);
      x.fill();
    });
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.mapping = THREE.EquirectangularReflectionMapping;
    return t;
  },

  buildSky() {
    const sky = this.skyTexture();
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(95, 32, 20),
      new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide, fog: false, depthWrite: false })
    );
    this.scene.add(dome);

    try {
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      pmrem.compileEquirectangularShader();
      const rt = pmrem.fromEquirectangular(this.envTexture());
      this.scene.environment = rt.texture;
    } catch (e) { /* ignore */ }
  },

  /* ---------------- الأرض ---------------- */
  asphaltTexture(repeat) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = '#11151b';
    x.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 12000; i++) {
      const g = 16 + Math.random() * 46;
      x.fillStyle = 'rgba(' + Math.round(g) + ',' + Math.round(g + 3) + ',' + Math.round(g + 9) + ',' + (0.25 + Math.random() * 0.4).toFixed(2) + ')';
      x.fillRect(Math.random() * 512, Math.random() * 512, 1.6, 1.6);
    }
    for (let i = 0; i < 20; i++) {
      x.strokeStyle = 'rgba(0,0,0,.25)';
      x.lineWidth = 1 + Math.random() * 2;
      x.beginPath();
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      x.moveTo(sx, sy);
      x.lineTo(sx + Math.random() * 120 - 60, sy + Math.random() * 120 - 60);
      x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.encoding = THREE.sRGBEncoding;
    return t;
  },

  roadTexture() {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#161a20';
    x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 9000; i++) {
      const g = 20 + Math.random() * 40;
      x.fillStyle = 'rgba(' + Math.round(g) + ',' + Math.round(g + 2) + ',' + Math.round(g + 7) + ',.5)';
      x.fillRect(Math.random() * 512, Math.random() * 256, 1.5, 1.5);
    }
    x.fillStyle = 'rgba(220,228,238,.75)';
    x.fillRect(0, 12, 512, 4);
    x.fillRect(0, 240, 512, 4);
    x.fillStyle = 'rgba(240,214,120,.8)';
    for (let i = 0; i < 3; i++) x.fillRect(i * 170 + 20, 124, 96, 6);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 1);
    t.encoding = THREE.sRGBEncoding;
    return t;
  },

  buildGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(150, 150),
      new THREE.MeshStandardMaterial({ map: this.asphaltTexture(14), roughness: 0.62, metalness: 0.35 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 10.5),
      new THREE.MeshStandardMaterial({ map: this.roadTexture(), roughness: 0.38, metalness: 0.55 })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.012;
    road.receiveShadow = true;
    this.scene.add(road);

    const stop = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 10.2),
      new THREE.MeshStandardMaterial({ color: 0xdde7f2, roughness: 0.7 })
    );
    stop.rotation.x = -Math.PI / 2;
    stop.position.set(2.55, 0.02, 0);
    this.scene.add(stop);
  },

  /* ---------------- المنشآت ---------------- */
  stripeTexture() {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 32;
    const x = c.getContext('2d');
    x.fillStyle = '#f2f5f9';
    x.fillRect(0, 0, 256, 32);
    x.fillStyle = '#d8352f';
    for (let i = -32; i < 260; i += 46) {
      x.beginPath();
      x.moveTo(i, 0);
      x.lineTo(i + 23, 0);
      x.lineTo(i + 55, 32);
      x.lineTo(i + 32, 32);
      x.closePath();
      x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(6, 1);
    t.encoding = THREE.sRGBEncoding;
    return t;
  },

  chainTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    x.clearRect(0, 0, 64, 64);
    x.strokeStyle = 'rgba(150,170,190,.85)';
    x.lineWidth = 2.4;
    for (let i = -64; i < 128; i += 16) {
      x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 64, 64); x.stroke();
      x.beginPath(); x.moveTo(i + 64, 0); x.lineTo(i, 64); x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(24, 3);
    return t;
  },

  windowTexture() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#0a0f16';
    x.fillRect(0, 0, 128, 256);
    for (let r = 0; r < 22; r++) {
      for (let col = 0; col < 7; col++) {
        if (Math.random() < 0.42) {
          const warm = Math.random() < 0.6;
          x.fillStyle = warm ? 'rgba(255,196,120,.85)' : 'rgba(160,210,255,.7)';
          x.fillRect(6 + col * 17, 8 + r * 11, 9, 6);
        }
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  },

  buildProps() {
    /* كشك الحارس */
    const booth = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b3a48, roughness: 0.82, metalness: 0.16 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.6, 2.3), wallMat);
    body.position.y = 1.3;
    body.castShadow = true;
    body.receiveShadow = true;
    booth.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.2, 2.7), new THREE.MeshStandardMaterial({ color: 0x151e28, roughness: 0.7, metalness: 0.4 }));
    roof.position.y = 2.72;
    roof.castShadow = true;
    booth.add(roof);

    const winMat = new THREE.MeshStandardMaterial({ color: 0xffd39a, emissive: 0xffab4d, emissiveIntensity: 1.15, roughness: 0.3 });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.05), winMat);
    win.position.set(0, 1.72, 1.17);
    booth.add(win);
    const win2 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.05), winMat);
    win2.rotation.y = -Math.PI / 2;
    win2.position.set(-1.37, 1.72, 0);
    booth.add(win2);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.18, 0.06), new THREE.MeshStandardMaterial({ color: 0x0d151d, roughness: 0.6 }));
    frame.position.set(0, 1.72, 1.19);
    booth.add(frame);

    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.9), new THREE.MeshStandardMaterial({ color: 0x1b2937, roughness: 0.7 }));
    door.rotation.y = Math.PI;
    door.position.set(0, 0.98, -1.17);
    booth.add(door);

    booth.position.set(4.5, 0, -4.4);
    booth.rotation.y = 0.14;
    this.scene.add(booth);

    /* حاجز البوابة */
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.17, 1.1, 18),
      new THREE.MeshStandardMaterial({ color: 0x2b3745, metalness: 0.7, roughness: 0.35 })
    );
    post.position.set(4.25, 0.55, 3.95);
    post.castShadow = true;
    this.scene.add(post);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.12, 20), new THREE.MeshStandardMaterial({ color: 0x1a232e, roughness: 0.8 }));
    base.position.set(4.25, 0.06, 3.95);
    this.scene.add(base);

    this.barrierPivot = new THREE.Group();
    this.barrierPivot.position.set(4.25, 1.02, 3.95);
    const armMat = new THREE.MeshStandardMaterial({ map: this.stripeTexture(), roughness: 0.5, metalness: 0.25 });
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 5.6), armMat);
    arm.position.set(0, 0, -2.8);
    arm.castShadow = true;
    this.barrierPivot.add(arm);
    const counter = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.6), new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.8 }));
    counter.position.set(0, -0.12, 0.28);
    this.barrierPivot.add(counter);
    this.scene.add(this.barrierPivot);

    /* أقماع */
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xff6a2a, roughness: 0.6, emissive: 0x2a0a00, emissiveIntensity: 0.5 });
    const coneBaseMat = new THREE.MeshStandardMaterial({ color: 0x14191f, roughness: 0.9 });
    [[-1.1, 3.5], [1.7, 4.0], [-4.2, -3.4], [5.2, 3.9]].forEach((p) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 18), coneMat);
      cone.position.set(p[0], 0.36, p[1]);
      cone.castShadow = true;
      this.scene.add(cone);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.52), coneBaseMat);
      b.position.set(p[0], 0.03, p[1]);
      this.scene.add(b);
    });

    /* سياج خلفي */
    const fence = new THREE.Mesh(
      new THREE.PlaneGeometry(56, 3.2),
      new THREE.MeshStandardMaterial({ map: this.chainTexture(), transparent: true, alphaTest: 0.25, side: THREE.DoubleSide, roughness: 0.7, metalness: 0.5 })
    );
    fence.position.set(0, 1.6, -9.6);
    this.scene.add(fence);
    for (let x = -27; x <= 27; x += 6.2) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.3, 8), new THREE.MeshStandardMaterial({ color: 0x27323d, metalness: 0.6, roughness: 0.5 }));
      p.position.set(x, 1.65, -9.6);
      this.scene.add(p);
    }

    /* أبنية بعيدة */
    const winTex = this.windowTexture();
    for (let i = 0; i < 9; i++) {
      const h = rnd(6, 17);
      const w = rnd(4, 9);
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, 4),
        new THREE.MeshStandardMaterial({ color: 0x0a1017, roughness: 0.9, emissiveMap: winTex, emissive: 0xffffff, emissiveIntensity: 0.9 })
      );
      b.position.set(-34 + i * 8.5 + rnd(-2, 2), h / 2 - 0.2, -26 - rnd(0, 9));
      this.scene.add(b);
    }

    /* عمود إضاءة */
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x232e39, metalness: 0.7, roughness: 0.45 });
    [[-8, 5.5], [8.5, -6]].forEach((p) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6.4, 10), poleMat);
      pole.position.set(p[0], 3.2, p[1]);
      pole.castShadow = true;
      this.scene.add(pole);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.4), new THREE.MeshStandardMaterial({ color: 0xfff0c8, emissive: 0xffd9a0, emissiveIntensity: 2.2 }));
      head.position.set(p[0], 6.35, p[1]);
      head.rotation.y = p[0] < 0 ? 0.5 : -0.5;
      this.scene.add(head);
    });

    /* لوحة */
    const signC = document.createElement('canvas');
    signC.width = 512; signC.height = 160;
    const sx = signC.getContext('2d');
    sx.fillStyle = '#0c1a26';
    sx.fillRect(0, 0, 512, 160);
    sx.strokeStyle = '#3ea6ff';
    sx.lineWidth = 8;
    sx.strokeRect(8, 8, 496, 144);
    sx.fillStyle = '#cfe8ff';
    sx.font = 'bold 64px Tahoma, sans-serif';
    sx.textAlign = 'center';
    sx.textBaseline = 'middle';
    sx.fillText('نقطة تفتيش', 256, 66);
    sx.font = 'bold 34px Tahoma, sans-serif';
    sx.fillStyle = '#7fbdf0';
    sx.fillText('CHECKPOINT', 256, 118);
    const signTex = new THREE.CanvasTexture(signC);
    signTex.encoding = THREE.sRGBEncoding;
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1), new THREE.MeshStandardMaterial({ map: signTex, emissive: 0x1c3550, emissiveIntensity: 0.6, roughness: 0.6 }));
    sign.position.set(-5.2, 3.6, -8.4);
    sign.rotation.y = 0.22;
    this.scene.add(sign);

    /* مكتب ومراقبة داخل الكشك */
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.7), new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.7, metalness: 0.3 }));
    desk.position.set(4.35, 1.02, -3.55);
    this.scene.add(desk);

    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.06), new THREE.MeshStandardMaterial({ color: 0x0b1119, roughness: 0.5, metalness: 0.4 }));
    monitor.position.set(4.35, 1.32, -3.62);
    monitor.rotation.x = -0.08;
    this.scene.add(monitor);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.35), new THREE.MeshStandardMaterial({ color: 0x8fd6ff, emissive: 0x3fa9ff, emissiveIntensity: 1.4, roughness: 0.3 }));
    screen.position.set(4.35, 1.32, -3.585);
    screen.rotation.x = -0.08;
    this.scene.add(screen);

    this.staticColliders = [
      { minX: 3.05, maxX: 5.95, minZ: -5.7, maxZ: -3.2 },
      { minX: 4.0, maxX: 4.5, minZ: 3.7, maxZ: 4.2 },
      { minX: -11, maxX: -9.4, minZ: -9.6, maxZ: 7.6 },
      { minX: -12, maxX: 10, minZ: -10.4, maxZ: -9.35 },
    ];
    this.colliders = this.staticColliders.slice();
  },

  buildRain() {
    const n = 1100;
    const geom = new THREE.BufferGeometry();
    this.rainPos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      this.rainPos[i * 3] = rnd(-24, 24);
      this.rainPos[i * 3 + 1] = rnd(0, 18);
      this.rainPos[i * 3 + 2] = rnd(-18, 18);
    }
    geom.setAttribute('position', new THREE.BufferAttribute(this.rainPos, 3));
    const mat = new THREE.PointsMaterial({ color: 0xbfe0ff, size: 0.055, transparent: true, opacity: 0.55, depthWrite: false });
    this.rain = new THREE.Points(geom, mat);
    this.rain.frustumCulled = false;
    this.scene.add(this.rain);
  },

  /* ---------------- السيارة ---------------- */
  plateTexture(num) {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 80;
    const x = c.getContext('2d');
    x.fillStyle = '#eef3f9';
    x.fillRect(0, 0, 256, 80);
    x.strokeStyle = '#16202c';
    x.lineWidth = 7;
    x.strokeRect(4, 4, 248, 72);
    x.fillStyle = '#13202e';
    x.font = 'bold 46px Tahoma, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(String(num), 128, 44);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  },

  makeWheel(r, width) {
    const spinner = new THREE.Group();
    const rubber = new THREE.MeshStandardMaterial({ color: 0x07090c, roughness: 0.96, metalness: 0.04 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xb8c4d2, metalness: 0.95, roughness: 0.24, envMapIntensity: 1.4 });

    const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, width, 26), rubber);
    tire.rotation.x = Math.PI / 2;
    tire.castShadow = true;
    spinner.add(tire);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, width + 0.02, 22), rimMat);
    rim.rotation.x = Math.PI / 2;
    spinner.add(rim);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, width + 0.06, 14), rimMat);
    hub.rotation.x = Math.PI / 2;
    spinner.add(hub);

    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(r * 0.16, r * 1.12, width * 0.12), rimMat);
      spoke.rotation.z = (i / 5) * Math.PI * 2;
      spoke.position.z = width * 0.5;
      spinner.add(spoke);
    }
    return spinner;
  },

  makeCar(model) {
    const type = model.type === 'suv' || model.type === 'truck' ? model.type : 'sedan';
    const cfg = CAR_CFG[type];
    const grp = new THREE.Group();
    grp.userData.wheels = [];

    const paint = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(model.color || '#dfe6ee'),
      metalness: 0.62, roughness: 0.3, clearcoat: 0.85, clearcoatRoughness: 0.14, envMapIntensity: 1.25,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: 0x0a141d, metalness: 0.3, roughness: 0.06, transparent: true, opacity: 0.62,
      clearcoat: 1, envMapIntensity: 1.8,
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0c1116, roughness: 0.8, metalness: 0.25 });
    const chrome = new THREE.MeshStandardMaterial({ color: 0xc6d0dc, metalness: 0.95, roughness: 0.18, envMapIntensity: 1.5 });
    const lampW = new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff0b0, emissiveIntensity: 2.6, roughness: 0.35 });
    const lampR = new THREE.MeshStandardMaterial({ color: 0xff3344, emissive: 0xff1226, emissiveIntensity: 2.2, roughness: 0.35 });

    const shape = type === 'suv' ? suvShape() : type === 'truck' ? truckShape() : sedanShape();
    const bodyGeo = new THREE.ExtrudeGeometry(shape, {
      depth: cfg.width - 0.12, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 3, curveSegments: 16,
    });
    bodyGeo.translate(0, 0, -(cfg.width - 0.12) / 2);
    const body = new THREE.Mesh(bodyGeo, paint);
    body.castShadow = true;
    body.receiveShadow = true;
    grp.add(body);

    /* القمرة والزجاج */
    const g = cfg.glass;
    const gs = new THREE.Shape();
    gs.moveTo(g.x0, g.yB);
    gs.lineTo(g.x3, g.yT);
    gs.lineTo(g.x2, g.yT);
    gs.lineTo(g.x1, g.yB);
    gs.closePath();
    const gGeo = new THREE.ExtrudeGeometry(gs, {
      depth: g.width - 0.1, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2, curveSegments: 8,
    });
    gGeo.translate(0, 0, -(g.width - 0.1) / 2);
    const cabin = new THREE.Mesh(gGeo, glass);
    cabin.castShadow = true;
    grp.add(cabin);

    const roofW = Math.abs(g.x2 - g.x3) + 0.14;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.07, g.width * 0.98), paint);
    roof.position.set((g.x2 + g.x3) / 2, g.yT + 0.01, 0);
    roof.castShadow = true;
    grp.add(roof);

    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.09, g.yT - g.yB, g.width * 0.98), paint);
    pillar.position.set((g.x0 + g.x1) / 2 + (g.x2 - g.x3) * 0.12, (g.yB + g.yT) / 2, 0);
    grp.add(pillar);

    /* مصابيح */
    const head1 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.14, 0.4), lampW);
    head1.position.set(cfg.head.x, cfg.head.y, 0.58);
    grp.add(head1);
    const head2 = head1.clone();
    head2.position.z = -0.58;
    grp.add(head2);

    const tail1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.36), lampR);
    tail1.position.set(cfg.tail.x, cfg.tail.y, 0.62);
    grp.add(tail1);
    const tail2 = tail1.clone();
    tail2.position.z = -0.62;
    grp.add(tail2);

    /* شبك ومصدات */
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.9), darkMat);
    grille.position.set(cfg.front - 0.02, cfg.head.y - 0.06, 0);
    grp.add(grille);

    const bumperF = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, cfg.width * 0.92), chrome);
    bumperF.position.set(cfg.front - 0.06, 0.5, 0);
    grp.add(bumperF);
    const bumperR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, cfg.width * 0.92), chrome);
    bumperR.position.set(cfg.rear + 0.06, 0.5, 0);
    grp.add(bumperR);

    /* لوحة الأرقام */
    const plateMat = new THREE.MeshStandardMaterial({ map: this.plateTexture(model.plate || '00000'), roughness: 0.6, metalness: 0.1 });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.16), plateMat);
    plate.rotation.y = Math.PI / 2;
    plate.position.set(cfg.plate.x, cfg.plate.y, 0);
    grp.add(plate);

    /* مرايا وأبواب */
    const mirror1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.16), paint);
    mirror1.position.set(g.x1 - 0.06, g.yB + 0.06, cfg.width * 0.5);
    grp.add(mirror1);
    const mirror2 = mirror1.clone();
    mirror2.position.z = -cfg.width * 0.5;
    grp.add(mirror2);

    const handle1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.05), chrome);
    handle1.position.set(cfg.door.x, cfg.door.y, cfg.width * 0.5 - 0.01);
    grp.add(handle1);
    const handle2 = handle1.clone();
    handle2.position.z = -cfg.width * 0.5 + 0.01;
    grp.add(handle2);

    if (type === 'truck') {
      const bed = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, cfg.width * 0.78), darkMat);
      bed.position.set(-1.8, 1.16, 0);
      grp.add(bed);
    }

    /* السائق — نفس ملامح صورة الهوية */
    const driverScale = 0.95;
    const driver = buildPerson(model.look, { seated: true, scale: driverScale });
    driver.position.set(-0.42, (g.yB + 0.255) - 1.55 * driver.scale.y, -0.34);
    driver.rotation.y = Math.PI / 2;
    grp.add(driver);

    const wheelSteer = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 8, 20), darkMat);
    wheelSteer.rotation.y = Math.PI / 2;
    wheelSteer.rotation.x = 0.35;
    wheelSteer.position.set(g.x1 - 0.42, g.yB + 0.2, 0);
    grp.add(wheelSteer);

    /* العجلات */
    cfg.wheelX.forEach((wx) => {
      [cfg.wheelZ, -cfg.wheelZ].forEach((wz) => {
        const spin = this.makeWheel(cfg.wheelR, 0.24);
        spin.position.set(wx, cfg.wheelY, wz);
        grp.add(spin);
        grp.userData.wheels.push(spin);
      });
    });

    return grp;
  },

  disposeGroup(g) {
    if (!g) return;
    g.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (m.map && m.map.dispose) m.map.dispose();
          m.dispose();
        });
      }
    });
  },

  setCar(model) {
    if (!this.ready) return;
    if (this.car) {
      this.scene.remove(this.car);
      this.disposeGroup(this.car);
      this.car = null;
    }
    this.wheels = [];
    this.look = model.look || null;
    const car = this.makeCar(model);
    car.position.set(-15, 0, 0);
    this.scene.add(car);
    this.car = car;
    this.wheels = car.userData.wheels;
    this.carAnim = { phase: 'in', t: 0, dur: 1.8, from: -15, to: 0 };
    Sfx.engineStart();

    this.colliders = (this.staticColliders || []).concat([{ minX: -2.55, maxX: 2.55, minZ: -1.15, maxZ: 1.15 }]);

    this.spawnNpc();
  },

  /* ---------------- السائق (NPC) ---------------- */
  spawnNpc() {
    if (this.npc) {
      this.scene.remove(this.npc);
      this.disposeGroup(this.npc);
      this.npc = null;
    }
    const g = buildPerson(this.look, {});
    g.position.set(-0.85, 0, -2.1);
    g.rotation.y = 1.9;
    this.scene.add(g);
    this.npc = g;
    this.npcAnim.flee = false;
    this.npcAnim.escaped = false;
  },

  startFlee() {
    if (!this.npc) return;
    this.npcAnim.flee = true;
    Sfx.tone(280, 0.3, 'square', 0.07, 180);
  },

  updateNpc(dt) {
    if (!this.npc) return;
    const a = this.npcAnim;
    const limbs = this.npc.userData.limbs;
    if (a.flee) {
      const target = new THREE.Vector3(9.2, 0, 0.6);
      const dir = target.clone().sub(this.npc.position);
      dir.y = 0;
      const dist = dir.length();
      if (dist > 0.5) {
        dir.normalize();
        this.npc.position.addScaledVector(dir, a.speed * dt);
        this.npc.rotation.y = Math.atan2(dir.x, dir.z);
        const ph = performance.now() * 0.02;
        limbs.legL.rotation.x = Math.sin(ph) * 0.9;
        limbs.legR.rotation.x = -Math.sin(ph) * 0.9;
        limbs.armL.rotation.x = -Math.sin(ph) * 0.8;
        limbs.armR.rotation.x = Math.sin(ph) * 0.8;
        this.npc.position.y = Math.abs(Math.sin(ph)) * 0.05;
      } else if (!a.escaped) {
        a.escaped = true;
        a.flee = false;
        if (this.onNpcEscape) this.onNpcEscape();
      }
    } else {
      const ph = performance.now() * 0.001;
      limbs.legL.rotation.x *= 0.9;
      limbs.legR.rotation.x *= 0.9;
      limbs.armL.rotation.x *= 0.9;
      limbs.armR.rotation.x *= 0.9;
      this.npc.position.y = 0;
      if (this.mode === 'play' && this.camera) {
        const dx = this.camera.position.x - this.npc.position.x;
        const dz = this.camera.position.z - this.npc.position.z;
        const want = Math.atan2(dx, dz);
        let diff = want - this.npc.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        this.npc.rotation.y += diff * Math.min(1, dt * 3);
      }
      this.npc.rotation.z = Math.sin(ph * 1.4) * 0.006;
    }
  },

  getInteractables() {
    if (!this.car) return [];
    const list = [];
    if (this.npc && this.npc.visible) {
      list.push({
        id: this.npcAnim.flee ? 'chase' : 'driver',
        point: new THREE.Vector3(this.npc.position.x, 1.15, this.npc.position.z),
        radius: this.npcAnim.flee ? 2.6 : 3.2,
        label: this.npcAnim.flee ? 'أمسك بالهارب' : 'تحدّث مع السائق',
      });
    }
    list.push({ id: 'trunk', point: new THREE.Vector3(this.car.position.x - 2.6, 0.9, this.car.position.z), radius: 2.4, label: 'افتح الصندوق' });
    list.push({ id: 'hood', point: new THREE.Vector3(this.car.position.x + 2.6, 0.95, this.car.position.z), radius: 2.2, label: 'افحص المحرك' });
    list.push({ id: 'computer', point: new THREE.Vector3(4.4, 1.35, -3.1), radius: 3.0, label: 'استخدم جهاز التفتيش' });
    return list;
  },

  handleInteract(id) {
    if (this.onInteract) this.onInteract(id);
  },

  shoot() {
    if (!this.camera) return false;
    const origin = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    if (this.npc && this.npc.visible) {
      const c = this.npc.position.clone();
      c.y = 1.05;
      const to = c.clone().sub(origin);
      const proj = to.dot(dir);
      if (proj > 0.2) {
        const closest = origin.clone().addScaledVector(dir, proj);
        if (closest.distanceTo(c) < 0.6) {
          this.spawnImpact(closest, true);
          if (this.onShootNpc) this.onShootNpc();
          return true;
        }
      }
    }

    if (dir.y < -0.02) {
      const tt = -origin.y / dir.y;
      const p = origin.clone().addScaledVector(dir, tt);
      if (p.length() < 45) this.spawnImpact(p, false);
    } else {
      const p = origin.clone().addScaledVector(dir, 18);
      this.spawnImpact(p, false);
    }
    return false;
  },

  spawnImpact(point, onNpc) {
    const geo = new THREE.SphereGeometry(onNpc ? 0.11 : 0.05, 8, 6);
    const mat = new THREE.MeshBasicMaterial({ color: onNpc ? 0xff2f43 : 0xffd28a, transparent: true, opacity: 1 });
    const m = new THREE.Mesh(geo, mat);
    m.position.copy(point);
    this.scene.add(m);
    this.impacts.push({ mesh: m, t: 0 });
  },

  updateImpacts(dt) {
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const im = this.impacts[i];
      im.t += dt;
      const k = im.t / 0.5;
      im.mesh.scale.setScalar(1 + k * 2.2);
      im.mesh.material.opacity = Math.max(0, 1 - k);
      if (k >= 1) {
        this.scene.remove(im.mesh);
        im.mesh.geometry.dispose();
        im.mesh.material.dispose();
        this.impacts.splice(i, 1);
      }
    }
  },

  clearCar() {
    if (this.car) {
      this.scene.remove(this.car);
      this.disposeGroup(this.car);
      this.car = null;
    }
    if (this.npc) {
      this.scene.remove(this.npc);
      this.disposeGroup(this.npc);
      this.npc = null;
    }
    this.carAnim = null;
    if (typeof Sfx !== 'undefined') Sfx.engineStop(0.4);
  },

  driveAway() {
    if (!this.car) return;
    if (this.npc) this.npc.visible = false;
    const x = this.car.position.x;
    this.carAnim = { phase: 'out', t: 0, dur: 1.7, from: x, to: 17 };
    Sfx.engineRev();
    this.liftBarrier(1900);
  },

  liftBarrier(ms) {
    this.barrierTarget = 1;
    Sfx.barrier();
    clearTimeout(this.barrierTimer);
    this.barrierTimer = setTimeout(() => { this.barrierTarget = 0; Sfx.barrier(); }, ms || 1600);
  },

  pulse() {
    if (!this.ready) return;
    const geo = new THREE.RingGeometry(0.9, 1.05, 48);
    const mat = new THREE.MeshBasicMaterial({ color: 0x66d8ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.04, 0);
    this.scene.add(ring);
    this.pulses.push({ mesh: ring, t: 0 });
  },

  flashSiren(dur) {
    this.sirenTime = dur || 1.1;
  },

  /* ---------------- الحلقة ---------------- */
  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.renderer) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    /* الكاميرا */
    const playing = this.mode === 'play' && typeof Player !== 'undefined' && Player.active;
    if (playing) {
      Player.update(dt);
    } else {
      const basePos = { x: 9.4, y: 4.7, z: 9.8 };
      const look = { x: 0.3, y: 1.15, z: 0 };
      const tx = basePos.x + Math.sin(t * 0.2) * 1.2;
      const tz = basePos.z + Math.cos(t * 0.17) * 0.84;
      const ty = basePos.y + Math.sin(t * 0.45) * 0.09;
      this.camera.fov = 44;
      this.camera.position.x += (tx - this.camera.position.x) * Math.min(1, dt * 1.6);
      this.camera.position.y += (ty - this.camera.position.y) * Math.min(1, dt * 1.6);
      this.camera.position.z += (tz - this.camera.position.z) * Math.min(1, dt * 1.6);
      this.lookAt.x += (look.x - this.lookAt.x) * Math.min(1, dt * 1.6);
      this.lookAt.y += (look.y - this.lookAt.y) * Math.min(1, dt * 1.6);
      this.lookAt.z += (look.z - this.lookAt.z) * Math.min(1, dt * 1.6);
      this.camera.lookAt(this.lookAt);
    }
    /* لا يتحرك السائق هرباً وأنت داخل قائمة أو نافذة */
    const uiOpen = !!document.querySelector('#modalRoot.open') ||
      !!(document.getElementById('inspect') && document.getElementById('inspect').classList.contains('open'));
    this.uiFrozen = uiOpen;
    /* الهارب لا يتقدّم إلا وأنت ماسك الماوس فعلياً (ما عدا القوائم) */
    const noControl = typeof Player !== 'undefined' && Player.active && !Player.locked;
    if (!uiOpen && !(noControl && this.npcAnim.flee)) this.updateNpc(dt);
    this.updateImpacts(dt);

    /* السيارة */
    if (this.car && this.carAnim) {
      this.carAnim.t += dt;
      const p = Math.min(1, this.carAnim.t / this.carAnim.dur);
      const e = this.carAnim.phase === 'in' ? 1 - Math.pow(1 - p, 3) : Math.pow(p, 2.0);
      const x = this.carAnim.from + (this.carAnim.to - this.carAnim.from) * e;
      this.car.position.x = x;
      const spin = this.carAnim.phase === 'in' ? (1 - e) * 0.6 + 0.05 : 0.35 + e * 1.4;
      this.wheels.forEach((w) => { w.rotation.z -= dt * spin * 9; });
      this.car.position.y = Math.sin(t * 22) * 0.006 * (this.carAnim.phase === 'in' ? (1 - e) : 0);
      if (p >= 1) {
        if (this.carAnim.phase === 'in') {
          this.carAnim = null;
          this.car.position.y = 0;
          Sfx.engineIdle();
        } else {
          this.carAnim = null;
        }
      }
    }

    /* الحاجز */
    this.barrierAngle += (this.barrierTarget - this.barrierAngle) * Math.min(1, dt * 4.5);
    if (this.barrierPivot) this.barrierPivot.rotation.x = this.barrierAngle * 1.42;

    /* الكشافات */
    this.searchlights.forEach((s, i) => {
      s.light.position.x = s.base.x + Math.sin(t * 0.32 + s.phase) * 1.6;
      s.light.target.position.x = Math.sin(t * 0.22 + s.phase) * 2.4;
      s.light.target.position.z = Math.cos(t * 0.18 + i) * 1.4;
      s.light.target.updateMatrixWorld();
    });

    /* صفارة */
    if (this.sirenTime > 0) {
      this.sirenTime -= dt;
      this.sirenLight.intensity = (Math.sin(t * 20) * 0.5 + 0.9) * 5.5 * Math.min(1, Math.max(0, this.sirenTime * 1.6));
      this.sirenLight.color.setHex(Math.sin(t * 20) > 0 ? 0xff2a44 : 0x2a44ff);
    } else if (this.sirenLight) {
      this.sirenLight.intensity = 0;
    }

    /* نبضات الفحص */
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.t += dt;
      const k = p.t / 0.9;
      p.mesh.scale.setScalar(1 + k * 5);
      p.mesh.material.opacity = Math.max(0, 0.85 * (1 - k));
      if (k >= 1) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.pulses.splice(i, 1);
      }
    }

    /* المطر */
    if (this.rain) {
      const arr = this.rain.geometry.attributes.position.array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] -= dt * 11;
        arr[i] -= dt * 1.2;
        if (arr[i + 1] < 0) {
          arr[i + 1] = 17;
          arr[i] = rnd(-24, 24);
          arr[i + 2] = rnd(-18, 18);
        }
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  },
};
