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
        #define JSCALE 1000.

        vec2 z = u_scale * (gl_FragCoord.xy + u_offset);
        vec2 c = z;

        float iters = -1.;
        for (int i = 0; i < MAX_ITERS; i++) {
            if (i >= u_iterations) {
                break;
            }
            if ((z.x*z.x + z.y*z.y) >= 4.) {
                iters = float(i);
                break;
            }
            zsquare(z);
            z += c;
        }

        if (iters == -1.) {
            gl_FragColor = vec4(0., 0., 0., 1.);
        } else {
            gl_FragColor = vec4((1. - u_fifty / (iters + u_fifty)) * vec3(1., 1., 1.), 1.);
        }
    }
`;

const julia = glsl`
    precision mediump float;
    uniform vec2 u_size;
    uniform vec2 u_c;

    uniform int u_iterations;

    uniform float u_fifty;

    #define MAX_ITERS 10000

    void zsquare(inout vec2 z) {
        z = vec2(z.x * z.x - z.y * z.y, 2. * z.x * z.y);
    }

    void main() {
        #define JSCALE 1000.

        vec2 scale = vec2(4., 4.) / u_size;

        vec2 z = scale * gl_FragCoord.xy - vec2(2., 2.);

        float iters = -1.;
        for (int i = 0; i < MAX_ITERS; i++) {
            if (i >= u_iterations) {
                break;
            }
            if ((z.x*z.x + z.y*z.y) >= 4.) {
                iters = float(i);
                break;
            }
            zsquare(z);
            z += u_c;
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

const display = document.getElementById("display");
display.width = document.documentElement.clientWidth;
display.height = document.documentElement.clientHeight;
const gl = display.getContext("webgl");

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

const mini = document.getElementById("mini");

const glMini = mini.getContext("webgl");

let programMini = glMini.createProgram();

let vertexShaderMini = glMini.createShader(glMini.VERTEX_SHADER);
glMini.shaderSource(vertexShaderMini, vertex);
glMini.compileShader(vertexShaderMini);
glMini.attachShader(programMini, vertexShaderMini);
console.log("vertex loaded:", glMini.getShaderInfoLog(vertexShaderMini));

let fragmentShaderMini = glMini.createShader(glMini.FRAGMENT_SHADER);
glMini.shaderSource(fragmentShaderMini, julia);
glMini.compileShader(fragmentShaderMini);
glMini.attachShader(programMini, fragmentShaderMini);
console.log("fragment loaded:", glMini.getShaderInfoLog(fragmentShaderMini));

glMini.linkProgram(programMini);
console.log("linked:", glMini.getProgramInfoLog(programMini));

let vertexBufferMini = glMini.createBuffer();
glMini.bindBuffer(glMini.ARRAY_BUFFER, vertexBufferMini);
glMini.bufferData(glMini.ARRAY_BUFFER, vertices, glMini.STATIC_DRAW);
glMini.bindBuffer(glMini.ARRAY_BUFFER, null);


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
function renderMini() {
    let w = glMini.drawingBufferWidth;
    let h = glMini.drawingBufferHeight;

    glMini.viewport(0, 0, w, h);
    glMini.clearColor(0, 0, 0, 0);
    glMini.clear(glMini.COLOR_BUFFER_BIT);

    glMini.useProgram(programMini);
    
    const u_size = glMini.getUniformLocation(programMini, "u_size");
    glMini.uniform2fv(u_size, [w, h]);
    const u_iterations = glMini.getUniformLocation(programMini, "u_iterations");
    glMini.uniform1i(u_iterations, parseInt(document.getElementById("iterations").value, 10));
    const u_fifty = glMini.getUniformLocation(programMini, "u_fifty");
    glMini.uniform1f(u_fifty, parseInt(document.getElementById("fifty").value, 10));
    const u_c = glMini.getUniformLocation(programMini, "u_c");
    glMini.uniform2fv(u_c, [cx, cy]);

    let a_position = glMini.getAttribLocation(programMini, "a_position");
    glMini.bindBuffer(glMini.ARRAY_BUFFER, vertexBufferMini);
    glMini.enableVertexAttribArray(a_position);
    glMini.vertexAttribPointer(a_position, 2, glMini.FLOAT, false, 0, 0);

    glMini.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

document.getElementById("move-left").addEventListener("click", () => {
    x -= radius / 2;
    document.getElementById("mini").classList.add("hidden");
    requestAnimationFrame(render);
});
document.getElementById("move-up").addEventListener("click", () => {
    y += radius / 2;
    document.getElementById("mini").classList.add("hidden");
    requestAnimationFrame(render);
});
document.getElementById("move-down").addEventListener("click", () => {
    y -= radius / 2;
    document.getElementById("mini").classList.add("hidden");
    requestAnimationFrame(render);
});
document.getElementById("move-right").addEventListener("click", () => {
    x += radius / 2;
    document.getElementById("mini").classList.add("hidden");
    requestAnimationFrame(render);
});

document.getElementById("zoom-in").addEventListener("click", () => {
    radius /= 2;
    document.getElementById("mini").classList.add("hidden");
    requestAnimationFrame(render);
});
document.getElementById("zoom-out").addEventListener("click", () => {
    radius *= 2;
    document.getElementById("mini").classList.add("hidden");
    requestAnimationFrame(render);
});

document.getElementById("iterations").addEventListener("change", () => {
    if (document.getElementById("lock").checked) {
        document.getElementById("fifty").value = document.getElementById("iterations").value / 10
    }
    requestAnimationFrame(render);
    requestAnimationFrame(renderMini);
});
document.getElementById("fifty").addEventListener("change", () => {
    requestAnimationFrame(render);
    requestAnimationFrame(renderMini);
});

let cx, cy = 0;

function minimove(event) {
    let mini = document.getElementById("mini");
    if (!mini.classList.contains("hidden")) {
        mini.style.left = event.clientX + "px";
        mini.style.top = Math.max(0, (event.clientY - mini.offsetHeight)) + "px";

        let w = gl.canvas.width;
        let h = gl.canvas.height;
        let scale = radius * 2 / Math.min(w, h);
        let offset = [-w / 2 + x / scale, -h / 2 + y / scale];

        cx = scale * (event.clientX + offset[0]);
        cy = scale * (document.documentElement.clientHeight - event.clientY + offset[1]);

        requestAnimationFrame(renderMini);
    }
}

document.getElementById("display").addEventListener("mousemove", minimove);
document.getElementById("mini").addEventListener("mousemove", minimove);

document.getElementById("display").addEventListener("click", () => {
    document.getElementById("mini").classList.toggle("hidden");
});