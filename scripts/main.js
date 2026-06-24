let FPS = 60;
let fps = 1000/60; 
/* it would be nice to make a classs to define a getter function, 
but i can't justify an entire class without other drawing and 
frame management stuff. i could and it really wouldnt be a problem,
but it just feels wrong.
*/

const glCanv = document.getElementById("glCanv");
const gl = glCanv.getContext("webgl2");

if(!gl){
	console.error("ERROR: your browser does not support webgl2, sorry :(");
}

let W = glCanv.width = window.innerWidth;
let H = glCanv.height = window.innerHeight;
gl.viewport(0,0,W,H);

function vec2(x,y){
	return {x:x||0,y:y||0};
}
function vec3(x,y,z){
	return {x:x||0,y:y||0,z:z||0};
}
function vec4(x,y,z,w){
	return {x:x||0,y:y||0,z:z||0,w:w||0};
}

function dCopy(obj,depth,mDepth){
	let out = {};
	mDepth = mDepth || 10;
	depth--;
	if(depth < 0){
		reutrn;
	}
	if(typeof obj === "Object"){
		for(let i in obj){
			out[i] = dCopy(obj[i]);
		}
		return out;
	}
	return obj;
}

let mx = 0;
let my = 0;

class CMD {
	static maxHistLen = 2000; // in chars
	static tempest(){}
	static exec(str){
		const opt = str.split(" ");
		if(!CMD[opt[0]]){
			return;
		}
	}
	hist = [];
	buffer = []; // array of chars, so we dont have to manipulate strings directly. is this even better?
	
}

class RENDER {
	/*
	the all powerfull render class, acts as a simple wrapper for the webgl2 api. you are free to use this if you want but you could probably do better.
	
included are uniforms, vertex attributes, VAOs, textures and framebuffers.

USAGE:

initiate a new render by providing it with two html tags, first for the vertex shader and then fragment shader. it automatically creates and compiles a program. 
-
const example = new RENDER("vertexTag","fragmentTag");
-
set up vertex attributes using the addVertAttrib(s) method, which needs the name as seen in the source and its size, as well as a bool for if the data should be normalized. initiate and finish the vertex attributes by calling the initVertAttribs method.
-
example.addVertAttrib("a_some3DVector",3,true);
example.addVertAttribs("a_some2DVector",2,false,"a_someValue",1,false);
example.initVertAttribs();
-
textures are held in a global array between all instances, and are accessed using their indicies, i may change this for object/keys instead as they are easier to work with for minimal performance cost, but it is what it is now.
to add textures, pass in any valid data to the RENDER.addTex method (Float32Array, image data, blobs) and their size. a texture index can also be specified for easier access, but if there is already a texture there it will override it. this method will return the texture index.

-
const canv = document.getElementById("texCanv");
const tW = canv.width;
const tH = canv.height;
const ctx = canv.getContext("2d");
ctx.fillStyle = "red";
ctx.fillRect(10,10,tW-20,tH-20);
RENDER.addTex(ctx.getImageData(0,0,tW,tH),tW,tH,0); // put in texture index 0
-
to actually pass in the vertex data, create a group with the createGroup(s) method. groups are simply collections of vertex, index and texture data that can be drawn and cleared seperately. the main reason for having them is if you want to render multiple things with the same shader but differing uniform values and textures.
a group needs a name and a texture index. if no texture is needed, keep it blank or put -1.
to put data in that group, use the groupData method, which requires the name of the group, two arrays containing the vertex nd index data, and a bool indicating if the index array given starts at 0 (false or leave blank) or at the end of the last index (true).
groups can be drawn individually with drawGroup, and can also be drawn together (in given order) with drawGroups. drawAllGroups can be used to draw all available groups.
similarly, clearGroup will clear the data of a given group, clearGroups for multiple, and clearAllGroups for all.
deleteGroups follows the same syntax to permanently remove a group.
while textures can be set when initializing a group, you can also change it any time using the assignTex method with the name of your group and texture index.
-
let v = [
	0,0,0, 0,0, 1,
	1,0,0, 0,1, 2,
	1,0,1, 1,1, 4,
	1,1,1, 1,0, 3
];
let i = [
	0,1,2,
	2,3,0
];
example.createGroup("main",0);
exglCanv.width = texCanv.width = W;
glCanv.height = texCanv.height = H;
gl.viewport(0,0,W,H);ample.createGroup("second",1);
example.groupData("main",v,i); // offset left blank for false
example.groupData("second",v,i);

example.drawGroup("main");
example.drawGroups("second","main"); //second will be drawn fi
rst
example.assignTex("main",1);
example.drawAllGroups();

example.clearGroup("main");

example.deleteAllGroups();
-
framebuffers are known as renderTexs in this class, and are made up of an already defined texture and a couple of settings. first create a texture using RENDER.addTex, data should be null and the size the same as your framebuffer's, then use RENDER.addRenderTex and pass in a name, texture index and its size.
to render to the framebuffer, use the bindRenderTex method with the name of the framebuffer to bind it, draw some group(s), then unbind using the unbindRenderTex method.
deleting a frambuffer with a given name can be done with the deleteRenderTex method.
-
// it can be anything, but often you will be rendering the entire screen for post processing
const W = window.innerWidth;
const h = window.innerHeight;
RENDER.addTex(null,W,H,2);
RENDER.addRenderTex("mag",2,W,H);

example.bindRenderTex("mag");
example.drawAllGroups();
example.unbindRenderTex();

example.asignTex("main",2);
example.drawAllGroups();
-
	*/
	static texs = []; // if i need to unload a texture or something, then changing this to an object would be ideal.
	static fBs = {};
	
