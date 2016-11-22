/*
CopyRight(Left) iTisso
member:LuoJia
*/
'use strict';
(function(){
window.CanvasObjectLibrary=CanvasObjectLibrary;

function addEvents(target,events={}){
	for(let e of events)target.addEventListener(e,events[e]);
}


//class:CanvasObjectLibrary
class CanvasObjectLibrary{
	constructor(canvas){
		Object.assign(this,{
			/*The main canvas*/
			canvas: canvas,
			/*Canvas' context*/
			context: canvas.getContext('2d'),
			default:{
				/*default font*/
				font:{
					fontStyle: null,
					fontWeight: null,
					fontVariant: null,
					color: "#000",
					lineHeight: null,
					fontSize: 14,
					fontFamily: "Arial",
					borderWidth: 0,
					borderColor: "#000",
					shadowBlur: 0,
					shadowColor: "#000",
					shadowOffsetX:0,
					shadowOffsetY:0,
					fill:true,
					lineHeight:18,
					vertical:false,
					reverse:false,
					//baseline: "middle",
				},
				style:{
					//x:0,
					//y:0,
					zoomX:1,
					zoomY:1,
					width:1,
					height:1,
					rotate:0,
					hidden:false,
					opacity:1,
					clipOverflow:false,
					backgroundColor:null,
					rotatePointX:0,
					rotatePointY:0,
					positionPointX:0,
					positionPointY:0,
					zoomPointY:0,
					zoomPointY:0,
				},
			},
			stat:{
				mouse:{
					x:0,
					y:0
				},
				/*The currently focused on obj*/
				onfocus: null,
				/*The currently mouseover obj*/
				onover: null,
				canvasOnFocus: false,
				canvasOnOver: false,

			},
			tmp:{
				graphID:0,
				//matrix:new Float32Array(9),
			},
			
			document: null,//document Graph

			class:{},

			autoClear:true,
			//Debug info
			Debug:{
				switch:false,
				objInfo:false,
				itemCount:0,
				FPS:0,
				drawTimeRecorder:new Int32Array(3),//记录三帧绘制时的时间来计算fps
				on:function(){
					COL.Debug.switch=true;
				},
				off:function(){
					COL.Debug.switch=false;

				},
			},
		});
		//set classes
		for(let c in COL_Class)this.class[c]=COL_Class[c](this);

		//init root graph
		this.document=new this.class.Graph();
		this.document.name='document';
		//prevent document's parentNode being modified
		Object.defineProperty(this.document,'parentNode',{configurable:false});

		//adjust canvas drawing size
		this.adjustcanvas();

		const canvas=this.canvas;
		//add events
		addEvents(canvas,{
			mouseout:e=>{
				this.stat.canvasOnOver=false;
				//clear mouse pos data
				this.stat.mouse.x=null;
				this.stat.mouse.y=null;
				//clear onover obj
				const onover=this.stat.onover;
				this._commonEventHandle(e);
				this.stat.onover=null;
			},
			mouseover:e=>{
				this.stat.canvasOnOver=true;
			},
			mousemove:e=>this._commonEventHandle(e),
			mousedown:e=>{
				this.stat.canvasOnFocus=true;
				//this.stat.onfocus=(this.stat.onover||this.document);
				this._commonEventHandle(e)
			},
			mouseup:e=>this._commonEventHandle(e),
			click:e=>this._commonEventHandle(e),
			dblclick:e=>this._commonEventHandle(e),
			selectstart:e=>e.preventDefault(),
			wheel:e=>{
				const ce=new this.class.WheelEvent('wheel');
				ce.originEvent=e;
				(this.stat.onover||this.document).emit(ce);
			},
			keydown:e=>this._commonEventHandle(e),
			keyup:e=>this._commonEventHandle(e),
			keypress:e=>this._commonEventHandle(e),
		});
		addEvents(window,{
			mousedown:e=>{
				if(e.target===this.canvas){this.stat.canvasOnFocus=true;}
				else{this.stat.canvasOnFocus=false;}
			},
			mouseout:e=>{
				if(this.stat.canvasOnOver)
					const eve=new window.MouseEvent('mouseout');
					this.canvas.dispatchEvent(eve);
			}
		});
	}
	generateGraphID(){return ++this.tmp.graphID;}
	adjustcanvas(width=this.canvas.offsetWidth,height=this.canvas.offsetHeight){
		this.document.width =this.canvas.width= width;
		this.document.height =this.canvas.height= height;
	}
	_commonEventHandle(e){
		if(e instanceof MouseEvent){
			this.stat.mouse.x=e.layerX;
			this.stat.mouse.y=e.layerY;
			const ce=new this.class.MouseEvent(e.type);
			ce.originEvent=e;
			(this.stat.onover||this.document).emit(ce);
		}else if(e instanceof MouseEvent){
			const ce=new this.class.KeyboardEvent(e.type);
			ce.originEvent=e;
			(this.stat.onover||this.document).emit(ce);
		}
	}
	draw(){}
}

const COL_Class={
	Event:host=>{
		const COL=host;
		return class Event{
			constructor(type){
				this.propagation=true;
				this.type=type;
			}
			stopPropagation(){
				this.propagation=false;
			}
		}
	},
	MouseEvent:host=>{
		return class MouseEvent extends host.class.Event{
			constructor(type){
				super(type);
			}
			get button(){return this.originEvent.button;}
		}
	},
	WheelEvent:host=>{
		return class WheelEvent extends host.class.Event{
			constructor(type){
				super(type);
			}
		}
	},
	KeyboardEvent:host=>{
		return class KeyboardEvent extends host.class.Event{
			constructor(type){
				super(type);
			}
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
						for(let h of hs)h(e);
					}catch(e){
						console.error(e);
					}
				}
				if(e.propagation&&this.parentNode)this.parentNode._resolve(e);
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
	Graph:host=>{
		return class Graph extends host.class.GraphEventEmitter{
			constructor(name=''){
				super();
				this.name=name;
				this.GID=host.generateGraphID();
				Object.defineProperties(this,{
					style:{value: new host.class.GraphStyle(),configurable:true},
					childNodes:{value: []},
					parentNode:{value: undefined,configurable:true,}
				});
				this.mouseOverPath;
			}
		}
		//add a graph to childNodes' end
		appendChild(graph){
			if(!(graph instanceof host.class.Graph))
				throw(new TypeError('graph is not a Graph instance'));
			if(graph===this)return false;
			if(graph.parentNode!==this){
				Object.defineProperty(graph, 'parentNode', {
				  value: this,
				});
			}else{
				let i=this.findChild(graph);
				if(i>=0)this.childNodes.splice(i,1);
			}
			this.childNodes.push(graph);
		}
		//insert this graph after the graph
		insertAfert(graph){
			if(!(graph instanceof host.class.Graph))
				throw(new TypeError('graph is not a Graph instance'));
			if(graph===this)return false;
			let p=graph.parentNode,io,it;
			if(!p)return false;
			it=p.findChild(graph);
			if(it<0)return false;
			if(p!==this.parentNode){
				Object.defineProperty(this, 'parentNode', {
				  value: p,
				});
			}else{
				io=p.findChild(this);
				if(io>=0)p.childNodes.splice(io,1);
			}
			this.childNodes.splice((io<it)?it:it+1);
		}
		//insert this graph before the graph
		insertBefore(graph){
			if(!(graph instanceof host.class.Graph))
				throw(new TypeError('graph is not a Graph instance'));
			if(graph===this)return false;
			let p=graph.parentNode,io,it;
			if(!p)return false;
			it=p.findChild(graph);
			if(it<0)return false;
			if(p!==this.parentNode){
				Object.defineProperty(this, 'parentNode', {
				  value: p,
				});
			}else{
				io=p.findChild(this);
				if(io>=0)p.childNodes.splice(io,1);
			}
			this.childNodes.splice((io<it)?it-1:it);
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
			Object.defineProperty(this, 'parentNode', {
			  value: undefined,
			});
		}
		zoom(x,y){
			if (arguments.length == 1) {
				this.style.zoomX = this.style.zoomY = x;
			}
			else{
				this.style.zoomX = x;
				this.style.zoomY = y;
			}
		}
		setSize(w,h){
			this.style.width = w;
			this.style.height = h;
		}
		setRotatePoint(x,y){
			if (arguments.length == 2) {
				this.style.rotatePointX = x;
				this.style.rotatePointY = y;
			} else if (arguments.length == 1) {
				switch (x) {
					case "center":{
						this.style.rotatePointX = this.style.width / 2;
						this.style.rotatePointY = this.style.height / 2;
						break;
					}
				}
			}
		}
		setPositionPoint(x,y){
			if (arguments.length == 2) {
				this.style.positionPointX = x;
				this.style.positionPointY = y;
			} else if (arguments.length == 1) {
				switch (x) {
					case "center":{
						this.style.positionPointX = this.style.width / 2;
						this.style.positionPointY = this.style.height / 2;
						break;
					}
				}
			}
		}
		setZoomPoint(x,y){
			if (arguments.length == 2) {
				this.style.zoomPointY = x;
				this.style.zoomPointY = y;
			} else if (arguments.length == 1) {
				switch (x) {
					case "center":{
						this.style.zoomPointY = this.style.width / 2;
						this.style.zoomPointY = this.style.height / 2;
						break;
					}
				}
			}
		}
	},
	GraphStyle:host=>{
		return class GraphStyle{
			constructor(){
				this.__proto__=host.default.style;
			}
			inhertGraph(graph){//inhert a graph's style
				if(!(graph instanceof host.class.Graph))
					throw(new TypeError('graph is not a Graph instance'));
				this.__proto__=graph.style;
			}
			inhertStyle(style){
				if(!(style instanceof host.class.GraphStyle))
					throw(new TypeError('graph is not a Graph instance'));
				this.__proto__=style;
			}
			cancelInhert(){
				this.__proto__=Object.prototype;
			}
		}
	},
	ImageGraph:host=>{
		return class ImageGraph extends this.class.Graph{
			constructor(name=''){
				super(name);
			}
			use(img){
				if(this.img instanceof Image && this.img instanceof HTMLCanvasElement)
					this.img=img;
			}
			get width(){
				if(this.img instanceof Image)return this.img.naturalWidth;
				if(this.img instanceof HTMLCanvasElement)return this.img.width;
				return 0;
			}
			get height(){
				if(this.img instanceof Image)return this.img.naturalHeight;
				if(this.img instanceof HTMLCanvasElement)return this.img.height;
				return 0;
			}
		}
	},
	FunctionGraph:host=>{
		return class ImageGraph extends this.class.Graph{
			constructor(name=''){
				super(name);
				
			}
		}
	},
	TextGraph:host=>{
		return class ImageGraph extends this.class.Graph{
			constructor(name=''){
				super(name);
				this.text;
				this.realtimeVary;
				this.varylist=[];
				this.autoSize=true;
			}
			prepare(){}
			render(ct){}
		}
	},
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
        func = func || elem=>{return elem;};
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
		var currTime = new Date().getTime();
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
} ());