"use client";

import { useEffect, useRef } from "react";

const vertexShaderSource = `
attribute vec3 aPosition;
void main() {
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

const fragmentShaderSource = `
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_dpr;
uniform vec3 u_col1;
uniform vec3 u_col2;
uniform vec3 u_col3;

float rand(vec2 co){
  return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453) / u_dpr;
}

vec4 circle(vec2 st, vec2 center, float radius, float blur, vec3 col){
  float dist = distance(st,center)*2.0;
  vec4 f_col = vec4(1.0-smoothstep(radius, radius + blur, dist));
  f_col.r *= col.r;
  f_col.g *= col.g;
  f_col.b *= col.b;
  return f_col;
}

void main(){
  vec2 fst = gl_FragCoord.xy/u_resolution.xy;
  float aspect = u_resolution.x/u_resolution.y;
  vec2 mst = fst;
  vec2 m = u_mouse.xy/u_resolution.xy;

  vec3 col1 = u_col1 / 255.;
  vec3 col2 = u_col2 / 255.;
  vec3 col3 = u_col3 / 255.;

  vec4 color = vec4(0.);

  vec2 purpleC = vec2(m.x, 1.-m.y);
  float purpleR = .75;
  float purpleB = .75;
  vec3 purpleCol = col1;

  vec2 mintC = vec2(.5+sin(u_time*.4)*.5*cos(u_time*.2)*.5, .5+sin(u_time*.3)*.5*cos(u_time*.5)*.5);
  float mintR = 1.;
  float mintB = 1.;
  vec3 mintCol = col2;

  vec2 greenC = vec2((.5+cos(u_time*.5)*.5*sin(u_time*.2)*.5)*aspect, .5+cos(u_time*.4)*(.5)*sin(u_time*.3)*.5);
  float greenR = 1.;
  float greenB = 1.;
  vec3 greenCol = col3;

  mst.x += cos(u_time*.37+mst.x*15.)*.21 * sin(u_time*.14+mst.y*7.)*.29 * (m.x - .5) * 12.;
  mst.y += sin(u_time*.15+mst.x*13.)*.37 * cos(u_time*.36+mst.y*5.)*.12 * (m.y - .5) * 12.;

  vec4 color1 = vec4(0.);
  vec4 color2 = vec4(0.);
  vec4 color3 = vec4(0.);
  vec4 color4 = vec4(0.);
  vec4 color5 = vec4(0.);

  color1 += vec4(
    (circle(mst, mintC, mintR, mintB, vec3(1.))
    - circle(mst, mintC, mintR, mintB, vec3(1.)) * circle(mst, greenC, greenR, greenB, vec3(1.))
    )
  );

  color2 += vec4(
    (circle(mst, mintC, mintR, mintB, vec3(1.))
    - circle(mst, mintC, mintR, mintB, vec3(1.)) * circle(mst, purpleC, purpleR, purpleB, vec3(1.))
    )
  );

  color1 -= color1 * color2;
  color2 -= color1 * color2;

  color3 = color1;
  color4 = color2;

  color3.rgb *= purpleCol;
  color4.rgb *= greenCol;

  color += color3;
  color += color4;

  color5 += vec4(
    (circle(mst, greenC, greenR, greenB, vec3(1.))
    - circle(mst, greenC, greenR, greenB, vec3(1.)) * circle(mst, mintC, mintR, mintB, vec3(1.))
    )
  );

  color5 -= color1 * color2;
  color5.rgb *= mintCol;
  color += color5;

  color += circle(mst, mintC, mintR, mintB, mintCol)
    * (color1 - circle(mst, mintC, mintR, mintB, vec3(1.)))
    * (color2 - circle(mst, mintC, mintR, mintB, vec3(1.)));

  float noise = rand(fst*10.) * .2;
  color.rgb *= 1. - vec3(noise);

  gl_FragColor = color;
}
`;

interface HeroShaderProps {
  color1?: [number, number, number];
  color2?: [number, number, number];
  color3?: [number, number, number];
}

export function HeroShader({
  color1 = [232, 64, 13],
  color2 = [255, 238, 216],
  color3 = [208, 178, 255],
}: HeroShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const path = pathRef.current;
    if (!canvas || !container || !path) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const updatePath = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const blur = 40;

      const x1 = 0.955 * width;
      const y1 = 0.4 * height;
      const x2 = 0.967 * width;
      const y2 = 0.43 * height;
      const cx1 = 0.7 * width;
      const cy1 = 0.75 * height;
      const cx2 = 0.31 * width;
      const cy2 = 0.89 * height;
      const y3 = height - blur;
      const x3 = 0.2 * width;
      const y4 = 0.39 * height;
      const cx3 = 0.71 * width;
      const cy3 = 0.49 * height;
      const x4 = 0.94 * width;
      const y5 = 0.36 * height;

      const pathData = `M${x1},${y1} L${x2},${y2} C${cx1},${cy1},${cx2},${cy2},0,${y3} V${blur} C${x3},${y4},${cx3},${cy3},${x4},${y5}Z`;
      path.setAttribute("d", pathData);
    };

    updatePath();
    window.addEventListener("resize", updatePath);

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    const u_resolution = gl.getUniformLocation(program, "u_resolution");
    const u_time = gl.getUniformLocation(program, "u_time");
    const u_mouse = gl.getUniformLocation(program, "u_mouse");
    const u_dpr = gl.getUniformLocation(program, "u_dpr");
    const u_col1 = gl.getUniformLocation(program, "u_col1");
    const u_col2 = gl.getUniformLocation(program, "u_col2");
    const u_col3 = gl.getUniformLocation(program, "u_col3");

    const mouse = { x: 0, y: 0 };
    const smoothMouse = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const startTime = Date.now();
    let animationId: number;

    const render = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      smoothMouse.x += (mouse.x - smoothMouse.x) * 0.025;
      smoothMouse.y += (mouse.y - smoothMouse.y) * 0.025;

      gl.uniform2fv(u_resolution, [canvas.width, canvas.height]);
      gl.uniform1f(u_time, (Date.now() - startTime) * 0.0025);
      gl.uniform2fv(u_mouse, [smoothMouse.x, smoothMouse.y]);
      gl.uniform1f(u_dpr, window.devicePixelRatio);
      gl.uniform3fv(u_col1, color1);
      gl.uniform3fv(u_col2, color2);
      gl.uniform3fv(u_col3, color3);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", updatePath);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [color1, color2, color3]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: "1 1 0%",
        justifyContent: "center",
        alignSelf: "stretch",
        alignItems: "center",
        display: "flex",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          backgroundColor: "rgb(232, 64, 13)",
          maskImage: 'url("#rocket-mask")',
          WebkitMaskImage: 'url("#rocket-mask")',
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
        }}
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <defs>
          <filter id="blur-canvas" height="120%" width="120%" x="-10%" y="-10%">
            <feGaussianBlur id="hero-deviation" stdDeviation="20" />
          </filter>
          <linearGradient id="fade-gradient" x1="0%" x2="20%" y1="0%" y2="0%">
            <stop offset="10%" style={{ stopColor: "white", stopOpacity: 0 }} />
            <stop offset="100%" style={{ stopColor: "white", stopOpacity: 1 }} />
          </linearGradient>
          <mask id="rocket-mask" maskContentUnits="userSpaceOnUse" maskUnits="userSpaceOnUse">
            <path
              ref={pathRef}
              d=""
              fill="white"
              filter="url(#blur-canvas)"
              style={{ fill: 'url("#fade-gradient")' }}
            />
          </mask>
        </defs>
      </svg>
    </div>
  );
}

export default HeroShader;