	BPF = 4;
	
	prog;
	
	VAO;
	vb;
	ib;
	BPV = 0;
	unifs = {};
	vertAttribs = {};
	
	vCount = 0;
	
	groups = {};
	texs = [];
	
	constructor(vsTag,fsTag){
		const vsSrc = document.getElementById(vsTag).innerText || vsTag;
		const fsSrc = document.getElementById(fsTag).innerText || fsTag;
		this.prog = RENDER.createProgram(vsSrc,fsSrc);
		gl.useProgram(this.prog);
		this.VAO = gl.createVertexArray();
		gl.bindVertexArray(this.VAO);
		this.vb = gl.createBuffer();
		this.ib = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER,this.vb);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.fb);
		gl.bindVertexArray(null);
		return this;
	}
	
	static createProgram(vss,fss){
		const prog = gl.createProgram();
		let vs = gl.createShader(gl.VERTEX_SHADER);
		let fs = gl.createShader(gl.FRAGMENT_SHADER);
		gl.shaderSource(vs,vss);
		gl.shaderSource(fs,fss);
		gl.compileShader(vs);
		gl.compileShader(fs);
		if(!gl.getShaderParameter(vs,gl.COMPILE_STATUS)){
			console.log("ERROR : vertex shader failed to compile: " + gl.getShaderInfoLog(vs));
		}
		if(!gl.getShaderParameter(fs,gl.COMPILE_STATUS)){
			console.log("ERROR : fragment shader failed to compile: " + gl.getShaderInfoLog(fs));
		}
		gl.attachShader(prog,vs);
		gl.attachShader(prog,fs);
		gl.linkProgram(prog);
		if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){
			console.log("ERROR : program failed to link: " + gl.getProgramInfoLog(prog));
		}
		return prog;
	}
	
	use(){
		gl.useProgram(this.prog);
		gl.bindBuffer(gl.ARRAY_BUFFER,this.vb);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ib);
		gl.bindVertexArray(this.VAO);
	}
	
	createGroup(name,tex){
		if(name === undefined){
			name = Object.keys(this.groups).length;
			// this is probably not good
		}
		if(tex === undefined){
			tex = -1;
		}
		this.groups[name] = {
			v:[],
			i:[],
			tex:tex,
		};
		return name;
	}
	createGroups(){
		for(let i = 0; i < arguments.length; i += 2){
			if(arguments[i+1] === undefined){continue;}
			this.createGroup(arguments[i],arguments[i+1]);
		}
	}
	groupData(name,vd,id,shouldOffset){
		const iOff = this.groups[name].v.length/(this.BPV/this.BPF);
		this.groups[name].v.push(...vd);
		if(!shouldOffset){
		//glorious
		this.groups[name].i.push(...(id.map((val)=>{return val+iOff;})));
		return;
		}
		this.groups[name].i.push(...id);
	}
	clearGroup(name){
		this.groups[name].i = [];
		this.groups[name].v = [];
	}
	clearGroups(){
		for(let i = 0; i < arguments.length; i++){
			this.clearGroup(arguments[i]);
		}
	}
	clearAllGroups(){
		for(let i in this.groups){
			this.clearGroup(i);
		}
	}
	drawGroup(name){
		const g = this.groups[name];
		if(g.tex != -1 && RENDER.texs[g.tex] === undefined){
			throw new Error("Texture index of " + g.tex + " does not exist");
		}
		gl.bindTexture(gl.TEXTURE_2D,RENDER.texs[g.tex]);
		gl.bindVertexArray(this.VAO);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.ib);
		gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.v),gl.DYNAMIC_DRAW);
		
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(g.i),gl.DYNAMIC_DRAW);
		gl.drawElements(gl.TRIANGLES,g.i.length,gl.UNSIGNED_SHORT,0);
		gl.bindVertexArray(null);
	}
	drawGroups(){
		 // add future optimzation, combine buffers if texture is the same
		for(let i = 0; i < arguments.length; i++){
			this.drawGroup(arguments[i]);
		}
		
	}
	drawAllGroups(){
		for(let i in this.groups){
			this.drawGroups(i)
		}
	}
	deleteGroup(name){
		delete this.groups[name];
	}
	deleteGroups(){
		for(let i = 0; i < arguments.length; i++){
			delete this.groups[arguments[i]];
		}
	}
	deleteAllGroups(){
		for(let i in this.groups){
			delete this.groups[i];
		}
	}
	
	addVertAttrib(name,size,normal){
		normal = normal || false;
		gl.bindVertexArray(this.VAO);
		this.vertAttribs[name] = {
			loc:gl.getAttribLocation(this.prog,name),
			size:size,
			norm:normal
		}
		this.BPV += size*this.BPF; 
	}
	addVertAttribs(){
		for(let i = 0 ;i < arguments.length; i+=3){
			if(arguments[i+2] === undefined){continue;}
			this.addVertAttrib(arguments[i],arguments[i+1],arguments[i+2]);
		}
	}
	initVertAttribs(){
		gl.bindVertexArray(this.VAO);
		let off = 0;
		for(let i in this.vertAttribs){
			const va = this.vertAttribs[i];
			gl.vertexAttribPointer(
			va.loc,
			va.size,
			gl.FLOAT,
			va.norm,
			this.BPV,
			off
			);
			gl.enableVertexAttribArray(va.loc);
			let err = gl.getError();
			if(err){
				console.log("Error when initializing vertex Attribute " + i + " : " + err);
			}
			off += va.size*this.BPF;
		}
		gl.bindVertexArray(null);
	}
	
	addUnif(name,type){
		this.unifs[name] = {
			loc:gl.getUniformLocation(this.prog,name),
			type:"uniform" + type,
			val:[...arguments].slice(2),
		}; 
		if(type.length > 5){
			this.unifs[name].isMatrix = true;
			this.unifs[name].val.unshift(false);
		}
		if(arguments.length > 2){
			gl["uniform"+type](this.unifs[name].loc,...this.unifs[name].val);// this is horrendus
		}
	}
	addUnifs(){
		let temp = [];
		for(let i = 0; i < arguments.length; i++){
			if(arguments[i] instanceof String || typeof arguments[i] === "string"){
				if(i !== 0){
					this.addUnif.apply(this,temp);// finally get to use the apply function. this never happens
					temp = [];
				}
				temp.push(arguments[i],arguments[i+1]);
				i++;
				continue;
			}
			temp.push(arguments[i]);
		}
		this.addUnif.apply(this,temp);
	}
	unifValue(name){
		const u = this.unifs[name];
		u.val = [...arguments].slice(1).toSpliced(0,0,u.loc);// simple enough, right? might be kind of slow, ill know in the future ig
		if(u.isMatrix){
			u.val.splice(1,0,false); 
		}
		gl[u.type].apply(gl,u.val); 
		let err = gl.getError();
		if(err){
			console.log("error when setting uniform " + name + " : " + err);
		}
	}
	
	static addTex(data,w,h,ind){
		const tex = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D,tex);
		gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		if(ind){
			RENDER.texs[ind] = tex;
			return ind;
		}
		RENDER.texs.push(tex);
		return RENDER.texs.length-1;
	}// specifically doesnt unbind texture so you can change the paramerters
	static deleteTex(ind){
		delete RENDER.texs[ind];
	}
	static addRenderTex(name,tInd,w,h){
		w = w || W;
		h = h || H;
		const rt = RENDER.texs[tInd];
		if(!rt){
			throw new Error("Cannot texture to frame buffer as texture of index " + tInd + " does not exist.");
		}
		const fb = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER,fb);
		gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,rt,0);
		RENDER.fBs[name] = fb;
		gl.bindFramebuffer(gl.FRAMEBUFFER,null);
	}
	
	assignTex(name,index){
		if(!RENDER.texs[index]){
			throw new Error("Cannot assign texture of index " + index + " as it does not exist.");
		}
		this.groups[name].tex = index;
	}
	bindRenderTex(name){
		gl.bindFramebuffer(gl.FRAMEBUFFER,RENDER.fBs[name]);
	}
	unbindRenderTex(){
		gl.bindFramebuffer(gl.FRAMEBUFFER,null);
	}
	deleteRenderTex(name){
		delete RENDER.fBs[name];
	}
	
}

