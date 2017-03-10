/*
MIT LICENSE
Copyright (c) 2016 iTisso
https://github.com/iTisso/CanvasObjLibrary
varsion:2.0
*/
'use strict';
import '../lib/setImmediate/setImmediate.js'
import Promise from '../lib/promise/promise.js'

if (!window.Promise)window.Promise = Promise;

const defProp=Object.defineProperty;


//class:CanvasObjLibrary
class CanvasObjLibrary{
	constructor(canvas){
		if(canvas instanceof HTMLCanvasElement === false)
			throw(new TypeError('canvas required'));
		const COL=this;
		Object.assign(this,{
			/*The main canvas*/
			canvas,
			/*Canvas' context*/
			context: canvas.getContext('2d'),
			default:{
				/*default font*/
				font:{
					fontStyle: null,
					fontWeight: null,
					fontVariant: null,
					color: "#000",
					textAlign:'start',//left right center start end
					lineHeight: null,
					fontSize: 14,
					fontFamily: "Arial",
					strokeWidth: 0,
					strokeColor: "#000",
					shadowBlur: 0,
					shadowColor: "#000",
					shadowOffsetX:0,
					shadowOffsetY:0,
					fill:true,
					reverse:false,
					//vertical:false,//abandoned
					//textBaseline: "middle",//abandoned
				},
				style:{
					width:1,
					height:1,
					hidden:false,
					opacity:1,
					clipOverflow:false,
					backgroundColor:null,
					composite:null,
					debugBorderColor:'black',
					x:0,
					y:0,
					zoomX:1,
					zoomY:1,
					rotate:0,
					rotatePointX:0,
					rotatePointY:0,
					positionPointX:0,
					positionPointY:0,
					zoomPointX:0,
					zoomPointY:0,
					skewX:1,
					skewY:1,
					skewPointX:0,
					skewPointY:0,
				},
			},
			stat:{
				mouse:{
					x:null,
					y:null,
					previousX:null,
					previousY:null,
				},
				/*The currently focused on obj*/
				onfocus: null,
				/*The currently mouseover obj*/
				onover: null,
				canvasOnFocus: false,
				canvasOnover: false,

			},
			tmp:{
				graphID:0,
				onOverGraph:null,
				toClickGraph:null,
				matrix1:new Float32Array([1,0,0,0,1,0]),
				matrix2:new Float32Array([1,0,0,0,1,0]),
				matrix3:new Float32Array([1,0,0,0,1,0]),
			},
			
			root: null,//root Graph

			class:{},

			autoClear:true,
			//Debug info
			debug:{
				switch:false,
				count:0,
				frame:0,
				FPS:0,
				_lastFrameTime:Date.now(),
				on:function(){
					this.switch=true;
				},
				off:function(){
					this.switch=false;
				},
			},
		});
		//set classes
		for(let c in COL_Class)this.class[c]=COL_Class[c](this);

		//init root graph
		this.root=new this.class.FunctionGraph();
		this.root.name='root';
		//prevent root's parentNode being modified
		defProp(this.root,'parentNode',{configurable:false});

		//adjust canvas drawing size
		this.adjustCanvas();

		//const canvas=this.canvas;
		//add events
		addEvents(canvas,{
			mouseout:e=>{
				this.stat.canvasOnover=false;
				//clear mouse pos data
				this.stat.mouse.x=null;
				this.stat.mouse.y=null;
				//clear onover obj
				const onover=this.stat.onover;
				this._commonEventHandle(e);
				this.stat.onover=null;
			},
			mouseover:e=>{
				this.stat.canvasOnover=true;
			},
			mousemove:e=>{
				this.tmp.toClick=false;
				this._commonEventHandle(e)
			},
			mousedown:e=>{
				this.tmp.toClickGraph=this.stat.onover;
				this.stat.canvasOnFocus=true;
				this.stat.onfocus=this.stat.onover;
				this._commonEventHandle(e)
			},
			mouseup:e=>this._commonEventHandle(e),
			click:e=>{
				if(this.tmp.toClickGraph)
					this._commonEventHandle(e)
			},
			dblclick:e=>this._commonEventHandle(e),
			selectstart:e=>e.preventDefault(),
			wheel:e=>{
				const ce=new this.class.WheelEvent('wheel');
				ce.origin=e;
				(this.stat.onover||this.root).emit(ce);
			},
		});
		addEvents(document,{
			mousedown:e=>{
				if(e.target!==this.canvas){this.stat.canvasOnFocus=false;}
			},
			mouseout:e=>{
				if(this.stat.mouse.x !== null){
					const eve=new window.MouseEvent('mouseout');
					this.canvas.dispatchEvent(eve);
				}
			},
			keydown:e=>this._commonEventHandle(e),
			keyup:e=>this._commonEventHandle(e),
			keypress:e=>this._commonEventHandle(e),

		});
	}
	generateGraphID(){return ++this.tmp.graphID;}
	adjustCanvas(width=this.canvas.offsetWidth,height=this.canvas.offsetHeight){
		this.root.style.width =this.canvas.width= width;
		this.root.style.height =this.canvas.height= height;
		const ce=new this.class.Event('resize');
		this.root.emit(ce);
	}
	_commonEventHandle(e){
		if(e instanceof MouseEvent){
			this.stat.previousX=this.stat.mouse.x;
			this.stat.previousY=this.stat.mouse.y;
			if(e.type==='mouseout'){
				this.stat.mouse.x=null;
				this.stat.mouse.y=null;
			}else{
				this.stat.mouse.x=e.layerX;
				this.stat.mouse.y=e.layerY;
			}
			const ce=new this.class.MouseEvent(e.type);
			ce.origin=e;
			(this.stat.onover||this.root).emit(ce);
		}else if(e instanceof KeyboardEvent){
			if(!this.stat.canvasOnFocus)return;
			const ce=new this.class.KeyboardEvent(e.type);
			ce.origin=e;
			(this.stat.onfocus||this.root).emit(ce);
		}
	}
	clear(){
		this.context.clearRect(0,0,this.canvas.width,this.canvas.height);
	}
	draw(){
		this.debug.count=0;
		this.debug.frame++;
		this.autoClear&&this.clear();
		this.traverseGraphTree(0);
		this.debug.switch&&this.drawDebug();
	}
	/*
		traverse mode
			0	draw graphs and check onover graph
			1	check onover graph
	*/
	traverseGraphTree(mode=0){
		this.context.setTransform(1,0,0,1,0,0);
		this.drawGraph(this.root,mode);
		const oldOnover=this.stat.onover;
		if(this.tmp.onOverGraph!==oldOnover){//new onover graph
			this.tmp.toClickGraph=null;
			this.stat.onover=this.tmp.onOverGraph;
			if(oldOnover)oldOnover.emit(new this.class.MouseEvent('mouseout'));
			if(this.stat.onover)this.stat.onover.emit(new this.class.MouseEvent('mouseover'));
		}
		this.tmp.onOverGraph=null;
	}
	drawDebug(){
		const ct=this.context,d=this.debug,s=this.stat,n=Date.now(),x=this.stat.mouse.x,y=this.stat.mouse.y;
		//fps
		d.FPS=(1000/(n-d._lastFrameTime)+0.5)|0;
		d._lastFrameTime=n;
		//draw
		ct.save();
		ct.beginPath();
		ct.setTransform(1, 0, 0, 1, 0, 0);
		ct.font = "16px Arial";
		ct.textBaseline = "bottom";
		ct.globalCompositeOperation = "lighter";
		ct.fillStyle = "red";
		ct.fillText("point:" + String(x) + "," + String(y) + " FPS:" + d.FPS + " Items:" + d.count+" Frame:"+d.frame, 0, this.canvas.height);
		ct.fillText("onover:" + (s.onover ? s.onover.GID: "null") + " onfocus:" + (s.onfocus ? s.onfocus.GID: "null"), 0, this.canvas.height - 20);
		ct.strokeStyle = "red";
		ct.globalCompositeOperation = "source-over";
		ct.moveTo(x, y + 6);
		ct.lineTo(x, y - 6);
		ct.moveTo(x - 6, y);
		ct.lineTo(x + 6, y);
		ct.stroke();
		ct.restore();
	}

