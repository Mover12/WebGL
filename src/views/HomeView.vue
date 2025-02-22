<script setup>
  import { ref, useTemplateRef, onMounted, watch } from 'vue';
  import vert from '../shaders/vert.glsl';
  import frag from '../shaders/frag.glsl';
  import '../game/ecs.js';
  var gx = 0, gy = 0.1;

  const count = ref(1000);
  const cv = useTemplateRef('cv');
  const gl = ref(null);
  var points = new Float32Array(count.value * 4);

  watch(count, () => {
    points = new Float32Array(count.value * 4);
  })
  
  onMounted(() => {
    gl.value = cv.value.getContext('webgl');

    const program = gl.value.createProgram();

    {
      const shader = gl.value.createShader(gl.value.VERTEX_SHADER);
      gl.value.shaderSource(shader, vert);
      gl.value.compileShader(shader);
      gl.value.attachShader(program, shader);
    }

    {
      const shader = gl.value.createShader(gl.value.FRAGMENT_SHADER);
      gl.value.shaderSource(shader, frag);
      gl.value.compileShader(shader);
      gl.value.attachShader(program, shader);
    }

    gl.value.linkProgram(program);
    gl.value.useProgram(program);

    gl.value.bindBuffer(gl.value.ARRAY_BUFFER, gl.value.createBuffer());

    const scale = gl.value.getAttribLocation(program, 'scale');
    gl.value.disableVertexAttribArray(scale);
    gl.value.vertexAttrib2f(scale, 2 / cv.value.width, -2 / cv.value.height);

    const coord = gl.value.getAttribLocation(program, 'coordinates');
    gl.value.enableVertexAttribArray(coord);
    gl.value.vertexAttribPointer(coord, 2, gl.value.FLOAT, false, 16, 0);

    gl.value.viewport(0, 0, 500, 500);
  });

  setInterval(() => {
    for (let i = 0; i < points.length - 3; i += 4) {
      points[i] += points[i + 2];
      points[i + 1] += points[i + 3];

      if(points[i] >= 250 || points[i] <= -250) {
        points[i + 2] = -points[i + 2];
      }
      if(points[i + 1] >= 250 || points[i + 1] <= -250) {
        points[i + 3] = -points[i + 3];
      }
      
      points[i + 2] += gx;
      points[i + 3] += gy;
    }
  }, 1 / 1);

  setInterval(() => {
    gl.value.bufferData(gl.value.ARRAY_BUFFER, points, gl.value.DYNAMIC_DRAW);
    gl.value.clearColor(0, 0, 0, 1);
    gl.value.clear(gl.value.COLOR_BUFFER_BIT);
    gl.value.drawArrays(gl.value.POINTS, 0, points.length / 4);
  }, 1 / 60);

  function draw(event) {
    for (let i = 0; i < points.length - 3; i += 4) {
      points[i] = event.offsetX - cv.value.width / 2;
      points[i + 1] = event.offsetY - cv.value.height / 2;

      var theta = Math.random() * ((1) - (-1)) * 2 * Math.PI;
      var r = Math.random() * (2);

      points[i + 2] = r * Math.cos(theta) * 2;
      points[i + 3] = r * Math.sin(theta) * 2;
    }
  }

</script>

<template>
  <main>
    <canvas width="500" height="500" ref="cv" @click="(event) => draw(event)"></canvas>
    <br style="user-select: none;"/>
    <input v-model="count"/>
  </main>
</template>