class MINUI {
static shd;
// need to handle images, spacing. i should prolly base it off the box model. need a parse function to import style from text.


}// minimal UI class/handler, i might use this for the actual websites, but i would rather create webpages dynamically and  use absolutely positioned divs.

class WHIM {
	// sizing stuff because that is always the biggest pain.
	static DOMParent = document.getElementById("webContent");
	
	static WINDOW = 2;// modes because enums are dead and we killed them
	static MAX = 1;
	static MIN = 0;
	
	static resizeMargin = 5;
	
	static ws = {};// a bad system for drawing order
	static ord = [];
	
	// all in 1/vh or 1/vw
	static defTopBarH = 0.05;
	static defWHIMMin = vec2(0.2,0.2);
	static minSize = 150;
	
	static wClose(name){
		WHIM.ws[name].node.remove();
		for(let i = 0; i < WHIM.ord.length; i++){
			if(WHIM.ord[i] === name){
				ord.splice(i,1);
			}
		}
		delete WHIM.ws[name];
	}
	static wMin(name){
		WHIM.ws[name].mode = WHIM.MIN;
		WHIM.ws[name].node.style.display = "none";
		// add it into the bottom bar TODO
	}
	static wMax(name){
		const win = WHIM.ws[name];
		const s = win.node.style;
		if(win.mode === WHIM.MAX){
			win.mode = WHIM.WINDOW;
			s.left = win.x+"px";
			s.top = win.y+"px";
			s.width = win.w+"px";
			s.height = win.h+"px";
			return;
		}
		win.mode = WHIM.MAX;
		s.left = 0+"px";
		s.top = 0+"px";
		s.width = "100vw";
		s.height = "100vh";
	}
	
