class AuroraShader {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
    this.time = 0;
    this.animFrame = null;

    if (!this.gl) {
      console.warn('WebGL not supported, falling back to CSS');
      this.canvas.style.display = 'none';
      return;
    }

    this.init();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  init() {
    const gl = this.gl;

    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      uniform float u_time;
      uniform vec2 u_resolution;

      // tanh is GLSL ES 3.00 only — implement for WebGL 1.0
      vec3 tnh(vec3 x) {
        vec3 e = exp(clamp(x * 2.0, -10.0, 10.0));
        return (e - 1.0) / (e + 1.0);
      }

      void main() {
        // Centered, Y-normalised coords
        vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution) / u_resolution.y;
        float t  = u_time * 0.2;

        vec3 col = vec3(0.0);

        for (int i = 0; i < 40; i++) {
          float fi = float(i);

          // Sphere distortion: peaks at centre, soft falloff outward
          float z = 1.0 / (dot(uv, uv) * 0.28 + 1.0);

          // Quasi-random offsets via irrational steps → uniform cell sampling
          // prevents coherent bright bands at uv=0
          float scale = fi * 0.05 + 8.0;
          vec2 p = uv * scale + vec2(
            fract(fi * 0.7548776662) * 2.0 + t,
            fract(fi * 0.5698402910) * 2.0 + t * 0.7
          );

          // Equilateral hex-grid transform
          p = vec2(p.x + p.y * 0.5, p.y * 0.866025);

          // Mirror quadrants
          p = abs(fract(p) - 0.5);

          // Hex SDF — edge at h ≈ 0.43
          float h = max(p.x, p.x * 0.5 + p.y * 0.866025);

          // Exponential falloff from hex edge → crisp bright lines, dark interior
          float edge = exp(-abs(h - 0.43) * 28.0);
          col += vec3(2.0, 3.0, 5.0) * z * edge;
        }

        // Tonemap
        col = tnh(col * 0.018);
        // Gamma 2: squares the output → bright edges stay bright, dark interiors go near-black
        col = col * col;

        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const vs = this.createShader(gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSource);

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(this.program));
      return;
    }

    const vertices = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.a_position = gl.getAttribLocation(this.program, 'a_position');
    this.u_time = gl.getUniformLocation(this.program, 'u_time');
    this.u_resolution = gl.getUniformLocation(this.program, 'u_resolution');

    gl.enableVertexAttribArray(this.a_position);
    gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);
  }

  resize() {
    const scale = 0.5;
    this.canvas.width  = Math.floor(window.innerWidth  * scale);
    this.canvas.height = Math.floor(window.innerHeight * scale);
    this.canvas.style.width  = window.innerWidth  + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    if (this.gl) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  animate() {
    const gl = this.gl;
    this.time += 0.016;
    gl.useProgram(this.program);
    gl.uniform1f(this.u_time, this.time);
    gl.uniform2f(this.u_resolution, this.canvas.width, this.canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.animFrame = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
  }
}
