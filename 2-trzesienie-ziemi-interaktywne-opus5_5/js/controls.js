'use strict';
/* Kamera orbitalna: obrót (lewy przycisk / jeden palec), przesuwanie (prawy przycisk / dwa palce),
   przybliżanie (kółko / szczypanie). Płynne przejścia między widokami. */

class OrbitCam {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.target = new THREE.Vector3(-10, 6, -50);
    this.theta = 0.62;     // azymut
    this.phi = 1.05;       // kąt od pionu
    this.radius = 330;
    this.goal = { target: this.target.clone(), theta: this.theta, phi: this.phi, radius: this.radius };
    this.minR = 25;
    this.maxR = 900;
    this.auto = false;
    this.autoSpeed = 0.035;
    this.shake = new THREE.Vector3();
    this.pointers = new Map();
    this.dragMode = null;
    this.lastX = 0;
    this.lastY = 0;
    this.pinchDist = 0;
    this.moved = 0;
    this.onUserInput = null;
    this._bind();
  }

  _bind() {
    const d = this.dom;
    d.addEventListener('contextmenu', e => e.preventDefault());
    d.addEventListener('pointerdown', e => {
      d.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.moved = 0;
      if (this.pointers.size === 1) {
        this.dragMode = (e.button === 2 || e.shiftKey || e.ctrlKey) ? 'pan' : 'rotate';
        this.lastX = e.clientX;
        this.lastY = e.clientY;
      } else if (this.pointers.size === 2) {
        this.dragMode = 'pinch';
        const p = [...this.pointers.values()];
        this.pinchDist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        this.lastX = (p[0].x + p[1].x) / 2;
        this.lastY = (p[0].y + p[1].y) / 2;
      }
    });
    d.addEventListener('pointermove', e => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.dragMode === 'pinch' && this.pointers.size >= 2) {
        const p = [...this.pointers.values()];
        const dist = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
        const cx = (p[0].x + p[1].x) / 2, cy = (p[0].y + p[1].y) / 2;
        if (this.pinchDist > 0) this.zoom(this.pinchDist / dist);
        this.pan(cx - this.lastX, cy - this.lastY);
        this.pinchDist = dist;
        this.lastX = cx;
        this.lastY = cy;
        this.moved += 10;
        return;
      }
      const dx = e.clientX - this.lastX, dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.moved += Math.abs(dx) + Math.abs(dy);
      if (this.dragMode === 'rotate') {
        this.goal.theta -= dx * 0.0055;
        this.goal.phi = U.clamp(this.goal.phi - dy * 0.0045, 0.12, 1.47);
        this._user();
      } else if (this.dragMode === 'pan') {
        this.pan(dx, dy);
      }
    });
    const up = e => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size === 0) this.dragMode = null;
      else if (this.pointers.size === 1) {
        const p = [...this.pointers.values()][0];
        this.dragMode = 'rotate';
        this.lastX = p.x;
        this.lastY = p.y;
      }
    };
    d.addEventListener('pointerup', up);
    d.addEventListener('pointercancel', up);
    d.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom(Math.pow(1.0012, e.deltaY));
    }, { passive: false });
  }

  _user() {
    if (this.onUserInput) this.onUserInput();
  }

  zoom(f) {
    this.goal.radius = U.clamp(this.goal.radius * f, this.minR, this.maxR);
    this._user();
  }

  pan(dx, dy) {
    const s = this.goal.radius * 0.0016;
    const fwd = new THREE.Vector3(-Math.sin(this.goal.theta), 0, -Math.cos(this.goal.theta));
    const right = new THREE.Vector3(Math.cos(this.goal.theta), 0, -Math.sin(this.goal.theta));
    this.goal.target.addScaledVector(right, -dx * s);
    this.goal.target.addScaledVector(fwd, dy * s);
    this.goal.target.x = U.clamp(this.goal.target.x, -400, 400);
    this.goal.target.z = U.clamp(this.goal.target.z, -400, 400);
    this._user();
  }

  flyTo(v) {
    this.goal.target.set(v.target[0], v.target[1], v.target[2]);
    this.goal.radius = v.radius;
    this.goal.phi = v.phi;
    // najkrótsza droga po azymucie
    let th = v.theta;
    while (th - this.goal.theta > Math.PI) th -= Math.PI * 2;
    while (th - this.goal.theta < -Math.PI) th += Math.PI * 2;
    this.goal.theta = th;
  }

  update(dt) {
    if (this.auto && !this.dragMode) this.goal.theta += this.autoSpeed * dt;
    const k = 1 - Math.exp(-dt * 4.5);
    this.theta += (this.goal.theta - this.theta) * k;
    this.phi += (this.goal.phi - this.phi) * k;
    this.radius += (this.goal.radius - this.radius) * k;
    this.target.lerp(this.goal.target, k);
    const sp = Math.sin(this.phi);
    const c = this.camera;
    // na wąskim (pionowym) ekranie kamera odsuwa się, żeby miasto się zmieściło
    const fit = c.aspect < 1.3 ? Math.pow(1.3 / c.aspect, 0.7) : 1;
    const R = this.radius * fit;
    c.position.set(
      this.target.x + R * sp * Math.sin(this.theta),
      this.target.y + R * Math.cos(this.phi),
      this.target.z + R * sp * Math.cos(this.theta)
    );
    // kamera nie wchodzi pod teren
    const gy = World.baseHeight(c.position.x, c.position.z) + 2.5;
    if (c.position.y < gy) c.position.y = gy;
    c.lookAt(this.target);
    c.position.add(this.shake);
  }
}
