/*
CopyRight(Left) iTisso
member:LuoJia
*/
function newC_GUI() {
	var C_GUI = {
		keys: [],
		/*主canvas*/
		/*The main canvas*/
		canvas: null,
		/*canvas的绘图上下文*/
		/*Canvas' context*/
		context: null,
		buffercanvas: null,
		buffercontext: null,
		font:{
			fontStyle :null,
			fontWeight : null,
			textInput :null,
			fontVariant :null,
			lineHeight :null,
			fontSize:"15px",
			fontFamily:  "Arial"
		},
		currentcontext: null,
		mouseleft: false,
		mouseright: false, 
		mousecenter: false,
		mouseX: null,
		mouseY: null,
		focus: null,
		canvasonfocus: false,
		document: null,
		onoverElement: null,
		eve: {},

		e: {
			mouseoutcanvas: function() {
				C_GUI.mouseX = null;
				C_GUI.mouseY = null;
				if (C_GUI.onoverElement && C_GUI.onoverElement.mouseout) {
					C_GUI.eve.target = C_GUI.onoverElement;
					C_GUI.onoverElement.mouseout(C_GUI.eve);
				}
				C_GUI.onoverElement = null;
				C_GUI.canvasonfocus = false;
			}
		},
		tosign: {
			click: false,
			centerclick: false,
			rightcilck: false,
			onmoveele: null,
			drag: false
		},
		event: function() {
			this.stopPropagation = function() {
				this.Propagation = false;
			};
			this.Propagation = true;
		},

		/*在当前基础上新建一个对象*/
		/*Create a new gui obj based on the current obj*/
		New: function() {
			return Object.create(this);
		}
	};
	C_GUI.imageSmoothing = {
		on: function() {
			if (C_GUI.buffercontext) C_GUI.buffercontext.imageSmoothingEnabled = true;
			C_GUI.context.imageSmoothingEnabled = true;
		},
		off: function() {
			if (C_GUI.buffercontext) C_GUI.buffercontext.imageSmoothingEnabled = false;
			C_GUI.context.imageSmoothingEnabled = false;
		}
	};
	/*重设位置(为鼠标坐标服务)【当canvas的位置改变(dom中)时需要调用，来修正鼠标坐标】*/
	/*Reset mouse offset,if the canvas has change it's place in page,run it*/
	C_GUI.setrelPosition = function() {
		switch (C_GUI.tools.getBrowser()) {
		case "msie":
		case "trident":
		case "opera":
			{
				C_GUI.mousePosition.fun = C_GUI.mousePosition.ie;
				C_GUI.mousePosition.offsetx = C_GUI.tools.getnum(C_GUI.canvas.style.borderLeftWidth);
				C_GUI.mousePosition.offsety = C_GUI.tools.getnum(C_GUI.canvas.style.borderTopWidth) / 2;
				break;
			}
		case "firefox":
			{
				C_GUI.mousePosition.fun = C_GUI.mousePosition.firefox;
				C_GUI.mousePosition.offsety = C_GUI.canvas.offsetTop + C_GUI.tools.getnum(C_GUI.canvas.style.borderTopWidth) / 2;
				C_GUI.mousePosition.offsetx = C_GUI.canvas.offsetLeft;
				break;
			}
		case "chrome":
			{
				C_GUI.mousePosition.offsety = C_GUI.tools.getnum(C_GUI.canvas.style.borderTopWidth) / 2;
				C_GUI.mousePosition.fun = C_GUI.mousePosition.chrome;
				break;
			}
		default:
			{
				C_GUI.mousePosition.offsety = C_GUI.tools.getnum(C_GUI.canvas.style.borderTopWidth) / 2;
				C_GUI.mousePosition.fun = C_GUI.mousePosition.chrome;
				break;
			}
		}

	};

	/*创建图形用的画布*/
	/*A canvas to create picture*/
	C_GUI.imagecreater = {
		creatercanvas: null,
		creatercontext: null,
		init: function() {
			C_GUI.imagecreater.creatercanvas = document.createElement("canvas");
			C_GUI.imagecreater.creatercontext = C_GUI.imagecreater.creatercanvas.getContext("2d");
		},
		drawpic: function(_width, _height, _draw) {
			if (!C_GUI.imagecreater.creatercontext) C_GUI.imagecreater.init();
			var ct = C_GUI.imagecreater.creatercontext,
			cv = C_GUI.imagecreater.creatercanvas;
			C_GUI.imagecreater.creatercanvas.width = _width;
			C_GUI.imagecreater.creatercanvas.height = _height;
			_draw(ct);
			var c = document.createElement("canvas");
			c.width = _width;
			c.height = _height;
			c.getContext("2d").drawImage(cv, 0, 0);
			return c;
		}
	};

	/*设置主画布*/
	/*set main canvas*/
	C_GUI.setCanvas = function(canvas_dom) {
		C_GUI.canvas = canvas_dom;
		C_GUI.setrelPosition();

		/*Solve events*/
		C_GUI.eve.stopPropagation = function() {
			C_GUI.eve.Propagation = false;
		};
		var aEL = C_GUI.tools.addEventListener;
		aEL(canvas_dom, "mouseover",
		function(e) {
			C_GUI.canvasonfocus = true;
		});
		aEL(canvas_dom, "mousemove",
		function(e) {
			e.preventDefault();
			C_GUI.eve = new C_GUI.event();
			C_GUI.eve.target = C_GUI.onoverElement;
			C_GUI.mousePosition.fun(e);
			if (C_GUI.onoverElement && C_GUI.onoverElement.mousemove) {
				C_GUI.onoverElement.mousemove(C_GUI.eve);
			}
		});
		aEL(canvas_dom, "mousedown",
		function(e) {
			e.preventDefault();
			var eve = new C_GUI.event();
			eve.target = C_GUI.onoverElement;
			eve.button = e.button;
			C_GUI.tosign.click = true;
			switch (eve.button) {
			case 0:
				C_GUI.tosign.click = C_GUI.mouseleft = true;
				break;
			case 1:
				C_GUI.tosign.centerclick = C_GUI.mousecenter = true;
				break;
			case 2:
				C_GUI.tosign.rightclick = C_GUI.mouseright = true;
				break;
			}
			if (C_GUI.onoverElement && C_GUI.onoverElement.mousedown) {
				if (C_GUI.onoverElement.mousedown) {
					C_GUI.onoverElement.mousedown(eve);
				}
				C_GUI.focus = C_GUI.onoverElement;
			}
		});
		aEL(canvas_dom, "mouseout",
		function() {
			C_GUI.e.mouseoutcanvas();
		});
		aEL(canvas_dom, "contextmenu",
		function(e) {
			e.preventDefault();
		});
		aEL(canvas_dom, "selectstart",
		function(e) {
			e.preventDefault();
		});
		aEL(window, "mouseout",
		function() {
			C_GUI.e.mouseoutcanvas();
		});

		aEL(canvas_dom, "resize",
		function() {
			canvas_dom.width = C_GUI.width = canvas_dom.offsetWidth;
			canvas_dom.height = C_GUI.height = canvas_dom.offsetHeight;
			if (C_GUI.buffercanvas) {
				C_GUI.buffercanvas.width = canvas_dom.offsetWidth;
				C_GUI.buffercanvas.height = canvas_dom.offsetHeight;
			}
			C_GUI.setPosition();
		});

		aEL(canvas_dom, "mouseup",
		function(e) {
			var eve = new C_GUI.event();
			eve.target = C_GUI.onoverElement;
			eve.button = e.button;
			switch (eve.button) {
			case 0:
				C_GUI.mouseleft = false;
				if (C_GUI.tosign.click && eve.target && eve.target.click) {
					eve.target.click(eve);
				}
				break;
			case 1:
				C_GUI.mousecenter = false;
				if (C_GUI.tosign.centerclick && eve.target && eve.target.centerclick) {
					eve.target.centerclick(eve);
				}
				break;
			case 2:
				C_GUI.mouseright = false;
				if (C_GUI.tosign.rightclick && eve.target && eve.target.rightclick) {
					eve.target.rightclick(eve);
				}
				break;
			}
			if (C_GUI.onoverElement && C_GUI.onoverElement.mouseup) {
				C_GUI.onoverElement.mouseup(eve);
			}
		});
		var _mousewheele=C_GUI.tools.getBrowser()=="firefox"?"DOMMouseScroll":"mousewheel";
			aEL(canvas_dom,_mousewheele,function(e) {
			e = e || window.event;
			var eve = new C_GUI.event();
			eve.target = C_GUI.onoverElement;
			var data = e.wheelDelta ? e.wheelDelta: e.detail;
			if (data == -3 || data == 120) {
				eve.wheel = 0;
			} else if (data == 3 || data == -120) {
				eve.wheel = 1;
			}
			if (C_GUI.onoverElement && C_GUI.onoverElement.mousewheel) {
				C_GUI.onoverElement.mousewheel(eve);
			}

		});
		
		aEL(window, "keydown",
		function(e) {
			if (C_GUI.canvasonfocus) {

				if (!C_GUI.keys[e.keyCode]) {
					e.preventDefault();
					var eve = new C_GUI.event();
					eve.keyCode = e.keyCode;
					C_GUI.keys[e.keyCode] = true;
					if (C_GUI.focus && C_GUI.focus.keydown) {
						C_GUI.focus.keydown(eve);
					}
				}
			}
		});
		aEL(window, "keyup",
		function(e) {
			if (C_GUI.canvasonfocus) {
				if (C_GUI.keys[e.keyCode]) {
					var eve = new C_GUI.event();
					eve.keyCode = e.keyCode;
					C_GUI.keys[e.keyCode] = false;
					if (C_GUI.focus && C_GUI.focus.keyup) {
						C_GUI.focus.keyup(eve);
					}
				}
				e.preventDefault();
			}
		});
		aEL(window, "keypress",
		function(e) {
			if (C_GUI.canvasonfocus) {
				var eve = new C_GUI.event();
				eve.keyCode = e.keyCode;
				C_GUI.keys[e.keyCode] = false;
				if (C_GUI.focus && C_GUI.focus.keypress) {
					C_GUI.focus.keypress(eve);
				}
				e.preventDefault();
			}
		});
		C_GUI.context = canvas_dom.getContext("2d");
		C_GUI.currentcontext = C_GUI.buffercontext || C_GUI.context;
		C_GUI.document = C_GUI.Graph.New();
		C_GUI.Graph.Eventable(C_GUI.document);
		C_GUI.document.width = canvas_dom.width;
		C_GUI.document.height = canvas_dom.height;
		C_GUI.document.afterdrawfun=function(ct){
			if(C_GUI.Debug.stat){
				ct.save();
				ct.setTransform(1,0,0,1,0,0);
				ct.font="16px Arial";
				ct.textBaseline="bottom";
				ct.fillStyle="#CCC";
				ct.fillText("mouseX:"+C_GUI.mouseX+" Y:"+C_GUI.mouseY+" mouseL:"+C_GUI.mouseleft+" C:"+C_GUI.mousecenter+" R:"+C_GUI.mouseright,0,C_GUI.canvas.height);
				ct.restore();
			}
		};
		C_GUI.drawlist = [C_GUI.document];
	};

	C_GUI.setBuffCanvas = function(buf) {
		C_GUI.buffercanvas = buf;
		C_GUI.buffercontext = C_GUI.buffercanvas.getContext("2d");
		C_GUI.currentcontext = C_GUI.buffercontext || C_GUI.context;
	};

	C_GUI.Graph = {
		New: function(newname) {
			var g = {
				name: newname,
				top: 0,
				left: 0,
				width: 1,
				height: 1,
				rotate: 0,
				rotatecenter: {
					x: 0,
					y: 0
				},
				zoom: {
					x: 1,
					y: 1
				},
				display: true,
				opacity: null,
				beforedrawfun: null,
				afterdrawfun: null,
				overflow: null,
				drawtype: "function",
				//function、image、text
				drawfunction: null,
				backgroundColor: null,
				eventable: false,
				imageobj: null,
				z_index: null,
				drawlist: null,
				childNode: [],
				parentNode: null,
				drawpic: function(width, height, _draw) {
					this.width = width;
					this.height = height;
					this.imageobj = C_GUI.imagecreater.drawpic(width, height, _draw);
				},
				setZoom: function(x, y) {
					if (arguments.length == 1) this.zoom.x = this.zoom.y = x;
					else if (arguments.length == 2) {
						this.zoom.x = x;
						this.zoom.y = y;
					}
				},
				useImage: function(image) {
					if (!this.imageobj) {
						this.imageobj = document.createElement("canvas");
					}
					try {
						this.width = this.imageobj.width = image.width;
						this.height = this.imageobj.height = image.height;
						this.imageobj.getContext("2d").drawImage(image, 0, 0);
					} catch(e) {
						image.onload = function() {
							this.width = this.imageobj.width = image.width;
							this.height = this.imageobj.height = image.height;
							this.imageobj.getContext("2d").drawImage(image, 0, 0);
						};
					}

				},
				zindex: function(index) {
					this.z_index = index;
					if (this.parentNode) {
						C_GUI.tools.arraybyZ_index(this.parentNode);
					}
				},
				setRotateCenter: function() {
					if (arguments.length == 2) {
						this.rotatecenter.x = arguments[0];
						this.rotatecenter.y = arguments[1];
					} else if (arguments.length == 1) {
						switch (arguments[0]) {
						case "center":
							{
								this.rotatecenter.x = this.width / 2;
								this.rotatecenter.y = this.height / 2;
								break;
							}
						}
					}

				},
				setSize: function(w, h) {
					this.width = w;
					this.height = h;

				},
				New: function() {
					var newobj = Object.create(this);
					newobj.parentNode = null;
					newobj.childNode = [];
					newobj.drawlist = null;

					return newobj;
				},
				addChild: function(graph) {
					if (graph) {
						this.childNode.unshift(graph);
						graph.parentNode = this;
						C_GUI.tools.arraybyZ_index(this);
					}
				},
				removeChild: function(graph) {
					for (var i = 0; graph != this.childNode[i]; i++) {
						if (i == this.childNode.length) break;
					}
					if (graph == this.childNode[i]) {
						this.childNode.splice(i, 1);
						C_GUI.tools.arraybyZ_index(this);
						graph.parentNode = null;
					}
				}
			};
			return g;
		},
		NewImageObj:function(image){
			var m=C_GUI.Graph.New();
			if(image){
				m.userImage(image);
			}
		},
		NewTextObj: function(text, fontsize, fontFamily) {
			var t = C_GUI.Graph.New();
			t.drawtype = "text";
			t.text = text || " ";
			t.baseline = "middle";
			t.fontStyle = null;
			t.fontWeight = null;
			t.textInput = null;
			t.fontVariant = null;
			t.lineHeight = null;
			t.fontSize = fontsize || "15px";
			t.fontFamily = fontFamily || "Arial";
			t.innerX = 0;
			t.innerY = 0;
			t.color = "#000";
			t.autoSize = true;
			t.editable = false;
			t.textborderWidth = 0;
			t.textborderColor = "#fff";
			t.fill = true;
			t.shadowBlur = 0;
			t.shadowColor = "#CCC";
			t.shadowOffset = {
				x: 0,
				y: 0
			};
			t.maxWidth = 0;
			t.prepareText = function() {
				if (!t.imageobj) {
					t.imageobj = document.createElement("canvas");
				}
				var ct = t.imageobj.getContext("2d");
				ct.clearRect(0, 0, t.imageobj.width, t.imageobj.height);
				var font = "";
					if (t.fontStyle||C_GUI.font.fontStyle) font +=t.fontStyle||C_GUI.font.fontStyle;
					if (t.fontVariant||C_GUI.font.fontVariant) font += (" " + t.fontVariant||C_GUI.font.fontVariant);
					if (t.fontWeight||C_GUI.font.fontWeight) font += (" " +t.fontWeight||C_GUI.font.fontWeight);
					font += (" " + t.fontSize||C_GUI.font.fontSize||"15px");
					if (t.lineHeight||C_GUI.font.lineHeight) font += (" " +t.lineHeight||C_GUI.font.lineHeight);
					if (t.fontFamily||C_GUI.font.fontFamily)font += (" " + t.fontFamily||C_GUI.font.fontFamily);
					else{font += (" " + C_GUI.fontFamily)}
				ct.font = font;
				t.font = font;
				if (t.autoSize) {
					var w = ct.measureText(t.text).width;
					t.width = t.imageobj.width = t.maxWidth >= w ? t.maxWidth: w;
					var fontsize = C_GUI.tools.getnum(t.font) * 1.2;
					if (fontsize === 0) {
						fontsize = 20;
					}
					t.height = t.imageobj.height = fontsize;
				} else {
					t.imageobj.width = t.width || 100;
					t.imageobj.height = t.height || 30;
				}
				ct.translate(0, t.imageobj.height / 2);
				ct.textBaseline = t.baseline;
				ct.lineWidth = t.textborderWidth;
				ct.strokeStyle = t.textborderColor;
				ct.fillStyle = t.color || "#000";
				ct.save();
				if (t.shadowBlur > 0) {
					ct.font = font;
					ct.shadowBlur = t.shadowBlur;
					ct.shadowColor = t.shadowColor;
					ct.shadowOffsetX = t.shadowOffset.x;
					ct.shadowOffsetY = t.shadowOffset.y;
				}
				ct.font = font;
				if (t.fill) {
					ct.fillText(t.text, t.innerX, t.innerY);
				}
				if (t.textborderWidth) {
					ct.strokeText(t.text, t.innerX, t.innerY);
				}

				ct.restore();
			};
			t.setSize = function(width, height) {
				t.autoSize = false;
				t.width = width;
				t.height = height;
				t.prepareText();
			};
			t.setText = function(text) {
				t.text = text || " ";
				t.prepareText();
			};
			t.prepareText();
			return t;
		},
		Eventable: function(graph) {
			graph.eventable = true;
			graph.overPath = null;
			graph.mouseover = function(e) {
				for (var i = graph.events["onmouseover"].length; i--;) {
					graph.events["onmouseover"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.mouseover(e);
					}
				}
			};
			graph.mouseout = function(e) {
				for (var i = graph.events["onmouseout"].length; i--;) {
					graph.events["onmouseout"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.mouseout(e);
					}
				}
			};
			graph.mousemove = function(e) {
				for (var i = graph.events["onmousemove"].length; i--;) {
					graph.events["onmousemove"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.mousemove(e);
					}
				}
			};
			graph.mousewheel = function(e) {
				for (var i = graph.events["onmousewheel"].length; i--;) {
					graph.events["onmousewheel"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.mousewheel(e);
					}
				}
			};
			graph.mouseup = function(e) {
				for (var i = graph.events["onmouseup"].length; i--;) {
					graph.events["onmouseup"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.mouseup(e);
					}
				}
			};
			graph.click = function(e) {
				for (var i = graph.events["onclick"].length; i--;) {
					graph.events["onclick"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.click(e);
					}
				}
			};
			graph.centerclick = function(e) {
				for (var i = graph.events["oncenterclick"].length; i--;) {
					graph.events["oncenterclick"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.centerclick(e);
					}
				}
			};
			graph.rightclick = function(e) {
				for (var i = graph.events["onrightclick"].length; i--;) {
					graph.events["onrightclick"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.rightclick(e);
					}
				}
			};
			graph.mousedown = function(e) {
				C_GUI.focus = e.target;
				for (var i = graph.events["onmousedown"].length; i--;) {
					graph.events["onmousedown"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.mousedown(e);
					}
				}
			};
			graph.keydown = function(e) {
				for (var i = graph.events["onkeydown"].length; i--;) {
					graph.events["onkeydown"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.keydown(e);
					}
				}
			};
			graph.keyup = function(e) {
				for (var i = graph.events["onkeyup"].length; i--;) {
					graph.events["onkeyup"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.keyup(e);
					}
				}
			};
			graph.keypress = function(e) {
				for (var i = graph.events["onkeypress"].length; i--;) {
					graph.events["onkeypress"][i](e);
				}
				if (e.Propagation) {
					if (graph.parentNode) {
						graph.parentNode.keypress(e);
					}
				}
			};
			graph.events = [];
			graph.events["onmouseover"] = [];
			graph.events["onmouseout"] = [];
			graph.events["onmouseup"] = [];
			graph.events["onmousewheel"] = [];
			graph.events["onmousemove"] = [];
			graph.events["onclick"] = [];
			graph.events["oncenterclick"] = [];
			graph.events["onrightclick"] = [];
			graph.events["onmousedown"] = [];
			graph.events["onkeydown"] = [];
			graph.events["onkeyup"] = [];
			graph.events["onkeypress"] = [];
			graph.addEvent = function(name, fun) {
				if (!graph.events[name]) graph.events[name] = [];
				if (typeof(fun) == "function" && graph.events[name]) graph.events[name].unshift(fun);
				else {
					return false;
				}
			};
		},
		Delete: function(graph) {
			if (graph) {
				if (graph.parentNode) {
					graph.parentNode.removeChild(graph);
				}
				graph = null;
				return true;
			}
			return false;
		}
	};

	C_GUI.drawElement = function(d, ct) {
		for (var i = 0; i < d.length; i++) {
			if (d[i].display) {
				ct.save();
				ct.translate(d[i].left + d[i].rotatecenter.x, d[i].top + d[i].rotatecenter.y);
				ct.beginPath();
				ct.rotate(d[i].rotate * 0.017453);
				ct.scale(d[i].zoom.x, d[i].zoom.y);
				if (d[i].opacity !== null) ct.globalAlpha = d[i].opacity;

				if (d[i].overflow == "hidden") {
					ct.rect( - d[i].rotatecenter.x, -d[i].rotatecenter.y, d[i].width, d[i].height);
					ct.clip();
				}

				ct.save();
				if(d[i].Composite)ct.globalCompositeOperation=d[i].Composite;
				ct.save();
				if (d[i].beforedrawfun) d[i].beforedrawfun(ct);
				ct.restore();

				switch (d[i].drawtype) {
				case "function":
					{
						ct.translate( - d[i].rotatecenter.x, -d[i].rotatecenter.y);
						if (d[i].drawfunction) d[i].drawfunction(ct);
						if (d[i].overflow == "hidden") {
							ct.clip();
						}
						ct.save();
						if (d[i].backgroundColor) {
							ct.fillStyle = d[i].backgroundColor;
							ct.fillRect( - (d[i].rotatecenter.x), -(d[i].rotatecenter.y), d[i].width, d[i].height);
						}
						if (d[i].eventable) {
							if (C_GUI.Debug.stat) {
								ct.save();
								ct.fillStyle = "rgba(29, 145, 194,0.7)";
								ct.strokeStyle = "rgb(255,255,255)";
								ct.lineWidth = 2;
							}
							if (C_GUI.mouseX && C_GUI.mouseY) {
								if (d[i].overPath) {
									ct.beginPath();
									d[i].overPath(ct, d[i]);
								}
								if (ct.isPointInPath(C_GUI.mouseX, C_GUI.mouseY)) {
									C_GUI.newonoverElement = d[i];
								}
							}
							if (C_GUI.Debug.stat) {
								ct.closePath();
								ct.fill();
								ct.stroke();
								ct.restore();
							}

						}

						break;
					}
				case "image":
				case "text":
					{     
						if (d[i].overflow == "hidden") {
							ct.save();
							ct.rect(0,0,d[i].width, d[i].height);
							ct.clip();
							ct.restore();
						}

						ct.save();
						
						if (d[i].backgroundColor) {
							ct.fillStyle = d[i].backgroundColor;
							ct.fillRect( - (d[i].rotatecenter.x), -(d[i].rotatecenter.y), d[i].width, d[i].height);
						}
						if (d[i].imageobj && d[i].imageobj.width && d[i].imageobj.height) {
							ct.drawImage(d[i].imageobj, -(d[i].rotatecenter.x), -(d[i].rotatecenter.y));
						}
						ct.translate( - d[i].rotatecenter.x, -d[i].rotatecenter.y);
						if (d[i].eventable) {
							if (C_GUI.Debug.stat) {
								ct.save();
								ct.fillStyle = "rgba(0,0,0,0.3)";
								ct.strokeStyle = "rgb(255,255,255)";
								ct.lineWidth = 2;
							}
							if (C_GUI.mouseX && C_GUI.mouseY) {
								ct.beginPath();
								if (d[i].overPath) {
									d[i].overPath(ct, d[i]);
								} else {
									C_GUI.tools.defaultPathFun(ct, d[i]);
								}

								if (ct.isPointInPath(C_GUI.mouseX, C_GUI.mouseY)) {
									C_GUI.newonoverElement = d[i];
								}
							}
							if (C_GUI.Debug.stat) {
								ct.fill();
								ct.stroke();
								ct.restore();
							}

						}
						break;
					}
				}
				if (C_GUI.Debug.stat) {
					ct.save();
					ct.beginPath();
					ct.strokeRect(0, 0, d[i].width, d[i].height);
					ct.stroke();
					var zx = d[i].zoom.x,
					zy = d[i].zoom.y;
					if (d[i].parentNode) {
						zx *= d[i].parentNode.zoom.x;
						zy *= d[i].parentNode.zoom.y;
					}
					ct.scale(1 / zx, 1 / zy);
					ct.textBaseline = "top";
					ct.fillStyle = "rgba(0,0,0,1)";
					ct.font = "20px Arial";
					switch (d[i].drawtype) {
					case "function":
						{
							ct.fillText("Function", 0, 0);
							break;
						}

					case "image":
						{
							ct.fillText("Image", 0, 0);
							break;
						}
					case "text":
						{
							ct.fillText("Text", 0, 0);
							ct.font = "12px Arial";
							ct.fillText("font:" + d[i].font, 0, -12);
							break;
						}
					}

					if (C_GUI.Debug.eleinfo) {
						ct.font = "10px Arial";
						ct.fillText("X:" + d[i].left + " " + "Y:" + d[i].top, 0, 21);
						ct.fillText("rotate:" + d[i].rotate, 0, 31);
						ct.fillText("zoom:" + d[i].zoom.x + "," + d[i].zoom.y, 0, 41);
						ct.fillText("RotatePotint:" + d[i].rotatecenter.x + " " + d[i].rotatecenter.y, 0, 51);
						ct.fillText("Size:" + d[i].width + "*" + d[i].height, 0, 61);
					}
					ct.restore();
				}
				ct.restore();
				if (d[i].afterdrawfun) d[i].afterdrawfun(ct);
				ct.restore();
				ct.translate( - d[i].rotatecenter.x, -d[i].rotatecenter.y);
				if (d[i].childNode.length) {
					C_GUI.drawElement(d[i].drawlist, ct);
				}
				ct.restore();
			}
		}

	};

	C_GUI.mousePosition = {
		fun: null,
		offsetx: 0,
		offsety: 0,
		chrome: function(e) {
			C_GUI.mouseX = e.offsetX - this.offsetx;
			C_GUI.mouseY = e.offsetY - this.offsety;
		},
		ie: function(e) {
			C_GUI.mouseX = e.offsetX + this.offsetx;
			C_GUI.mouseY = e.offsetY + this.offsety;
		},
		firefox: function(e) {
			C_GUI.mouseX = e.pageX - this.offsetx;
			C_GUI.mouseY = e.pageY - this.offsety;
		}
	};

	/*把队列中的图形按index绘制出来*/
	/*draw all graphs[display=true]*/
	C_GUI.draw = function() {
		C_GUI.newonoverElement = null;
		C_GUI.drawElement(C_GUI.drawlist, C_GUI.currentcontext);

		if (C_GUI.newonoverElement != C_GUI.onoverElement) {
			if (C_GUI.onoverElement && C_GUI.onoverElement.mouseout) {
				var eve = new C_GUI.event();
				eve.target = C_GUI.onoverElement;
				C_GUI.onoverElement.mouseout(eve);
			}
			C_GUI.onoverElement = C_GUI.newonoverElement;
			if (C_GUI.onoverElement && C_GUI.onoverElement.mouseover) {
				var eve = new C_GUI.event();
				eve.target = C_GUI.onoverElement;
				C_GUI.onoverElement.mouseover(eve);
			}
		}
	};

	C_GUI.tools = {
		getnum: function(string) {
			if (!string) return 0;
			else {
				var a = Number(string.match(/\d+/)[0]);
				if (a) return a;
				else return 0;
			}
		},
		Linear:function(start,end,time,func,_hz){
			var hz=_hz||30;
			var t=time/1000*hz;
			var part=(end-start)/t;
			var i=setInterval(function(){
				t--;start+=part;
				if(t<0){clearInterval(i);func(end);return;}
				func(start);
				
			},1000/hz);
			return i;
		},
		stopLinear:function(i){
			clearInterval(i);
		},
		paixurule: function(a, b) {
			return a.z_index - b.z_index;
		},
		arraybyZ_index: function(graph) {
			if (graph.childNode) graph.drawlist = graph.childNode.sort(C_GUI.tools.paixurule);
		},
		defaultPathFun: function(ct, graph) {
			ct.rect(0, 0, graph.width, graph.height);
		},
		addEventListener: function(dom, e, fun) {
			if (dom.addEventListener) dom.addEventListener(e, fun, false);
			else if (dom.attachEvent) dom.attachEvent("on" + e, fun);
			else {
				dom["on" + e] = fun;
			}
		},
		getBrowser: function() {
			var b = navigator.userAgent.toLowerCase().match(/MSIE|Firefox|Opera|Safari|Chrome|trident/i);
			if (b.length) b = b[0];
			else b = "unknow";
			return b;
		},
		rand: function(min, max) {
			return Math.floor(min + Math.random() * (max - min));
		}

	};

	C_GUI.Debug = {
		stat: false,
		eleinfo: false,
		on: function() {
			C_GUI.Debug.stat = true;
		},
		off: function() {
			C_GUI.Debug.stat = false;
		}
	};
	return C_GUI;
}