import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.min.js";

const canvas = document.querySelector("#river-canvas");

const isMobile = window.innerWidth < 768;

// Check WebGL support. "high-performance" can fail context creation on some
// real phone GPUs (budget/integrated chips) even though it works fine in a
// desktop browser's mobile emulator, which always uses the desktop GPU.
// "low-power" is the safer, more broadly-supported request on real devices.
const contextAttribs = {
  alpha: true,
  antialias: false,
  powerPreference: isMobile ? "low-power" : "high-performance",
  failIfMajorPerformanceCaveat: false
};

let gl;
try {
  gl = canvas.getContext("webgl", contextAttribs) || canvas.getContext("experimental-webgl", contextAttribs);
} catch(e) {}
if (!gl) {
  // No WebGL — CSS fallback is already visible, nothing to do
  document.documentElement.classList.add("no-webgl");
  throw new Error("WebGL not supported");
}

// Mobile renders the *exact same shader* as desktop — no visual differences.
// Performance is managed purely through internal resolution (upscaled via
// CSS, imperceptible in noisy water) and a frame-rate cap, never by cutting
// shader features. This keeps the two backgrounds visually identical.
const baseDpr     = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
const renderScale = isMobile ? 0.55 : 1;
const dpr = baseDpr * renderScale;

// Cap mobile to ~30fps (desktop runs uncapped / display refresh rate).
const frameInterval = isMobile ? 1000 / 30 : 0;
let lastFrameTime = 0;

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: false,
  powerPreference: contextAttribs.powerPreference,
  context: gl
});
renderer.setPixelRatio(dpr);

// If the GPU/browser drops the context mid-session (common on mobile under
// memory pressure), fall back to the CSS background instead of freezing on
// the last rendered frame.
canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  cancelAnimationFrame(raf);
  document.documentElement.classList.remove("webgl-ready");
});

const scene    = new THREE.Scene();
const camera   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const geometry = new THREE.PlaneGeometry(2, 2);

const uniforms = {
  uTime:       { value: 0 },
  uResolution: { value: new THREE.Vector2(1, 1) }
};

const vertexShader = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position,1.0); }
`;

// One shader, byte-for-byte identical on mobile and desktop — same colors,
// same lighting, same caustics, same foam. No feature branching. Performance
// on mobile is handled entirely outside this shader (lower internal
// resolution + frame-rate cap), so what you see is genuinely the same
// background at both sizes.
const fragmentShader = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;

  #define OCT 3

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 345.45));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),
               mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
  }
  float fbm(vec2 p) {
    float v=0.0, a=0.5;
    mat2 rot=mat2(0.8,-0.6,0.6,0.8);
    for(int i=0;i<OCT;i++){ v+=a*noise(p); p=rot*p*2.05+11.7; a*=0.5; }
    return v;
  }
  float flowFbm(vec2 p, float t) {
    vec2 w=vec2(fbm(p*1.3+vec2(0.0,t*0.14)), fbm(p*1.3+vec2(4.8,-t*0.11)));
    return fbm(p+(w-0.5)*0.8+vec2(t*0.05,0.0));
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y,1.0);
    vec2 p = vec2((vUv.x-0.5)*aspect, vUv.y-0.5);
    float t = uTime;

    vec2 rDir = normalize(vec2(0.95,-0.28));
    vec2 stream = vec2(dot(p,rDir), dot(p,vec2(-rDir.y,rDir.x)));
    stream.y += sin(stream.x*0.6 + t*0.07)*0.11;
    vec2 oS=vec2(t*0.05,sin(t*0.05)*0.04), oF=vec2(t*0.16,cos(t*0.07)*0.03);

    float body    = flowFbm(stream*vec2(3.6,1.9)+oS+vec2(2.0,8.0), t);
    float braided = flowFbm(stream*vec2(8.4,4.6)+oF+vec2(body*1.8,-3.0), t*1.3);
    float depth   = smoothstep(0.0,1.0, body*0.75+braided*0.3);

    vec3 deep  = vec3(0.022,0.30,0.35);
    vec3 mid   = vec3(0.045,0.55,0.60);
    vec3 bright= vec3(0.34, 0.82,0.84);
    vec3 color = mix(deep, mid, depth);
    color = mix(color, bright, smoothstep(0.58,0.96,braided)*0.36);

    float eps=0.012;
    vec2 hfP = stream*vec2(3.6,1.9)+oS+vec2(2.0,8.0);
    vec3 norm = normalize(vec3(fbm(hfP-vec2(eps,0.0))-fbm(hfP+vec2(eps,0.0)),
                               fbm(hfP-vec2(0.0,eps))-fbm(hfP+vec2(0.0,eps)), 0.28));
    vec3 lDir = normalize(vec3(0.45,0.62,0.65));
    float diff = clamp(dot(norm,lDir),0.0,1.0);
    float spec = pow(clamp(dot(norm,normalize(lDir+vec3(0,0,1))),0.0,1.0),32.0)*0.45;
    color *= mix(0.78,1.14,diff);
    color += spec*vec3(0.85,0.97,1.0);

    float caust=fbm(stream*vec2(13.0,5.5)+oF*1.5);
    color += pow(smoothstep(0.56,0.94,caust),2.0)*0.10*vec3(0.6,0.95,1.0);

    float foam=smoothstep(0.10,0.0,abs(fbm(stream*vec2(7.5,2.4)+oS*1.1+vec2(0,body*2.2))-0.54));
    color = mix(color,vec3(0.84,0.97,0.96),foam*smoothstep(0.36,0.88,braided)*0.42);

    float vign=smoothstep(0.9,0.18,distance(vUv,vec2(0.5)));
    gl_FragColor = vec4(color*mix(0.58,1.0,vign)*vec3(0.82,1.06,1.05),1.0);
  }
`;

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader,
  fragmentShader
});
scene.add(new THREE.Mesh(geometry, material));

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  uniforms.uResolution.value.set(w, h);
}

let resizeFrame = 0;
function queueResize() {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; resize(); });
}

window.addEventListener("resize", queueResize);

const clock = new THREE.Clock();
let raf = 0;

function animate(now) {
  raf = requestAnimationFrame(animate);

  if (frameInterval && now - lastFrameTime < frameInterval) return;
  lastFrameTime = now;

  uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
  else if (!raf) animate();
});

// Signal WebGL is running so CSS fallback hides
document.documentElement.classList.add("webgl-ready");

resize();
animate();