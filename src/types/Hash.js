var _ = require("../etc/Utils.js");

module.exports = (function(){
	function mod(m, set, prop, val){
		var name = prop.id || prop;
		if(name[0]==":"){
			name = name.slice(1);
		}
		
		if(m == 'add'){
			set.items[name] = val;
		}else{
			set.items[name] = null;
			delete set.items[name];
		}
	}

	function Hash(argv){
		this.items = {};

		if(Array.isArray(argv)){
			if(!argv.length%2){
				throw "Arity error";
			}
		
			for(var i=0,l=argv.length;i<l;i+=2){
				mod('add', this, argv[i], argv[i+1]);
			}
		}else{
			for(var i in argv){
				mod('add', this, i, argv[i]);
			}
		}
	}

	Hash.prototype.assoc = function(argv) {
		for(var i=0,l=argv.length;i<l;i+=2){
			mod('add', this, argv[i], argv[i+1]);
		}
		return this.items;
	};

	Hash.prototype.dissoc = function(argv) {
		for(var i=0,l=argv.length;i<l;i++){
			mod('rem', this, argv[i]);
		}
		return this.items;
	};

	Hash.prototype.get = function(prop) {
		var name = prop.id || prop;
		if(name[0]==":"){
			name = name.slice(1);
		}
		return this.items[name];
	};

	return Hash;
})();