	static onClose(e){
		let name = e.currentTarget.name;
		if(!name){return;}
		WHIM.wClose(name);
	}
	static onMax(e){
		let name = e.currentTarget.name;
		if(!name){return;}
		WHIM.wMax(name);
	}
	static onMin(e){
		let name = e.currentTarget.name;
		if(!name){return;}
		WHIM.wMin(name);
	}
	static onMove(e){
		let name = e.currentTarget.name;
		if(!name){return;}
		WHIM.ws[name].moveSel = true;
	}
	
	static handleClick(e){
		for(let i in WHIM.ws){
			WHIM.ws[i].handleClick(e);
		}
	}
	static handleUnclick(e){
		for(let i in WHIM.ws){
			WHIM.ws[i].handleUnclick(e);
		}
	}
	static update(){
		for(let i in WHIM.ws){
			WHIM.ws[i].update();
		}
	}
	
	static createNavBarTemplate(name,href){
		const cont = document.createElement("div");
		const bar = document.createElement("input");
		const back = document.createElement("button");
		const forward = document.createElement("button");
		const reload = document.createElement("button");
		
		bar.name = name;
		back.name = name;
		forward.name = name;
		reload.name = name;
		
		bar.type = "text";
		
		cont.className = "WHIMWebNav"
		bar.className = "WHIMSearch";
		back.className = "WHIMBack";
		forward.className = "WHIMForward";
		reload.className = "WHIMReload";
		
		reload.innerText = "reload";
		forward.innerText = ">";
		back.innerText = "<";
		
		bar.classList.add("WHIMInfoButton");
		back.classList.add("WHIMNInfoButton");
		forward.classList.add("WHIMInfoButton");
		reload.classList.add("WHIMInfoButton");

		back.addEventListener("click",WHIM.handleBack);
		forward.addEventListener("click",WHIM.handleForward);
		reload.addEventListener("click",WHIM.handleReload);


		bar.value = href;
		
		cont.appendChild(reload);
		cont.appendChild(back);
		cont.appendChild(forward);
		cont.appendChild(bar);

		return [cont,bar];
	}
	static createWindowTemplate(name,x,y,w,h,hasNav){
		let wind = document.createElement("div");
		let content = document.createElement("div");
		let topbar = document.createElement("div");
		let infobar = document.createElement("div");
		let title = document.createElement("p");
		let close = document.createElement("button");
		let maxim = document.createElement("button");
		let minim = document.createElement("button");
		let nav = document.createElement("div");
		
		// i would follow the standard of data-name, but i would have to scesss it via array notation.
		topbar.name = name;
		close.name = name;
		minim.name = name;
		maxim.name = name;
		
		close.addEventListener("click",WHIM.onClose);
		maxim.addEventListener("click",WHIM.onMax);
		minim.addEventListener("click",WHIM.onMin);
		topbar.addEventListener("mousedown",WHIM.onMove);
		
		close.innerHTML = "x";
		minim.innerHTML = "-";
		maxim.innerHTML = "ðŸ—–";
		title.innerHTML = name;
		
		close.className = "WHIMNavButton";
		minim.className = "WHIMNavButton";
		maxim.className = "WHIMNavButton";
		title.className = "WHIMTitle";
		
		nav.appendChild(minim);
		nav.appendChild(maxim);
		nav.appendChild(close);
		topbar.appendChild(title);
		topbar.appendChild(nav);
		infobar.appendChild(topbar);
		
		nav.className = "WHIMNav";
		topbar.className = "WHIMTopBar";
		infobar.className = "WHIMInfoBar";
		content.className = "WHIMContent";
		wind.appendChild(infobar);
		wind.appendChild(content);
		
		wind.className = "WHIMPage";
		wind.style.left = x+"px";
		wind.style.top = y+"px";
		wind.style.width = w+"px";
		wind.style.height = h+"px";
		
		let navFrame = 0;

		if(hasNav){
			navFrame = WHIM.createNavBarTemplate(name,WHIM.ws[name].src);
			infobar.appendChild(navFrame[0]);
		}
		
		return [wind,content,navFrame[0],navFrame[1]];
	}
	
