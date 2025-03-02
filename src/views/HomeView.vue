<script setup>
  import { ref, useTemplateRef, onMounted, watch } from 'vue';
  import '../TEST/MAIN.js';
  import '../TEST/index'
  
  var filterStrength = 20;
  var frameTime = ref(0), lastLoop = new Date, thisLoop;

  function gameLoop(){
    var thisFrameTime = (thisLoop=new Date) - lastLoop;
    frameTime.value += (thisFrameTime - frameTime.value) / filterStrength;
    lastLoop = thisLoop;
  }
  setInterval(() => { 
    gameLoop();
  }, 1 / 60);

</script>

<template>
  <main>
    <h1>{{(1000 / frameTime).toFixed(1) + " fps"}}</h1>
  </main>
</template>


