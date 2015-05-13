module.exports = {
 	uuid: function(length, cid){
		var c = length || 100;
		return [c,c,c,c].map(function(i){ 
			 return i * Math.random() >> 0;
		}).join(cid || "_");
 	},

	toArray: function (a){ 
		return Array.prototype.slice.call(a); 
	},
	fnop : function(op){
		return eval("(function(a,b){ return a"+op+"b;})");
	},
	isArray : function(e){
		return Array.isArray(e);
	},
	equals : function(x, y){
		if ( x === y ) return true;
	
		if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
	
		if ( x.constructor !== y.constructor ) return false;
	
		for ( var p in x ) {
			if ( ! x.hasOwnProperty( p ) ) continue;
		
			if ( ! y.hasOwnProperty( p ) ) return false;
			
			if ( x[ p ] === y[ p ] ) continue;
		
			if ( typeof( x[ p ] ) !== "object" ) return false;
			
			if ( ! this.equals( x[ p ],  y[ p ] ) ) return false;
			
		}

		for ( p in y ) {
			if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
		}

		return true;
	},
	token: {
		isString: function(t){
			return /^".*"$/.test(t);
		},
		isNumber: function(t){
			return /^\d*$/.test(t);
		},
		isDelim: function(t){
			return "[](){},".indexOf(t) >= 0;
		}
	}
}