#version 300 es
precision lowp float;

in vec2 vertPos;

void main(){
	gl_Position = vec4(vertPos,0,1.0);
}
