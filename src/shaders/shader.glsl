precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;

vec3 sphereOrigin = vec3(5.0 * cos(u_time),0, 4);
float r = 1.0;
vec3 cubeOrigin = vec3(0,0,4);
vec3 cubeSize = vec3(1,1,1);

float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * h * k * (1.0 / 6.0);
}

float map(vec3 p) {
    float sphere = length(sphereOrigin - p) - r;
    float cube = length(max(abs(p - cubeOrigin) - cubeSize, 0.0));

    float ground = p.y + 0.75;

    return smin(sphere, cube, 3.0);
}

float raymarch(vec3 ro, vec3 rd) {
    float totalDist = 0.0;

    for (int i = 0; i < 100; i++) {
        vec3 p = ro + totalDist * rd;

        float dist = map(p);

        totalDist += dist;

        if (dist < 0.01 || dist > 50.0) break;
    }

    return totalDist;
}

void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;
    
    vec3 lo = vec3(0,0, 0.5);
    vec3 ro = vec3(0,0,-1);
    vec3 rd = normalize(vec3(uv, 1.0));

    float distance = raymarch(ro, rd);

    vec3 normal = normalize(ro + distance * rd);

    vec3 color = vec3(dot(normalize( lo), normal));

    if (distance < 50.0) {
        gl_FragColor = vec4(color, 1.0);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
