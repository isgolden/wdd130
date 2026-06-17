#version 300 es
precision lowp float;

in vec2 v_UVC;

uniform sampler2D tex;

out vec4 fragCol;

void main(){
	fragCol = texture(tex, v_UVC);
}
