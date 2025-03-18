<script setup>
  import { ref, useTemplateRef, onMounted, watch } from 'vue';
  import vert from '../shaders/vert.glsl';
  import frag from '../shaders/frag.glsl';

  const cv = useTemplateRef('cv');
  var gl;
  var textureCoords = new Float32Array([
      0, 0, 0, 1, 1, 0,
      0, 1, 1, 1, 1, 0
  ]);
  var points = new Float32Array(textureCoords);

  onMounted(() => {
    document.addEventListener('keydown', (event) => {
      var direction;
      var velocity = [0.1, 0.1];
      if (event.keyCode == 87) direction = [0, 1]; //w
      if (event.keyCode == 65) direction = [-1, 0]; //a
      if (event.keyCode == 83) direction = [0, -1]; //s
      if (event.keyCode == 68) direction = [1, 0]; //d
      for (let i = 0; i < 12; i+=2) {
          points[i] += direction[0] * velocity[0];
          points[i + 1] += direction[1] * velocity[1];
        }
    });
    // cv.value.addEventListener('mousemove', (event) => {
    //   for (let i = 0; i < 12; i+=2) {
    //     points[i] = textureCoords[i] + event.offsetX / cv.value.width * 2 - 1.5;
    //     points[i + 1] = textureCoords[i + 1] + 0.5 - event.offsetY / cv.value.height * 2;
    //   }
    // });

    gl = cv.value.getContext('webgl');
    gl.viewport(0, 0, gl.drawingBufferHeight, gl.drawingBufferWidth);

    const program = gl.createProgram();

    {
      const shader = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(shader, vert);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }

    {
      const shader = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(shader, frag);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }

    gl.linkProgram(program);
    gl.useProgram(program);
    
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    var image = new Image();
    image.src = '/src/assets/test.png'
    image.onload = () => {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    }

    const uSampler = gl.getUniformLocation(program, 'uSampler');
    gl.uniform1i(uSampler, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, 96, gl.DYNAMIC_DRAW);

    const aVetrexCoord = gl.getAttribLocation(program, 'aVetrexCoord');
    gl.enableVertexAttribArray(aVetrexCoord);
    gl.vertexAttribPointer(aVetrexCoord, 2, gl.FLOAT, false, 8, 0);

    const vVertexTextureCord = gl.getAttribLocation(program, 'vVertexTextureCord');
    gl.enableVertexAttribArray(vVertexTextureCord);
    gl.vertexAttribPointer(vVertexTextureCord, 2, gl.FLOAT, false, 8, 48);
    gl.bufferSubData(gl.ARRAY_BUFFER, 48, textureCoords);
  });

  setInterval(() => {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, points);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, 1 / 60);
</script>

<template>
  <main>
    <canvas width="500" height="500" ref="cv"></canvas>
  </main>
</template>
