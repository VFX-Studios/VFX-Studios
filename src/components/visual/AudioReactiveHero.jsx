import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AudioReactiveHero({ className = '' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const geometry = new THREE.PlaneGeometry(2, 2);

    const uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uResolution: { value: new THREE.Vector2(mount.clientWidth, mount.clientHeight) }
    };

    const fragmentShader = `
      precision highp float;
      uniform float uTime;
      uniform float uIntensity;
      uniform vec2 uResolution;

      // Simple hash
      float hash(vec2 p) {
        return fract(sin(dot(p ,vec2(127.1,311.7))) * 43758.5453);
      }

      // 2D noise
      float noise(in vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) +
               (c - a) * u.y * (1.0 - u.x) +
               (d - b) * u.x * u.y;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / uResolution.xy;
        uv -= 0.5;
        uv.x *= uResolution.x / uResolution.y;

        float t = uTime * 0.25;
        float bass = uIntensity;

        float radial = length(uv);
        float angle = atan(uv.y, uv.x);

        float ripple = sin(10.0 * radial - t * 8.0) * 0.2;
        float noiseField = noise(uv * 3.0 + t);
        float pulse = sin(t * 6.0) * 0.5 + 0.5;

        float energy = smoothstep(0.0, 0.8, 1.0 - radial) * (0.4 + bass * 0.6);

        vec3 colorA = vec3(0.0, 0.95, 1.0);
        vec3 colorB = vec3(1.0, 0.1, 0.65);
        vec3 colorC = vec3(1.0, 0.76, 0.1);

        float band = smoothstep(0.2, 0.0, abs(sin(angle * 6.0 + t * 3.0)) - 0.4);
        vec3 color = mix(colorA, colorB, band);
        color = mix(color, colorC, pulse * 0.4 + bass * 0.6);

        float vignette = smoothstep(0.9, 0.2, radial + ripple);
        color *= vignette;
        color += energy * 0.4 + noiseField * 0.2;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      uniforms,
      fragmentShader,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Audio analyser (microphone optional + silent fallback)
    let audioCtx;
    let analyser;
    let dataArray;
    let micStream;

    async function setupAudio() {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        // Try microphone first
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          const micSource = audioCtx.createMediaStreamSource(micStream);
          micSource.connect(analyser);
        } catch {
          // Fallback to silent oscillator if mic denied/unavailable
          const oscillator = audioCtx.createOscillator();
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(90, audioCtx.currentTime);
          oscillator.connect(analyser);
          oscillator.start();
        }
      } catch {
        // No audio context available; visual will self-drive
      }
    }

    setupAudio();

    let animationId;
    const clock = new THREE.Clock();

    const onResize = () => {
      if (!mount) return;
      const { clientWidth, clientHeight } = mount;
      renderer.setSize(clientWidth, clientHeight);
      uniforms.uResolution.value.set(clientWidth, clientHeight);
    };

    let lastBeat = 0;
    const beatCooldown = 0.18; // seconds

    const renderLoop = () => {
      const delta = clock.getDelta();
      uniforms.uTime.value += delta;
      if (analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        let maxBin = 0;
        for (let i = 0; i < dataArray.length; i += 1) {
          sum += dataArray[i];
          if (dataArray[i] > maxBin) maxBin = dataArray[i];
        }
        const avg = sum / dataArray.length / 255;
        const peak = maxBin / 255;
        // Simple beat accent: emphasize peaks above average
        const beat = Math.max(0, peak - avg) * 1.5;
        uniforms.uIntensity.value = Math.min(1, avg * 0.6 + beat * 0.8 + 0.1);

        const now = clock.elapsedTime;
        if (beat > 0.28 && now - lastBeat > beatCooldown) {
          lastBeat = now;
          document.body.dataset.beat = '1';
          setTimeout(() => {
            document.body.dataset.beat = '0';
          }, 140);
        }
      } else {
        uniforms.uIntensity.value = 0.3 + Math.sin(uniforms.uTime.value * 2.0) * 0.2;
      }
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
      }
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, []);

  return <div ref={mountRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