	static handleLink(e){
		let href = e.target.contentWindow.location.href;
		let whim = WHIM.ws[e.target.name];
		whim.src = href;
		whim.title.innerHTML = e.target.contentDocument.title;
		whim.bar.value = href;
		if(whim.history[whim.history.length-1] !== href){
			whim.history.push(href);
		}
		if(whim.future[0] !== href && !whim.backing){
			whim.future = [];
		}
		whim.backing = false;
	}

	static handleBack (e){
		const whim = WHIM.ws[e.target.name];
		if(whim.history.length <= 1){return;}
		whim.future.push(whim.src);// these might get desynced
		whim.history.pop();
		whim.frame.src = whim.history[whim.history.length-1];// first is the website we are currently on.
		whim.backing = true;
		console.log(whim.future, whim.history);
	}
	static handleForward (e){
		const whim = WHIM.ws[e.target.name];
		if(whim.future.length === 0){return;}
		whim.frame.src = whim.future[0];
		whim.future.splice(0,1);
		console.log(whim.future, whim.history);
	}
	static handleReload (e){
		const whim = WHIM.ws[e.target.name];
		whim.frame.contentWindow.location.reload();
	}
	
	history = []
	future = []
	backing = false;

	node;
	frame;
	src;
	bar;
	title;
	x = 0;
	y = 0;
	w = 100;
	h = 100;
	mOff = vec2();
	mode = WHIM.WINDOW;
	