	drawGraph(g,mode=0){
		if(g.style.hidden===true)return;
		const 	ct=this.context,
				style=g.style,
				M=this.tmp.matrix1,
				tM=this.tmp.matrix2,
				_M=this.tmp.matrix3;
		this.debug.count++;
		ct.save();
		if(mode===0){
			if(style.composite)ct.globalCompositeOperation = style.composite;
			if(style.opacity!==ct.globalAlpha)ct.globalAlpha = style.opacity;
		}
		//position & offset
		M[0]=1;M[1]=0;M[2]=style.x-style.positionPointX;
		M[3]=0;M[4]=1;M[5]=style.y-style.positionPointY;
		if(style.skewX!==1 || style.skewY!==1){
			if(style.skewPointX!==0 || style.skewPointY!==0){
				_M[0]=1;_M[1]=0;_M[2]=style.skewPointX;_M[3]=0;_M[4]=1;_M[5]=style.skewPointY;
				multiplyMatrix(M,_M,tM);
				_M[0]=style.skewX;_M[2]=0;_M[4]=style.skewY;_M[5]=0;
				multiplyMatrix(tM,_M,M);
				_M[0]=1;_M[2]=-style.skewPointX;_M[4]=1;_M[5]=-style.skewPointY;
				multiplyMatrix(M,_M,tM);
			}else{
				_M[0]=style.skewX;_M[1]=0;_M[2]=0;_M[3]=0;_M[4]=style.skewY;_M[5]=0;
				multiplyMatrix(M,_M,tM);
			}
			M.set(tM);	
		}
		//rotate
		if(style.rotate!==0){
			const 	s=Math.sin(style.rotate* 0.0174532925),
					c=Math.cos(style.rotate* 0.0174532925);
			if(style.rotatePointX!==0 || style.rotatePointY!==0){
				_M[0]=1;_M[1]=0;_M[2]=style.rotatePointX;_M[3]=0;_M[4]=1;_M[5]=style.rotatePointY;
				multiplyMatrix(M,_M,tM);
				_M[0]=c;_M[1]=-s;_M[2]=0;_M[3]=s;_M[4]=c;_M[5]=0;
				multiplyMatrix(tM,_M,M);
				_M[0]=1;_M[1]=0;_M[2]=-style.rotatePointX;_M[3]=0;_M[4]=1;_M[5]=-style.rotatePointY;
				multiplyMatrix(M,_M,tM);
			}else{
				_M[0]=c;_M[1]=-s;_M[2]=0;_M[3]=s;_M[4]=c;_M[5]=0;
				multiplyMatrix(M,_M,tM);
			}
			M.set(tM);
		}
		//zoom
		if(style.zoomX!==1 || style.zoomY!==1){
			if(style.zoomPointX!==0 || style.zoomPointY!==0){
				_M[0]=1;_M[1]=0;_M[2]=style.zoomPointX;_M[3]=0;_M[4]=1;_M[5]=style.zoomPointY;
				multiplyMatrix(M,_M,tM);
				_M[0]=style.zoomX;_M[2]=0;_M[4]=style.zoomY;_M[5]=0;
				multiplyMatrix(tM,_M,M);
				_M[0]=1;_M[2]=-style.zoomPointX;_M[4]=1;_M[5]=-style.zoomPointY;
				multiplyMatrix(M,_M,tM);
			}else{
				_M[0]=style.zoomX;_M[1]=0;_M[2]=0;_M[3]=0;_M[4]=style.zoomY;_M[5]=0;
				multiplyMatrix(M,_M,tM);
			}
			M.set(tM);
		}
		ct.transform(M[0],M[3],M[1],M[4],M[2],M[5]);
		if(this.debug.switch && mode===0){
			ct.save();
			ct.beginPath();
			ct.globalAlpha=0.5;
			ct.globalCompositeOperation = 'source-over';
			ct.strokeStyle=style.debugBorderColor;
			ct.strokeWidth=1.5;
			ct.strokeRect(0,0,style.width,style.height);
			ct.strokeWidth=1;
			ct.globalAlpha=1;
			ct.strokeStyle='green';
			ct.strokeRect(style.positionPointX-5,style.positionPointY-5,10,10);
			ct.strokeStyle='blue';
			ct.strokeRect(style.rotatePointX-4,style.rotatePointX-4,8,8);
			ct.strokeStyle='olive';
			ct.strokeRect(style.zoomPointX-3,style.zoomPointX-3,6,6);
			ct.strokeStyle='#6cf';
			ct.strokeRect(style.skewPointX-2,style.skewPointX-2,4,4);
			ct.restore();
		}
		if(style.clipOverflow){
			ct.beginPath();
			ct.rect(0,0,style.width,style.height);
			ct.clip();
		}
		if(mode===0){
			g.drawer&&g.drawer(ct);
		}else if(mode===1){
			g.checkIfOnOver(true,mode);
		}
		for(let i=0;i<g.childNodes.length;i++)
			this.drawGraph(g.childNodes[i],mode);
		ct.restore();
	}
}

