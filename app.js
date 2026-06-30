import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.min.js";

const canvas = document.querySelector("#river-canvas");

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);

const uniforms = {
  uTime: { value: 0 },
  uResolution: { value: new THREE.Vector2(1, 1) }
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;

    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;
    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 345.45));
      p += dot(p, p + 34.345);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    float fbm(vec2 p) {
      float value = 0.0;
      float amplitude = 0.5;
      mat2 rotate = mat2(0.8, -0.6, 0.6, 0.8);

      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(p);
        p = rotate * p * 2.05 + 11.7;
        amplitude *= 0.5;
      }

      return value;
    }

    float flowFbm(vec2 p, float t) {
      vec2 warpA = vec2(
        fbm(p * 1.4 + vec2(0.0, t * 0.16)),
        fbm(p * 1.4 + vec2(5.2, -t * 0.12))
      );
      vec2 warpB = vec2(
        fbm(p * 0.6 - vec2(t * 0.05, 2.3)),
        fbm(p * 0.6 + vec2(t * 0.04, -1.1))
      );
      vec2 warped = p + (warpA - 0.5) * 0.85 + (warpB - 0.5) * 0.4;
      return fbm(warped + vec2(t * 0.05, 0.0));
    }

    float foamLine(vec2 p, float width) {
      float ridge = abs(fbm(p) - 0.54);
      return smoothstep(width, 0.0, ridge);
    }

    void main() {
      vec2 uv = vUv;
      float aspect = uResolution.x / max(uResolution.y, 1.0);
      vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
      float t = uTime;

      vec2 riverDirection = normalize(vec2(0.95, -0.28));
      vec2 crossDirection = vec2(-riverDirection.y, riverDirection.x);
      vec2 stream = vec2(dot(p, riverDirection), dot(p, crossDirection));
      stream.y += sin(stream.x * 0.6 + t * 0.07) * 0.12;

      vec2 flowOffsetSlow = vec2(t * 0.05, sin(t * 0.05) * 0.05);
      vec2 flowOffsetFast = vec2(t * 0.16, cos(t * 0.07) * 0.03);

      float body = flowFbm(stream * vec2(3.6, 1.9) + flowOffsetSlow + vec2(2.0, 8.0), t);
      float braided = flowFbm(stream * vec2(8.4, 4.6) + flowOffsetFast + vec2(body * 1.9, -3.0), t * 1.3);
      float ripples = flowFbm(stream * vec2(20.0, 9.0) + flowOffsetFast * 2.2 + vec2(-4.0, body * 1.4), t * 1.8);
      float depth = smoothstep(0.0, 1.0, body * 0.7 + braided * 0.25 + ripples * 0.12);

      float eps = 0.01;
      vec2 hfP = stream * vec2(3.6, 1.9) + flowOffsetSlow + vec2(2.0, 8.0);
      float hL = flowFbm(hfP - vec2(eps, 0.0), t);
      float hR = flowFbm(hfP + vec2(eps, 0.0), t);
      float hD = flowFbm(hfP - vec2(0.0, eps), t);
      float hU = flowFbm(hfP + vec2(0.0, eps), t);
      vec3 normal = normalize(vec3((hL - hR) * 2.4, (hD - hU) * 2.4, 1.0));
      vec3 lightDir = normalize(vec3(0.45, 0.62, 0.65));
      float diffuse = clamp(dot(normal, lightDir), 0.0, 1.0);
      float specular = pow(clamp(dot(normal, normalize(lightDir + vec3(0.0, 0.0, 1.0))), 0.0, 1.0), 42.0) * 0.55;

      vec3 deep = vec3(0.022, 0.30, 0.35);
      vec3 mid = vec3(0.045, 0.55, 0.60);
      vec3 bright = vec3(0.34, 0.82, 0.84);
      vec3 color = mix(deep, mid, depth);
      color = mix(color, bright, smoothstep(0.58, 0.96, braided) * 0.38);
      color *= mix(0.78, 1.16, diffuse);
      color += specular * vec3(0.85, 0.97, 1.0);

      float caustic = fbm(stream * vec2(14.0, 6.0) + flowOffsetFast * 1.6 + vec2(0.0, body * 2.0));
      color += pow(smoothstep(0.55, 0.95, caustic), 2.0) * 0.12 * vec3(0.6, 0.95, 1.0);

      float foam = foamLine(stream * vec2(7.5, 2.4) + flowOffsetSlow * 1.2 + vec2(0.0, body * 2.3), 0.105);
      foam += foamLine(stream * vec2(13.0, 3.8) + flowOffsetFast * 1.3 + vec2(4.0, braided * 1.4), 0.055) * 0.75;
      foam = clamp(foam * smoothstep(0.36, 0.88, braided) * 0.4, 0.0, 1.0);
      color = mix(color, vec3(0.84, 0.97, 0.96), foam);

      float vignette = smoothstep(0.9, 0.18, distance(uv, vec2(0.5, 0.5)));
      color *= mix(0.58, 1.0, vignette);
      color *= vec3(0.82, 1.06, 1.05);

      gl_FragColor = vec4(color, 1.0);
    }
  `
});

scene.add(new THREE.Mesh(geometry, material));

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  uniforms.uResolution.value.set(width, height);
}

let resizeFrame = 0;

function queueResize() {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    resize();
  });
}


window.addEventListener("resize", queueResize);

const clock = new THREE.Clock();
let animationFrame = 0;

function animate() {
  uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
  animationFrame = requestAnimationFrame(animate);
}

function startAnimation() {
  if (!animationFrame) {
    animate();
  }
}

function stopAnimation() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    stopAnimation();
  } else {
    startAnimation();
  }
}

document.addEventListener("visibilitychange", handleVisibilityChange);
resize();
startAnimation();