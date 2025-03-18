precision lowp float;

attribute vec2 aVetrexCoord;
attribute vec2 vVertexTextureCord;
varying vec2 vTextureCord;

void main() {
    vTextureCord = vVertexTextureCord;
    gl_Position = vec4(
        aVetrexCoord,
        0.0,
        1.0
    );
}