const COL_Class={
	Event:host=>{
		const COL=host;
		return class Event{
			constructor(type){
				this.type=type;
				this.timeStamp=Date.now();
			}
		}
	},
	GraphEvent:host=>{
		const COL=host;
		return class GraphEvent extends host.class.Event{
			constructor(type){
				super(type);
				this.propagation=true;
				this.stoped=false;
				this.target=null;
			}
			stopPropagation(){
				this.propagation=false;
			}
			stopImmediatePropagation(){
				this.stoped=true;
			}
			get altKey(){return this.origin.altKey;}
			get ctrlKey(){return this.origin.ctrlKey;}
			get metaKey(){return this.origin.metaKey;}
			get shiftKey(){return this.origin.shiftKey;}
		}
	},
	MouseEvent:host=>{
		return class MouseEvent extends host.class.GraphEvent{
			get button(){return this.origin.button;}
			get buttons(){return this.origin.buttons;}
			get movementX(){return host.stat.mouse.x-host.stat.previousX;}
			get movementY(){return host.stat.mouse.y-host.stat.previousY;}

		}
	},
	WheelEvent:host=>{
		return class WheelEvent extends host.class.MouseEvent{
			get deltaX(){return this.origin.deltaX;}
			get deltaY(){return this.origin.deltaY;}
			get deltaZ(){return this.origin.deltaZ;}
			get deltaMode(){return this.origin.deltaMode;}
		}
	},
	KeyboardEvent:host=>{
		return class KeyboardEvent extends host.class.GraphEvent{
			get key(){return this.origin.key;}
			get code(){return this.origin.code;}
			get repeat(){return this.origin.repeat;}
			get keyCode(){return this.origin.keyCode;}
			get charCode(){return this.origin.charCode;}
			get location(){return this.origin.location;}
		}
	},
	GraphEventEmitter:host=>{
		const COL=host;
		return class GraphEventEmitter{
			constructor(){
				this._events={};
			}
			emit(e){
				if(e instanceof host.class.Event === false)return;
				e.target=this;
				this._resolve(e);
			}
			_resolve(e){
				if(e.type in this._events){
					const hs=this._events[e.type];
					try{
						for(let i=0;i<hs.length;i++){
							hs[i].call(this,e);
							if(e.stoped)return;
						}
					}catch(e){
						console.error(e);
					}
				}
				if(e.propagation===true && this.parentNode)this.parentNode._resolve(e);
			}
			on(name,handle){
				if(!(handle instanceof Function))return;
				if(!(name in this._events))this._events[name]=[];
				this._events[name].push(handle);
			}
			removeEvent(name,handle){
				if(!(name in this._events))return;
				if(arguments.length===1){delete this._events[name];return;}
				let ind;
				if(ind=(this._events[name].indexOf(handle))>=0)this._events[name].splice(ind,1);
				if(this._events[name].length===0)delete this._events[name];
			}
		}
	},
	GraphStyle:host=>{
		return class GraphStyle{
			constructor(inhertFrom){
				if(inhertFrom && this.inhert(inhertFrom))return;
				this.__proto__.__proto__=host.default.style;
				this._calculatableStyleChanged=false;
			}
			inhertGraph(graph){//inhert a graph's style
				if(!(graph instanceof host.class.Graph))
					throw(new TypeError('graph is not a Graph instance'));
				this.inhertStyle(graph.style);
				return true;
			}
			inhertStyle(style){
				if(!(style instanceof host.class.GraphStyle))
					throw(new TypeError('graph is not a Graph instance'));
				this.__proto__=style;
				return true;
			}
			inhert(from){
				if(from instanceof host.class.Graph){
					this.inhertGraph(from);
					return true;
				}else if(from instanceof host.class.GraphStyle){
					this.inhertStyle(from);
					return true;
				}
				return false;
			}
			cancelInhert(){
				this.__proto__=Object.prototype;
			}

			getPoint(name){
				switch(name){
					case 'center':{
						return [this.width / 2,this.height / 2];
					}
				}
				return [0,0];
			}
			position(x,y){
				this.x=x;
				this.y=y;
			}
			zoom(x,y){
				if (arguments.length == 1) {
					this.zoomX = this.zoomY = x;
				}
				else{
					this.zoomX = x;
					this.zoomY = y;
				}
			}
			size(w,h){
				this.width = w;
				this.height = h;
			}
			setRotatePoint(x,y){
				if (arguments.length == 2) {
					this.rotatePointX = x;
					this.rotatePointY = y;
				} else if (arguments.length == 1) {
					[this.rotatePointX,this.rotatePointY]=this.getPoint(x);
				}
			}
			setPositionPoint(x,y){
				if (arguments.length == 2) {
					this.positionPointX = x;
					this.positionPointY = y;
				} else if (arguments.length == 1) {
					[this.positionPointX,this.positionPointY]=this.getPoint(x);
				}
			}
			setZoomPoint(x,y){
				if (arguments.length == 2) {
					this.zoomPointX = x;
					this.zoomPointY = y;
				} else if (arguments.length == 1) {
					[this.zoomPointX,this.zoomPointY]=this.getPoint(x);
				}
			}
			setSkewPoint(x,y){
				if (arguments.length == 2) {
					this.skewPointX = x;
					this.skewPointY = y;
				} else if (arguments.length == 1) {
					[this.skewPointX,this.skewPointY]=this.getPoint(x);
				}
			}
		}
	},
	Graph:host=>{
		return class Graph extends host.class.GraphEventEmitter{
			constructor(){
				super();
				//this.name=name;
				this.host=host;
				this.GID=this.host.generateGraphID();
				this.onoverCheck=true;
				Object.defineProperties(this,{
					style:{value: new host.class.GraphStyle(),configurable:true},
					childNodes:{value: []},
					parentNode:{value: undefined,configurable:true}
				});
			}
			createShadow(){
				const shadow=Object.create(this);
				shadow.GID=this.host.generateGraphID();
				shadow.shadowParent=this;
				Object.defineProperties(shadow,{
					style:{value: new host.class.GraphStyle(this.style),configurable:true},
					parentNode:{value: undefined,configurable:true}
				});
				return shadow;
			}
			//add a graph to childNodes' end
			appendChild(graph){
				if(!(graph instanceof host.class.Graph))
					throw(new TypeError('graph is not a Graph instance'));
				if(graph===this)throw(new Error('can not add myself as a child'));
				if(graph.parentNode!==this){
					defProp(graph, 'parentNode', {
						value: this,
					});
				}else{
					let i=this.findChild(graph);
					if(i>=0)this.childNodes.splice(i,1);
				}
				this.childNodes.push(graph);
			}
			//insert this graph after the graph
			insertAfter(graph){
				if(!(graph instanceof host.class.Graph))
					throw(new TypeError('graph is not a Graph instance'));
				if(graph===this)throw(new Error('can not add myself as a child'));
				let p=graph.parentNode,io,it;
				if(!p)throw(new Error('no parentNode'));
				it=p.findChild(graph);
				//if(it<0)return false;
				if(p!==this.parentNode){
					defProp(this, 'parentNode', {
					  value: p,
					});
				}else{
					io=p.findChild(this);
					if(io>=0)p.childNodes.splice(io,1);
				}
				p.childNodes.splice((io<it)?it:it+1,0,this);
			}
			//insert this graph before the graph
			insertBefore(graph){
				if(!(graph instanceof host.class.Graph))
					throw(new TypeError('graph is not a Graph instance'));
				if(graph===this)throw(new Error('can not add myself as a child'));
				let p=graph.parentNode,io,it;
				if(!p)throw(new Error('no parentNode'));
				it=p.findChild(graph);
				//if(it<0)return false;
				if(p!==this.parentNode){
					defProp(this, 'parentNode', {
					  value: p,
					});
				}else{
					io=p.findChild(this);
					if(io>=0)p.childNodes.splice(io,1);
				}
				p.childNodes.splice((io<it)?it-1:it,0,this);
			}
			findChild(graph){
				for(let i=this.childNodes.length;i--;)
					if(this.childNodes[i]===graph)return i;
				return -1;
			}
			removeChild(graph){
				let i=this.findChild(graph);
				if(i<0)return;
				this.childNodes.splice(i,1);
				defProp(this, 'parentNode', {
				  value: undefined,
				});
			}

			checkIfOnOver(runHitRange=true,mode=0){
				if(this.onoverCheck===false || !this.hitRange)return false;
				const m=this.host.stat.mouse;
				if(m.x === null)return false;
				if(this===this.host.tmp.onOverGraph)return true;
				runHitRange&&this.hitRange(this.host.context);
				if(mode===0 && this.host.debug.switch){
					this.host.context.save();
					this.host.context.strokeStyle='yellow';
					this.host.context.stroke();
					this.host.context.restore();
				}
				if(this.host.context.isPointInPath(m.x,m.y)){
					this.host.tmp.onOverGraph=this;
					return true;
				}
				return false;
			}
			delete(){//remove it from the related objects
				if(this.parentNode)this.parentNode.removeChild(this);
				if(this.host.stat.onover===this)this.host.stat.onover=null;
				if(this.host.stat.onfocus===this)this.host.stat.onfocus=null;
			}
		}
		
	},
	FunctionGraph:host=>{
		return class FunctionGraph extends host.class.Graph{
			constructor(drawer){
				super();
				if(drawer instanceof Function){
					this.drawer=drawer;
				}
				this.style.debugBorderColor='#f00';
			}
			drawer(ct){
				//onover point check
				this.checkIfOnOver(true);
			}
			hitRange(ct){
				ct.beginPath();
				ct.rect(0,0,this.style.width,this.style.height);
			}
		}
	},
	ImageGraph:host=>{
		return class ImageGraph extends host.class.FunctionGraph{
			constructor(image){
				super();
				if(image)this.use(image);
				this.useImageBitmap=true;
				this.style.debugBorderColor='#0f0';
			}
			use(image){
				if(image instanceof Image){
					this.image=image;
					if (!image.complete) {
						image.addEventListener('load',e=> {
							this.resetStyleSize();
							this._createBitmap();
						});
					}else{
						this.resetStyleSize();
						this._createBitmap();
					}
					return true;
				}else if(image instanceof HTMLCanvasElement){
					this.image=image;
					this.resetStyleSize();
					return true;
				}
				throw(new TypeError('Wrong image type'));
			}
			_createBitmap(){
				if(this.useImageBitmap && typeof createImageBitmap ==='function'){//use ImageBitmap
					createImageBitmap(this.image).then((bitmap)=>{
						if(this._bitmap)this._bitmap.close();
						this._bitmap=bitmap;
					});
				}
			}
			get width(){
				if(this.image instanceof Image)return this.image.naturalWidth;
				if(this.image instanceof HTMLCanvasElement)return this.image.width;
				return 0;
			}
			get height(){
				if(this.image instanceof Image)return this.image.naturalHeight;
				if(this.image instanceof HTMLCanvasElement)return this.image.height;
				return 0;
			}
			resetStyleSize(){
				this.style.width=this.width;
				this.style.height=this.height;
			}
			drawer(ct){
				//onover point check
				//ct.beginPath();
				ct.drawImage((this.useImageBitmap&&this._bitmap)?this._bitmap:this.image, 0, 0);
				this.checkIfOnOver(true);
			}
			hitRange(ct){
				ct.beginPath();
				ct.rect(0,0,this.style.width,this.style.height);
			}
		}
	},
	CanvasGraph:host=>{
		return class CanvasGraph extends host.class.ImageGraph{
			constructor(){
				super();
				this.image=document.createElement('canvas');
				this.context=this.image.getContext('2d');
				this.useImageBitmap=false;
				this.autoClear=true;
			}
			draw(func){
				if(this.autoClear)this.context.clearRect(0,0,this.width,this.height);
				func(this.context,this.canvas);
				if(this.useImageBitmap)this._createBitmap();
			}
			set width(w){this.image.width=w;}
			set height(h){this.image.height=h;}
		}
	},
	TextGraph:host=>{
		return class TextGraph extends host.class.FunctionGraph{
			constructor(text=''){
				super();
				//this._cache=null;
				this._fontString='';
				this._renderList=null;
				this.autoSize=true;
				this.font=Object.create(host.default.font);
				this.realtimeRender=false;
				this.useImageBitmap=true;
				this.style.debugBorderColor='#00f';
				this.text=text;
				defProp(this,'_cache',{configurable:true});
			}
			prepare(async=false){//prepare text details
				if(!this._cache && !this.realtimeRender){
					defProp(this,'_cache',{value:document.createElement("canvas")});
				}
				let font = "";
				(this.font.fontStyle)&&(font = this.font.fontStyle);
				(this.font.fontVariant)&&(font =`${font} ${this.font.fontVariant}`);
				(this.font.fontWeight)&&(font =`${font} ${this.font.fontWeight}`);
				font =`${font} ${this.font.fontSize}px`;
				(this.font.fontFamily)&&(font =`${font} ${this.font.fontFamily}`);
				this._fontString = font;

				if(this.realtimeRender)return;
				const imgobj = this._cache,ct = (imgobj.ctx2d||(imgobj.ctx2d=imgobj.getContext("2d")));
				ct.font = font;
				this._renderList = this.text.split(/\n/g);
				this.estimatePadding=Math.max(
					this.font.shadowBlur+5+Math.max(Math.abs(this.font.shadowOffsetY),Math.abs(this.font.shadowOffsetX)),
					this.font.strokeWidth+3
				);
				if (this.autoSize) {
					let w = 0,tw,lh=(typeof this.font.lineHeigh ==='number')?this.font.lineHeigh:this.font.fontSize;
					for (let i = this._renderList.length; i -- ;) {
						tw = ct.measureText(this._renderList[i]).width;
						(tw>w)&&(w=tw);//max
					}
					imgobj.width = (this.style.width = w) + this.estimatePadding*2;
					imgobj.height = (this.style.height = this._renderList.length * lh)+ ((lh<this.font.fontSize)?this.font.fontSize*2:0) + this.estimatePadding*2;
				} else {
					imgobj.width = this.style.width;
					imgobj.height = this.style.height;
				}
				ct.translate(this.estimatePadding, this.estimatePadding);
				if(async){
					setImmediate(this._renderToCache,this);
				}else{
					this._renderToCache(this);
				}
			}
			_renderToCache(t){
				t.render(t._cache.ctx2d);
				if(t.useImageBitmap && typeof createImageBitmap ==='function'){//use ImageBitmap
					createImageBitmap(t._cache).then((bitmap)=>{
						if(t._bitmap)t._bitmap.close();
						t._bitmap=bitmap;
					});
				}
			}
			render(ct){//render text
				if(!this._renderList)return;
				ct.save();
				ct.font=this._fontString;//set font
				ct.textBaseline = 'top';
				ct.lineWidth = this.font.strokeWidth;
				ct.fillStyle = this.font.color;
				ct.strokeStyle = this.font.strokeColor;
				ct.shadowBlur = this.font.shadowBlur;
				ct.shadowColor= this.font.shadowColor;
				ct.shadowOffsetX = this.font.shadowOffsetX;
				ct.shadowOffsetY = this.font.shadowOffsetY;
				ct.textAlign = this.font.textAlign;
				let lh=(typeof this.font.lineHeigh ==='number')?this.font.lineHeigh:this.font.fontSize,
					x;
				switch(this.font.textAlign){
					case 'left':case 'start':{
						x=0;break;
					}
					case 'center':{
						x=this.style.width/2;break;
					}
					case 'right':case 'end':{
						x=this.style.width;
					}
				}

				for (let i = this._renderList.length;i--;) {
					this.font.strokeWidth&&ct.strokeText(this._renderList[i],x,lh*i);
					this.font.fill&&ct.fillText(this._renderList[i],x, lh*i);
				}
				ct.restore();
			}
			drawer(ct){
				//ct.beginPath();
				if(this.realtimeRender){//realtime render the text
					//onover point check
					this.checkIfOnOver(true);
					this.render(ct);
				}else{//draw the cache
					if(!this._cache){
						this.prepare();
					}
					ct.drawImage((this.useImageBitmap&&this._bitmap)?this._bitmap:this._cache, -this.estimatePadding, -this.estimatePadding);
					this.checkIfOnOver(true);
				}
			}
			hitRange(ct){
				ct.beginPath();
				ct.rect(0,0,this.style.width,this.style.height);
			}
		}
	},
}