	moveSel = false;
	pPos = vec2();
	pSize = vec2();
	rSel = vec2();
	mOff = vec2();
	
	constructor(name,x,y,w,h,href,mode){
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.src = href;
		this.mode = mode || this.mode;
		WHIM.ws[name] = this;//overriding other windows, maybe have a better system?
		let tmp = WHIM.createWindowTemplate(name,x,y,w,h,true);
		tmp[0].id = name;
		tmp[0]["z-index"] = 0;

		this.bar = tmp[3]
		this.frame = document.createElement("iframe");
		if(href){
			if(href.substring(0,3) !== "http"){
				href = URL.parse(href,window.location.href);
			}
			this.frame.src = href;
			tmp[1].appendChild(this.frame);
		}

		this.frame.name = name;
		this.frame.onload = WHIM.handleLink;
		this.node = WHIM.DOMParent.appendChild(tmp[0]);

		this.title = document.querySelector(`#${name} .WHIMTitle`);
	}
	handleClick(e){
		const box = this.node.getBoundingClientRect();
		if(mx > box.right || mx < box.left || my > box.bottom || my < box.top){
			return;
		}
		this.mOff.x = mx;
		this.mOff.y = my;
		this.pPos.x = parseFloat(this.node.style.left);
		this.pPos.y = parseFloat(this.node.style.top);
		this.pSize.x = parseFloat(this.node.style.width);
		this.pSize.y = parseFloat(this.node.style.height);
		if(mx > box.right-WHIM.resizeMargin){
			this.rSel.x = 1;
		}else if(mx < box.left+WHIM.resizeMargin){
			this.rSel.x = -1;
		}
		if(my > box.bottom-WHIM.resizeMargin){
			this.rSel.y = 1;
		}else if(my < box.top+WHIM.resizeMargin){
			this.rSel.y = -1;
		}
	}
	handleUnclick(e){
		this.rSel = vec2();
		this.node.style.cursor = "";
		this.moveSel = false;
	}
	update(){
		if(this.mode !== WHIM.WINDOW){return;}
		if(this.rSel.x){
			this.node.style.cursor = "col-resize";
			this.x = this.pPos.x+Math.min(mx-this.mOff.x,this.pSize.x-WHIM.minSize)*(this.rSel.x < 0);
			this.w = this.pSize.x-(mx-this.mOff.x)*(2*(this.rSel.x < 0)-1);
		}
		if(this.rSel.y){
			this.node.style.cursor = "row-resize";
			this.y = this.pPos.y+Math.min(my-this.mOff.y,this.pSize.y-WHIM.minSize)*(this.rSel.y < 0);
			this.h = this.pSize.y-(my-this.mOff.y)*(2*(this.rSel.y < 0)-1);
		}
		if(this.moveSel){
			this.x = mx+(this.pPos.x-this.mOff.x);
			this.y = my+(this.pPos.y-this.mOff.y);
		}
		this.node.style.left = this.x + "px";
		this.node.style.top = this.y + "px";
		this.node.style.width = this.w + "px";
		this.node.style.height = this.h + "px";
		
	}
}// a work in progress window manager that is extremely barebones and not really based on anything.              

