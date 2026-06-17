#version 300 es
precision lowp float;

in vec2 a_vertPos;
in vec2 a_UVCoords;

uniform vec2 u_scSize;
uniform vec2 u_texSize;

out vec2 v_UVC;

void main(){
	gl_Position = vec4(a_vertPos,0,1.0);
	v_UVC = a_UVCoords;
}
