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
					textInput: null,
					fontVariant: null,
					color: "#000",
					lineHeight: null,
					fontSize: "15px",
					fontFamily: "Arial"
				}
			},
			stat:{
				//keys: [],
				mouse:{
					/*left:false,
					center:false,
					right:false,*/
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
	/*multiplyMatrices(){
		let mats = arguments;
		if (mats&& mats.length>=2) {
			let mp, mn,ta = this.tmp.matrix,
			out=mats[mats.length-1];
			for (let i = mats.length-1;i--;) {
				let pm = i - 1;
				if (pm >= 0) {
					mp = mats[pm];
					mn = mats[i];
					ta[0] = mp[0] * mn[0] + mp[1] * mn[3] + mp[2] * mn[6];
					ta[1] = (mp[0] + mn[4]) * mn[1] + mp[2] * mn[7];
					ta[2] = (mp[0] + mn[8]) * mn[2] + mp[1] * mn[5];
					ta[3] = mp[3] * (mn[0] + mp[4]) + mp[5] * mn[6];
					ta[4] = mp[3] * mn[1] + mp[4] * mn[4] + mp[5] * mn[7];
					ta[5] = mp[3] * mn[2] + (mp[4] + mn[8]) * mn[5];
					mats[pm] = ta;
				}
			}
			for(i=0;i<9;i++)out[i]=ta[i];
		} 
	}*/
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
				if(e instanceof COL_Class.Event === false)return;
				e.target=this;
				this._resolve(e);
			}
			_resolve(e){
				if(e.type in this._events){
					const hs=this._events[e.type];
					for(let h of hs)h(e);
				}
				if(this.parentNode)this.parentNode._resolve(e);
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
				this.style={
					x:0,
					y:0,
					zoom:{x:1,y:1},
					width:1,
					height:1,
					rotate:0,
					display:true,
					opacity:1,
					order:0,
					overflow:false,
					backgroundColor:null,
				}
				this.parentNode=null;
				this.childNodes=[];
				this.mouseOverPath;
			}
		}
		addChild(){}
		removeChild(){}
		zoom(){}
		addChild(){}
	},/*
	GraphStyle:host=>{
		return class GraphStyle{
			constructor(){
				this.x=0;
				this.y=0;
				this.zoom={x:1,y:1};
				this.width=1;
				this.height=1;
				this.rotate=0;
				this.display=true;
				this.opacity=1;
				this.order=0;
				this.overflow=false;
				this.backgroundColor=null;
			}
		}
	},*/
	ImageGraph:host=>{
		return class ImageGraph extends this.class.Graph{
			constructor(name=''){
				super(name);
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
				
			}
		}
	},
	/*GraphMatrix:host=>{
		return class GraphMatrix extends Float32Array{
			constructor(data){
				super(data);
			}
			multiply(mat){
				host.tmp.matrix.set(this);
				this[0] = mp[0] * mn[0] + mp[1] * mn[3] + mp[2] * mn[6];
				this[1] = (mp[0] + mn[4]) * mn[1] + mp[2] * mn[7];
				this[2] = (mp[0] + mn[8]) * mn[2] + mp[1] * mn[5];
				this[3] = mp[3] * (mn[0] + mp[4]) + mp[5] * mn[6];
				this[4] = mp[3] * mn[1] + mp[4] * mn[4] + mp[5] * mn[7];
				this[5] = mp[3] * mn[2] + (mp[4] + mn[8]) * mn[5];
				this[6] = this[7] = 0;
				this[8] =1;
			}
		}
		
	}*/
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