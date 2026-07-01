import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.min.js";

const canvas = document.querySelector("#river-canvas");

// Detect low-end / mobile: use a simpler shader path
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 768;
const dpr = isMobile ? Math.min(window.devicePixelRatio || 1, 1) : Math.min(window.devicePixelRatio || 1, 1.5);

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: false,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(dpr);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const geometry = new THREE.PlaneGeometry(2, 2);

const MAX_RIPPLES = 6;
const rippleData = new Float32Array(MAX_RIPPLES * 4);
let nextRippleSlot = 0;

const uniforms = {
  uTime:       { value: 0 },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uRipples:    { value: rippleData }
};

// Mobile shader: 2-octave fbm, no domain warp, no normals, single foam line
const mobileFragment = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec4 uRipples[${MAX_RIPPLES}];

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 2; i++) {
      v += a * noise(p);
      p = p * 2.1 + vec2(3.7, -1.3);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
    float t = uTime;

    vec2 rDir = normalize(vec2(0.95, -0.28));
    vec2 stream = vec2(dot(p, rDir), dot(p, vec2(-rDir.y, rDir.x)));
    stream.y += sin(stream.x * 0.6 + t * 0.07) * 0.1;
    vec2 off = vec2(t * 0.07, sin(t * 0.05) * 0.04);

    float body    = fbm(stream * vec2(3.5, 1.8) + off + vec2(2.0, 8.0));
    float braided = fbm(stream * vec2(7.0, 3.8) + off * 1.5 + vec2(body * 1.6, -2.5));
    float depth   = smoothstep(0.0, 1.0, body * 0.72 + braided * 0.32);

    vec3 deep  = vec3(0.022, 0.30, 0.35);
    vec3 mid   = vec3(0.045, 0.55, 0.60);
    vec3 bright= vec3(0.34,  0.82, 0.84);
    vec3 color = mix(deep, mid, depth);
    color = mix(color, bright, smoothstep(0.58, 0.96, braided) * 0.34);

    float foam = smoothstep(0.06, 0.0, abs(fbm(stream * vec2(7.0, 2.2) + off) - 0.54));
    foam *= smoothstep(0.36, 0.88, braided) * 0.38;
    color = mix(color, vec3(0.84, 0.97, 0.96), foam);

    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRipples[i];
      if (r.w < 0.5) continue;
      float age = t - r.z;
      if (age < 0.0 || age > 2.2) continue;
      vec2 origin = vec2((r.x - 0.5) * aspect, r.y - 0.5);
      float d = distance(p, origin);
      float ring = exp(-pow((d - age * 0.55) * 12.0, 2.0)) * (1.0 - smoothstep(0.0, 2.2, age));
      color = mix(color, vec3(0.84, 0.97, 0.96), ring * 0.65);
    }

    float vignette = smoothstep(0.9, 0.18, distance(uv, vec2(0.5)));
    color *= mix(0.6, 1.0, vignette) * vec3(0.82, 1.06, 1.05);
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Desktop shader: single-warp flowFbm, 3-octave fbm, cheap normal
const desktopFragment = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec4 uRipples[${MAX_RIPPLES}];

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 rot = mat2(0.8,-0.6, 0.6, 0.8);
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p = rot * p * 2.05 + 11.7;
      a *= 0.5;
    }
    return v;
  }
  float flowFbm(vec2 p, float t) {
    vec2 w = vec2(fbm(p * 1.3 + vec2(0.0, t * 0.14)),
                  fbm(p * 1.3 + vec2(4.8, -t * 0.11)));
    return fbm(p + (w - 0.5) * 0.8 + vec2(t * 0.05, 0.0));
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
    float t = uTime;

    vec2 rDir = normalize(vec2(0.95, -0.28));
    vec2 stream = vec2(dot(p, rDir), dot(p, vec2(-rDir.y, rDir.x)));
    stream.y += sin(stream.x * 0.6 + t * 0.07) * 0.11;
    vec2 offSlow = vec2(t * 0.05, sin(t * 0.05) * 0.04);
    vec2 offFast = vec2(t * 0.16, cos(t * 0.07) * 0.03);

    float body    = flowFbm(stream * vec2(3.6, 1.9) + offSlow + vec2(2.0, 8.0), t);
    float braided = flowFbm(stream * vec2(8.4, 4.6) + offFast + vec2(body*1.8,-3.0), t*1.3);
    float depth   = smoothstep(0.0, 1.0, body * 0.75 + braided * 0.3);

    float eps = 0.012;
    vec2 hfP = stream * vec2(3.6, 1.9) + offSlow + vec2(2.0, 8.0);
    vec3 normal = normalize(vec3(
      fbm(hfP - vec2(eps,0.0)) - fbm(hfP + vec2(eps,0.0)),
      fbm(hfP - vec2(0.0,eps)) - fbm(hfP + vec2(0.0,eps)),
      0.28
    ));
    vec3 lDir = normalize(vec3(0.45, 0.62, 0.65));
    float diffuse  = clamp(dot(normal, lDir), 0.0, 1.0);
    float specular = pow(clamp(dot(normal, normalize(lDir + vec3(0,0,1))), 0.0, 1.0), 32.0) * 0.45;

    vec3 deep  = vec3(0.022, 0.30, 0.35);
    vec3 mid   = vec3(0.045, 0.55, 0.60);
    vec3 bright= vec3(0.34,  0.82, 0.84);
    vec3 color = mix(deep, mid, depth);
    color = mix(color, bright, smoothstep(0.58, 0.96, braided) * 0.36);
    color *= mix(0.78, 1.14, diffuse);
    color += specular * vec3(0.85, 0.97, 1.0);

    float caust = fbm(stream * vec2(13.0, 5.5) + offFast * 1.5);
    color += pow(smoothstep(0.56, 0.94, caust), 2.0) * 0.10 * vec3(0.6, 0.95, 1.0);

    float foam = smoothstep(0.10, 0.0, abs(fbm(stream * vec2(7.5,2.4) + offSlow*1.1 + vec2(0,body*2.2)) - 0.54));
    foam = clamp(foam * smoothstep(0.36, 0.88, braided) * 0.42, 0.0, 1.0);
    color = mix(color, vec3(0.84, 0.97, 0.96), foam);

    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 r = uRipples[i];
      if (r.w < 0.5) continue;
      float age = t - r.z;
      if (age < 0.0 || age > 2.4) continue;
      vec2 origin = vec2((r.x - 0.5) * aspect, r.y - 0.5);
      float d = distance(p, origin);
      float ring = exp(-pow((d - age*0.58)*13.0, 2.0)) * (1.0 - smoothstep(0.0,2.4,age));
      color += ring * 0.5 * vec3(0.72, 0.96, 1.0);
      color = mix(color, vec3(0.84, 0.97, 0.96), ring * 0.7);
    }

    float vignette = smoothstep(0.9, 0.18, distance(uv, vec2(0.5)));
    color *= mix(0.58, 1.0, vignette) * vec3(0.82, 1.06, 1.05);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position,1.0); }`,
  fragmentShader: isMobile ? mobileFragment : desktopFragment
});

scene.add(new THREE.Mesh(geometry, material));

function resize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  renderer.setSize(w, h, false);
  uniforms.uResolution.value.set(w, h);
}

let resizeFrame = 0;
function queueResize() {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; resize(); });
}

function spawnRipple(cx, cy) {
  const base = nextRippleSlot * 4;
  rippleData[base]     = cx / window.innerWidth;
  rippleData[base + 1] = 1 - cy / window.innerHeight;
  rippleData[base + 2] = uniforms.uTime.value;
  rippleData[base + 3] = 1;
  nextRippleSlot = (nextRippleSlot + 1) % MAX_RIPPLES;
}

function onTap(e) {
  const pt = e.changedTouches ? e.changedTouches[0] : e;
  spawnRipple(pt.clientX, pt.clientY);
}

window.addEventListener("resize", queueResize);
window.addEventListener("pointerdown", onTap);
window.addEventListener("touchstart", onTap, { passive: true });

const clock = new THREE.Clock();
let raf = 0;

function animate() {
  uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
  raf = requestAnimationFrame(animate);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
  else if (!raf) animate();
});

resize();
animate();