function getGraphlib(lib){
var Glib={};
Glib.Graph=[];
Glib.SetCanvasLib=function(lib){
	if(lib)
	this.lib=lib;
};
Glib.SetCanvasLib(lib);
Glib.getGraphObj=function(type,optionjson){
	if(!this.lib){console.log("未设置绘图库");return false;}
	if(!Glib.Graph[type]){console.log("没有此图形:"+type);return false;}
	return Glib.Graph[type](optionjson);
}
Glib.Graph['star']=function(optionjson){
	var g=Glib.lib.Graph.New();
	g.option=optionjson||{};
	g.option.r=g.option.r||10;
	g.width=2*g.option.r;
	g.height=2*g.option.r;
	g.graphFun=function(ct){
		ct.translate(g.option.r, g.option.r);
		ct .rotate(Math.PI/2*3);
		ct.beginPath();
		ct.fillStyle =g.option.color||"#000";
		ct.moveTo(g.option.r, 0);
		for (var i = 0; i < 9; i++) {
			ct.rotate(Math.PI / 5);
			if (i % 2 == 0) {
				ct.lineTo(g.option.r*0.3819653, 0);
			} else {
				ct.lineTo(g.option.r, 0);
			}
		}
		ct .rotate(Math.PI*7/10);
		ct.translate(-g.option.r, -g.option.r);
	}
	g.setR=function(r){
		g.option.r=r;
		g.width=2*r;
		g.height=2*r;
	}
	g.drawfunction=function(ct){
		g.graphFun(ct);
		ct.fill();
	}
	return g;
};

Glib.Graph['arc'] = function(optionjson) {
	var g = Glib.lib.Graph.New();
	g.option = optionjson || {};
	g.option.r = g.option.r || 10;
	g.width = 2 * g.option.r;
	g.height = 2 * g.option.r;
	g.graphFun = function(ct) {
		ct.arc(g.option.r, g.option.r, g.option.r, g.option.startAngle || 0, g.option.endAngle || 2*Math.PI, g.option.anticlockwise || true);
		ct.closePath();
	}
	g.setR = function(r) {
		g.option.r = r;
		g.width = 2 * r;
		g.height = 2 * r;
	}
	g.drawfunction = function(ct) {
		ct.fillStyle = g.option.fillColor || "#66CCFF";
		ct.strokeStyle = g.option.borderColor || "#000";
		ct.lineWidth = g.option.borderWidth || 0;
		g.graphFun(ct);
		ct.fill();
	}
	return g;
}
Glib.Graph['rect'] = function(optionjson) {
		var g = Glib.lib.Graph.New();
		g.option = optionjson || {};
		g.width = g.option.width || 50;
		g.height = g.option.height || 50;
		g.option.fillColor = g.option.fillColor || "#000";
		g.option.fill = g.option.fill || true;
		g.backgroundColor=g.option.backgroundColor;
		g.option.borderWidth = g.option.borderWidth || 0;
		g.option.borderColor = g.option.borderColor || "#000";
		g.graphFun = function(ct) {
			ct.rect(0, 0, g.width, g.height);
		}
		g.drawfunction = function(ct) {
			ct.fillColor = g.option.fillColor;
			ct.strokeStyle = g.option.borderColor;
			ct.lineWidth = g.option.borderWidth;
			g.graphFun(ct);
			if (g.option.fill) {
				ct.fill();
			}
			if (g.option.borderWidth > 0) {
				ct.stroke();
			}

		}
		return g;
	}
return Glib;
}
