precision lowp float;

attribute vec2 coordinates;
attribute vec2 scale;

void main() {
    gl_Position = vec4(
        coordinates.x * scale.x,
        coordinates.y * scale.y,
        0.0,
        1.0
    );
    gl_PointSize = 1.0;
}