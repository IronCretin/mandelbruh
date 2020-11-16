const glsl = String.raw;

const vertex = glsl`
    attribute vec2 a_position;

    void main() {
        gl_Position = vec4(a_position.xy, 0., 1.);
    }
`;
const fragment = glsl`
    precision highp float;
    uniform vec2 u_offset;
    uniform float u_scale;
    uniform int u_iterations;
    uniform float u_fifty;

    #define MAX_ITERS 100000

    void zsquare(inout vec2 z) {
        z = vec2(z.x * z.x - z.y * z.y, 2. * z.x * z.y);
    }

    void main() {
        vec2 z = u_scale * (gl_FragCoord.xy + u_offset);
        vec2 z0 = z;

        float iters = -1.;
        for (int i = 0; i < MAX_ITERS; i++) {
            if (i >= u_iterations) {
                break;
            }
            if (z.x*z.x + z.y*z.y >= 4.) {
                iters = float(i);
                break;
            }
            zsquare(z);
            z += z0;
        }

        if (iters == -1.) {
            gl_FragColor = vec4(0., 0., 0., 1.);
        } else {
            gl_FragColor = vec4((1. - u_fifty / (iters + u_fifty)) * vec3(1., 1., 1.), 1.);
        }
    }
`;

const vertices = new Float32Array([
    -1, 1,
    -1, -1,
    1, 1,
    1, -1
]);

const canvas = document.getElementById("display");
canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;

const gl = canvas.getContext("webgl");

let program = gl.createProgram();

let vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertex);
gl.compileShader(vertexShader);
gl.attachShader(program, vertexShader);
console.log("vertex loaded:", gl.getShaderInfoLog(vertexShader));

let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragment);
gl.compileShader(fragmentShader);
gl.attachShader(program, fragmentShader);
console.log("fragment loaded:", gl.getShaderInfoLog(fragmentShader));

gl.linkProgram(program);
console.log("linked:", gl.getProgramInfoLog(program));

let vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.bindBuffer(gl.ARRAY_BUFFER, null);


let x = 0;
let y = 0;
let radius = 2;


requestAnimationFrame(render);

function render() {
    let w = gl.drawingBufferWidth;
    let h = gl.drawingBufferHeight;

    let scale = radius * 2 / Math.min(w, h);

    let offset = [-w / 2 + x / scale, -h / 2 + y / scale];


    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(program);

    const u_offset = gl.getUniformLocation(program, "u_offset");
    gl.uniform2fv(u_offset, offset);
    const u_scale = gl.getUniformLocation(program, "u_scale");
    gl.uniform1f(u_scale, scale);
    const u_iterations = gl.getUniformLocation(program, "u_iterations");
    gl.uniform1i(u_iterations, parseInt(document.getElementById("iterations").value, 10));
    const u_fifty = gl.getUniformLocation(program, "u_fifty");
    gl.uniform1f(u_fifty, parseInt(document.getElementById("fifty").value, 10));

    let a_position = gl.getAttribLocation(program, "a_position");
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

}

document.getElementById("move-left").addEventListener("click", () => {
    x -= radius / 2;
    requestAnimationFrame(render);
});
document.getElementById("move-up").addEventListener("click", () => {
    y += radius / 2;
    requestAnimationFrame(render);
});
document.getElementById("move-down").addEventListener("click", () => {
    y -= radius / 2;
    requestAnimationFrame(render);
});
document.getElementById("move-right").addEventListener("click", () => {
    x += radius / 2;
    requestAnimationFrame(render);
});

document.getElementById("zoom-in").addEventListener("click", () => {
    radius /= 2;
    requestAnimationFrame(render);
});
document.getElementById("zoom-out").addEventListener("click", () => {
    radius *= 2;
    requestAnimationFrame(render);
});

document.getElementById("iterations").addEventListener("change", () => {
    requestAnimationFrame(render);
    if (document.getElementById("lock").checked) {
        document.getElementById("fifty").value = document.getElementById("iterations").value / 10
    }
});
document.getElementById("fifty").addEventListener("change", () => {
    requestAnimationFrame(render);
});

