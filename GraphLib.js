(function(){

class Graphlib{
	construct(COL){
		if(COL instanceof CanvasObjectLibrary === false)
			throw(new TypeError('CanvasObjectLibrary instance required'));
		this.COL=COL;
		for(let c in graphs)this[c]=graphs[c](this);

	}
}

const graphs={
	arc:lib=>{
		return class pie extends lib.COL.class.FunctionGraph{
			constructor(){
				super();
				this.setRadius(5);
				this.color='#000';
				this.startAngle=0;
				this.endAngle=Math.PI*2;
				this.anticlockwise=false;
				this.borderColor='#000';
				this.borderWidth=0;
				this.enableEvent=false;
			}
			setRadius(r){
				this.r=r;
				this.style.height=this.style.width=2*r;
			}
			drawer(ct){
				ct.beginPath();
				ct.arc(this.r, this.r, this.r, this.startAngle, this.endAngle, this.anticlockwise);
				ct.closePath();
				this.enableEvent&&this.checkIfOnOver();
				if(this.color){
					ct.fillStyle=this.color;
					ct.fill();
				}
				if(this.borderWidth>0){
					ct.strokeStyle=this.borderColor;
					ct.stroke();
				}
			}
		}
	},
	pie:lib=>{
		return class pie extends lib.arc{
			constructor(){
				super();
			}
		}
	},
	ring:lib=>{
		return class ring extends lib.pie{
			constructor(){
				super();
				this.color=null;
				this.borderWidth=1;
			}
		}
	},
	star:lib=>{
		return class star extends lib.ring{
			constructor(){
				super();
			}
			drawer(ct){
				ct.rotate(Math.PI/2*3);
				ct.beginPath();
				ct.moveTo(this.r, 0);
				for (var i = 0; i < 9; i++) {
					ct.rotate(Math.PI / 5);
					if (i % 2 == 0) {
						ct.lineTo(this.r*0.3819653, 0);
					} else {
						ct.lineTo(this.r, 0);
					}
				}
				ct.closePath();
				this.enableEvent&&this.checkIfOnOver();
				if(this.color){
					ct.fillStyle=this.color;
					ct.fill();
				}
				if(this.borderWidth>0){
					ct.strokeStyle=this.borderColor;
					ct.stroke();
				}
			}
		}
	},
	rect:lib=>{
		return class rect extends lib.COL.class.FunctionGraph{
			constructor(){
				super();
			}
			drawer(ct){
				ct.beginPath();
				ct.rect(0, 0, this.style.width, this.style.height);
				ct.closePath();
				this.enableEvent&&this.checkIfOnOver();
				if(this.color){
					ct.fillStyle=this.color;
					ct.fill();
				}
				if(this.borderWidth>0){
					ct.strokeStyle=this.borderColor;
					ct.stroke();
				}
			}
		}
	},
}

window.Graphlib=Graphlib;
})();