function addEvents(target,events={}){
	for(let e in events)target.addEventListener(e,events[e]);
}

function multiplyMatrix(m1,m2,r) {
	r[0]=m1[0]*m2[0]+m1[1]*m2[3];
	r[1]=m1[0]*m2[1]+m1[1]*m2[4];
	r[2]=m1[0]*m2[2]+m1[1]*m2[5]+m1[2];
	r[3]=m1[3]*m2[0]+m1[4]*m2[3];
	r[4]=m1[3]*m2[1]+m1[4]*m2[4];
	r[5]=m1[3]*m2[2]+m1[4]*m2[5]+m1[5];
}


//code from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign != 'function')
Object.assign = function (target) {
	'use strict';
	// We must check against these specific cases.
	if (target === undefined || target === null) {
		throw new TypeError('Cannot convert undefined or null to object');
	}
	var output = Object(target);
	for (var index = 1; index < arguments.length; index++) {
		var source = arguments[index];
		if (source !== undefined && source !== null) {
			for (var nextKey in source) {
				if (source.hasOwnProperty(nextKey)) {
					output[nextKey] = source[nextKey];
				}
			}
		}
	}
	return output;
};


if(!Float32Array.__proto__.from) {
	let copy_data = [];
	Float32Array.__proto__.from = function (obj, func, thisObj) {
		var typedArrayClass = Float32Array.__proto__;
		if(typeof this !== "function")
			throw new TypeError("# is not a constructor");
		if(this.__proto__ !== typedArrayClass)
			throw new TypeError("this is not a typed array.");
		func = func || (elem=>{return elem;});
		if (typeof func !== "function")
			throw new TypeError("specified argument is not a function");
		obj = Object(obj);
		if(!obj["length"])
			return new this(0);
		copy_data.length=0;
		for(let i=0; i<obj.length; i++){
			copy_data.push(obj[i]);
		}
		copy_data = copy_data.map(func, thisObj);
		const typed_array = new this(copy_data.length);
		for(let i=0; i<typed_array.length; i++) {
			typed_array[i] = copy_data[i];
		}
		return typed_array;
	}
}


(function() {
	if(window.requestAnimationFrame)return;
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelRequestAnimationFrame = window[vendors[x] + 'CancelRequestAnimationFrame'];
	} 
	if (!window.requestAnimationFrame) window.requestAnimationFrame = function(callback, element, interval) {
		var currTime = Date.now();
		var timeToCall = interval || (Math.max(0, 1000 / 60 - (currTime - lastTime)));
		callback(0);
		var id = window.setTimeout(function() {
			callback(currTime + timeToCall);
		},
		timeToCall);
		lastTime = currTime + timeToCall;
		return id;
	};
	if (!window.cancelAnimationFrame) window.cancelAnimationFrame = function(id) {
		clearTimeout(id);
	};
}());

export default CanvasObjLibrary;