class ICO {
	static DOMParent = document.getElementById("webContent");// i have this in multiple places. make a global.

	static ics = {};
	static dOrd = [];
	static createIconTemplate(name,icoPath){
		const contain = document.createElement("div");
		const icon = document.createElement("img");
		const label = document.createElement("p");
		
		contain.className = "ICO";
		icon.className = "ICOIcon";
		label.className = "ICOName";
		
		contain.name = name;
		
		icon.src = icoPath;
		label.innerHTML = name;
		
		contain.appendChild(icon);
		contain.appendChild(label);
		
		return contain;
	}
	static onDBClick(name){
		const ico = ICO.ics[name];
		CMD.exec(ico.exec);
	}
	exec = "";
	node;
	icon;
	title;
	sel = false;
	pos = vec3();
	
	constructor(x,y,name,icoPath){
		const ico = ICO.createIconTemplate(name,icoPath);
		ico.style.left = x+"px";
		ico.style.top = y+"px";
		
		this.node = ICO.DOMParent.appendChild(ico);
		this.node.addEventListener("dbclick",ICO.onDBClick);
		ICO.ics[name] = this;
	}
	
}

let whim = new WHIM("Welcome",100,100,550,550,"pages/portal.html");
// const icon = new ICO(100,100,"Homepage","img/spinning-ia-logo.gif");

const time = new Date();
const clock = document.getElementById("clock");

let fCount = 0;
let then = 0;
let shouldResize = false;
function draw(dt){
	WHIM.update();
	let mins = time.getMinutes().toString();
	if(time.getMinutes() < 10){
		mins = "0"+mins;
	}
	clock.innerHTML = `${time.getHours()%12}:${mins} ${time.getHours()<12?"AM":"PM"}`; 
}

gl.clearColor(1,1,0,1);
gl.clear(gl.COLOR_BUFFER_BIT);

window.cancelAnimationFrame(window.parent.LAF);
// handles edge case where the code reloads without the animation frame doesnt.
//incredibly annoying when it happens, but very rarely happening.


function loop(now){
	const dt = now-then;
	if(dt < fps){
		window.parent.LAF = window.requestAnimationFrame(loop);
		return;
	}
	if(window.innerWidth !== W || window.innerHeight !== H){
		shouldResize = true;
		W = window.innerWidth;
		H = window.innerHeight;
		gl.viewport(0,0,W,H);
		glCanv.width = W;
		glCanv.height = H;
	}
	then = now;
	fCount++;
	draw(dt/1000);
	// reserved for input handeling/resetting
	window.parent.LAF = window.requestAnimationFrame(loop);
	shouldResize = false;
}

loop();

document.addEventListener("mousemove",function(e){
	mx = e.clientX;
	my = e.clientY;
	if(mx < 0){
		mx = 0;
	}
	if(mx > W){
		mx = W;
	}
	if(my < 0){
		my = 0;
	}
	if(my > H){
		my = H;
	}
});
document.addEventListener("mousedown",function(e){
	WHIM.handleClick(e);
});
document.addEventListener("mouseup",function(e){
	WHIM.handleUnclick(e);
});