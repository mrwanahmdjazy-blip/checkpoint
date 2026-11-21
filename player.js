'use strict';

/* =========================================================
   تحكم اللاعب: منظور أول، مشي، تفاعل، مسدس
   ========================================================= */

const Player = {
  active: false,
  paused: false,
  camera: null,
  canvas: null,
  scene: null,

  pos: null,
  vel: null,
  yaw: 0,
  pitch: 0,
  keys: {},
  eyeH: 1.68,
  radius: 0.34,
  bob: 0,
  stepPhase: 0,

  target: null,
  locked: false,

  gun: null,
  drawn: false,
  ammo: 12,
  ammoMax: 12,
  reloading: false,
  aim: false,
  recoil: 0,
  shake: 0,
  sway: null,

  init(camera, canvas, scene) {
    this.camera = camera;
    this.canvas = canvas;
    this.scene = scene;
    this.pos = new THREE.Vector3(3.4, 0, 3.4);
    this.vel = new THREE.Vector3();
    camera.rotation.order = 'YXZ';
    if (camera.parent !== scene) scene.add(camera);
    this.buildGun(camera);
    this.bind();
    this.snapCamera();
    this.updateHud();
  },

  /* ---------------- المسدس ---------------- */
  buildGun(camera) {
    const g = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: 0x6b7684, metalness: 0.9, roughness: 0.3, envMapIntensity: 1.8 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x3a434d, metalness: 0.8, roughness: 0.45, envMapIntensity: 1.4 });
    const grip = new THREE.MeshStandardMaterial({ color: 0x3b2f28, roughness: 0.85, metalness: 0.2 });

    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.085, 0.33), steel);
    slide.position.set(0, 0.02, -0.1);
    g.add(slide);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.055, 0.24), dark);
    frame.position.set(0, -0.045, -0.05);
    g.add(frame);

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.09, 12), steel);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.29);
    g.add(barrel);

    const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.2, 0.1), grip);
    gripMesh.position.set(0, -0.14, 0.03);
    gripMesh.rotation.x = -0.28;
    g.add(gripMesh);

    const handMat = new THREE.MeshStandardMaterial({ color: 0xb5825c, roughness: 0.8 });
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.15), handMat);
    hand.position.set(0, -0.2, 0.07);
    hand.rotation.x = -0.3;
    g.add(hand);

    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.16, 0.1), new THREE.MeshStandardMaterial({ color: 0x1d2b3c, roughness: 0.9 }));
    sleeve.position.set(0, -0.31, 0.14);
    sleeve.rotation.x = -0.5;
    g.add(sleeve);

    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 6, 14, Math.PI), dark);
    guard.rotation.x = Math.PI / 2;
    guard.rotation.z = Math.PI;
    guard.position.set(0, -0.075, -0.02);
    g.add(guard);

    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.02, 0.02), dark);
    sight.position.set(0, 0.07, 0.03);
    g.add(sight);

    const muzzle = new THREE.Group();
    muzzle.position.set(0, 0.02, -0.34);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const flash = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), flashMat);
    flash.visible = false;
    muzzle.add(flash);
    const flashLight = new THREE.PointLight(0xffcf7a, 0, 6, 2);
    muzzle.add(flashLight);
    g.add(muzzle);

    g.position.set(0.22, -0.1, -0.55);
    g.rotation.set(0.05, 0.62, -0.06);
    g.scale.setScalar(0.98);
    g.visible = false;
    camera.add(g);

    /* ضوء صغير يخص سلاح المنظور الأول */
    const vmLight = new THREE.PointLight(0xd8e9ff, 0.85, 1.8, 2);
    vmLight.position.set(0.35, 0.05, 0.35);
    camera.add(vmLight);

    this.gun = { group: g, flash, flashLight, base: g.position.clone(), baseRot: g.rotation.clone() };
    this.sway = { x: 0, y: 0 };
  },

  setDrawn(v) {
    if (!this.gun) return;
    this.drawn = !!v;
    this.gun.group.visible = this.drawn;
    const hud = document.getElementById('weaponHud');
    if (hud) hud.classList.toggle('hidden', !this.drawn);
    if (this.drawn) Sfx.draw();
    this.updateHud();
  },

  toggleDrawn() {
    if (!this.active) return;
    this.setDrawn(!this.drawn);
  },

  updateHud() {
    const a = document.getElementById('ammoLabel');
    if (a) a.textContent = this.ammo;
    const st = document.getElementById('wState');
    if (st) st.textContent = this.reloading ? 'تعبئة…' : (this.ammo === 0 ? 'فارغ — R' : '');
  },

  reload() {
    if (!this.drawn || this.reloading || this.ammo === this.ammoMax) return;
    this.reloading = true;
    Sfx.reload();
    this.updateHud();
    setTimeout(() => {
      this.ammo = this.ammoMax;
      this.reloading = false;
      this.updateHud();
    }, 1150);
  },

  shoot() {
    if (!this.active || this.paused || !this.drawn) return;
    if (this.reloading) return;
    if (this.ammo <= 0) { Sfx.dryFire(); this.reload(); return; }

    this.ammo--;
    this.updateHud();
    Sfx.gunshot();
    this.recoil = 0.055;
    this.shake = 0.6;
    if (this.gun) {
      this.gun.flash.visible = true;
      this.gun.flash.rotation.z = Math.random() * Math.PI;
      this.gun.flash.scale.setScalar(rnd(0.8, 1.3));
      this.gun.flashLight.intensity = 6;
      clearTimeout(this.flashTimer);
      this.flashTimer = setTimeout(() => {
        if (this.gun) {
          this.gun.flash.visible = false;
          this.gun.flashLight.intensity = 0;
        }
      }, 55);
    }
    if (typeof Scene3D !== 'undefined' && Scene3D.shoot) Scene3D.shoot();
    if (this.ammo === 0) this.reload();
  },

  /* ---------------- الكاميرا والحركة ---------------- */
  snapCamera() {
    if (!this.camera) return;
    this.camera.position.set(this.pos.x, this.pos.y + this.eyeH, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  },

  reset(yaw) {
    this.pos.set(3.4, 0, 3.4);
    this.vel.set(0, 0, 0);
    this.yaw = typeof yaw === 'number' ? yaw : 0.82;
    this.pitch = -0.04;
    this.ammo = this.ammoMax;
    this.reloading = false;
    this.setDrawn(false);
    this.updateHud();
    this.recoil = 0;
    this.snapCamera();
    this.updateCrosshair();
  },

  setPaused(p) {
    this.paused = !!p;
    if (this.paused) this.keys = {};
  },

  update(dt) {
    if (!this.active || !this.camera) return;

    const inModal = !!document.querySelector('#modalRoot.open');
    const busy = this.paused || inModal || document.body.classList.contains('menu-mode');

    /* النظر */
    if (!busy) {
      const speed = this.aim ? 0.0011 : 0.0019;
      this.yaw -= (this.mouseDX || 0) * speed;
      this.pitch -= (this.mouseDY || 0) * speed;
      this.pitch = clamp3(this.pitch, -1.35, 1.25);
    }
    this.mouseDX = 0;
    this.mouseDY = 0;

    /* الحركة */
    const wish = new THREE.Vector3();
    if (!busy) {
      if (this.keys['KeyW'] || this.keys['ArrowUp']) wish.z -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) wish.z += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) wish.x -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) wish.x += 1;
    }

    const sprint = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
    const speed = (sprint ? 5.4 : 3.1) * (this.aim ? 0.65 : 1);
    const moving = wish.lengthSq() > 0;

    if (moving) {
      wish.normalize();
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      const dx = wish.x * cos + wish.z * sin;
      const dz = -wish.x * sin + wish.z * cos;
      this.vel.x = dx * speed;
      this.vel.z = dz * speed;
    } else {
      this.vel.x *= Math.max(0, 1 - dt * 12);
      this.vel.z *= Math.max(0, 1 - dt * 12);
    }

    /* الجاذبية */
    this.vel.y -= 18 * dt;
    if (this.pos.y <= 0) {
      if (this.vel.y < 0) this.vel.y = 0;
      this.pos.y = 0;
      if (!busy && (this.keys['Space']) && !this.jumping) {
        this.vel.y = 4.4;
        this.jumping = true;
      }
    }
    if (this.pos.y > 0.01) this.jumping = true;
    if (this.pos.y <= 0) this.jumping = false;

    /* التصادم */
    this.moveAxis(this.vel.x * dt, 0);
    this.moveAxis(0, this.vel.z * dt);
    this.pos.y = clamp3(this.pos.y + this.vel.y * dt, 0, 6);

    /* اهتزاز المشي */
    const horiz = Math.hypot(this.vel.x, this.vel.z);
    if (horiz > 0.4 && this.pos.y < 0.05) {
      this.bob += dt * (sprint ? 13 : 9);
      this.stepPhase += dt * (sprint ? 13 : 9);
      if (this.stepPhase > Math.PI) {
        this.stepPhase -= Math.PI;
        Sfx.step();
      }
    } else {
      this.bob += dt * 2;
    }
    const bobY = Math.sin(this.bob) * (horiz > 0.4 ? 0.028 : 0.006);

    /* ارتداد السلاح */
    this.recoil += (0 - this.recoil) * Math.min(1, dt * 9);
    this.shake += (0 - this.shake) * Math.min(1, dt * 8);

    /* الكاميرا */
    this.camera.position.set(this.pos.x, this.pos.y + this.eyeH + bobY, this.pos.z);
    this.camera.rotation.set(this.pitch + this.recoil, this.yaw, 0);

    const wantFov = this.aim ? 50 : 62;
    if (Math.abs(this.camera.fov - wantFov) > 0.2) {
      this.camera.fov += (wantFov - this.camera.fov) * Math.min(1, dt * 8);
      this.camera.updateProjectionMatrix();
    }

    /* حركة المسدس */
    if (this.gun) {
      const t = performance.now() * 0.001;
      this.sway.x += ((moving ? Math.sin(this.bob * 0.5) * 0.012 : Math.sin(t * 0.9) * 0.004) - this.sway.x) * Math.min(1, dt * 6);
      this.sway.y += ((moving ? Math.cos(this.bob) * 0.01 : Math.cos(t * 0.7) * 0.004) - this.sway.y) * Math.min(1, dt * 6);
      const aimX = this.aim ? 0.03 : 0.22;
      const aimY = this.aim ? 0.02 : -0.1;
      const aimZ = this.aim ? -0.45 : -0.55;
      const g = this.gun.group;
      g.position.x += (aimX + this.sway.x - g.position.x) * Math.min(1, dt * 12);
      g.position.y += (aimY + this.sway.y - g.position.y) * Math.min(1, dt * 12);
      g.position.z += (aimZ + this.recoil * 1.6 - g.position.z) * Math.min(1, dt * 14);
      const wantRotY = this.aim ? 0.08 : 0.62;
      g.rotation.y += (wantRotY - g.rotation.y) * Math.min(1, dt * 9);
      g.rotation.x = 0.05 - this.recoil * 2.4;
    }

    /* التفاعل */
    this.updateTarget();
  },

  moveAxis(dx, dz) {
    const next = new THREE.Vector3(this.pos.x + dx, this.pos.y, this.pos.z + dz);
    const r = this.radius;
    const boxes = (typeof Scene3D !== 'undefined' && Scene3D.colliders) ? Scene3D.colliders : [];
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (next.x + r > b.minX && next.x - r < b.maxX && next.z + r > b.minZ && next.z - r < b.maxZ) {
        return;
      }
    }
    next.x = clamp3(next.x, -11, 9.2);
    next.z = clamp3(next.z, -9, 7.4);
    this.pos.x = next.x;
    this.pos.z = next.z;
  },

  forward() {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  },

  updateTarget() {
    const list = (typeof Scene3D !== 'undefined' && Scene3D.getInteractables) ? Scene3D.getInteractables() : [];
    const eye = new THREE.Vector3(this.pos.x, this.pos.y + this.eyeH, this.pos.z);
    const fwd = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    let best = null;
    let bestScore = 0.55;
    list.forEach((it) => {
      const to = new THREE.Vector3(it.point.x - eye.x, it.point.y - eye.y, it.point.z - eye.z);
      const dist = to.length();
      if (dist > it.radius) return;
      to.normalize();
      const dot = to.dot(fwd);
      if (dot < 0.35) return;
      const score = dot - dist * 0.05;
      if (score > bestScore - 0.55) {
        if (!best || score > bestScore) {
          best = it;
          bestScore = score;
        }
      }
    });

    this.target = best;
    const card = document.getElementById('driverCard');
    if (card) card.classList.toggle('show', !!best && (best.id === 'driver' || best.id === 'chase'));
    const el = document.getElementById('prompt');
    if (el) {
      if (best) {
        el.innerHTML = best.label + '<kbd>E</kbd>';
        el.classList.add('show');
      } else {
        el.classList.remove('show');
      }
    }
    this.updateCrosshair();
  },

  updateCrosshair() {
    const c = document.getElementById('crosshair');
    if (!c) return;
    c.classList.toggle('hot', !!this.target);
  },

  interact() {
    if (!this.active || this.paused) return;
    if (document.querySelector('#modalRoot.open') || document.getElementById('inspect').classList.contains('open')) return;
    if (this.target && typeof Scene3D !== 'undefined' && Scene3D.handleInteract) {
      Scene3D.handleInteract(this.target.id);
    }
  },

  /* ---------------- الإدخال ---------------- */
  bind() {
    const keyDown = (e) => {
      if (document.body.classList.contains('menu-mode')) return;
      const code = e.code;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(code)) e.preventDefault();
      if (this.keys[code]) return;
      this.keys[code] = true;

      if (code === 'KeyE') this.interact();
      else if (code === 'KeyG') this.toggleDrawn();
      else if (code === 'KeyR') this.reload();
      else if (code === 'Escape') this.exitLock();
    };
    const keyUp = (e) => { this.keys[e.code] = false; };

    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);

    this.canvas.addEventListener('click', () => {
      if (document.body.classList.contains('menu-mode')) return;
      if (document.querySelector('#modalRoot.open') || document.getElementById('inspect').classList.contains('open')) return;
      this.requestLock();
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.mouseDX = (this.mouseDX || 0) + e.movementX;
      this.mouseDY = (this.mouseDY || 0) + e.movementY;
    });

    document.addEventListener('mousedown', (e) => {
      if (!this.locked || !this.active) return;
      if (e.target !== this.canvas) return;
      if (e.button === 0) { this.aim = false; this.shoot(); }
      if (e.button === 2) { this.aim = true; }
    });
    document.addEventListener('mouseup', (e) => { if (e.button === 2) this.aim = false; });
    document.addEventListener('contextmenu', (e) => { if (this.locked) e.preventDefault(); });

    document.addEventListener('pointerlockerror', () => this.showLockHint());

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
      const lock = document.getElementById('lockOverlay');
      if (lock) lock.classList.toggle('hidden', this.locked || document.body.classList.contains('menu-mode'));
      if (!this.locked) { this.keys = {}; this.aim = false; }
    });

    const lock = document.getElementById('lockOverlay');
    if (lock) lock.addEventListener('click', () => this.requestLock());
  },

  showLockHint() {
    if (!this.active || this.paused) return;
    if (document.body.classList.contains('menu-mode')) return;
    const lock = document.getElementById('lockOverlay');
    if (lock) lock.classList.remove('hidden');
  },

  requestLock() {
    if (!this.canvas || !this.active) return;
    try {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => this.showLockHint());
    } catch (e) { this.showLockHint(); }
  },

  exitLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  },

  enable() {
    this.active = true;
    this.paused = false;
    this.reset();
    const lock = document.getElementById('lockOverlay');
    if (lock) lock.classList.remove('hidden');
  },

  disable() {
    this.active = false;
    this.exitLock();
    const lock = document.getElementById('lockOverlay');
    if (lock) lock.classList.add('hidden');
  },
};

function clamp3(v, a, b) { return Math.max(a, Math.min(b, v)); }
