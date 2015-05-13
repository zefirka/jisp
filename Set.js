var _ = require("./utils.js");

var Set = (function(){
	function push(set, item){
		if(set.items.length){
			if(set.items.every(function(sitem){
				if(!_.equals(sitem, item)){
					return true;
				}
			})){
				set.items.push(item);
			}
		}else{
			set.items.push(item);
		}
		return set.items;
	}

	function Set(items){
		var self = this;
		this.items = [];

		items && items.forEach(function(i){
			self.items.push(i);
		});
	}

	Set.prototype.add = function(x) {
		push(this, x);
		return this;
	};

	Set.prototype.remove = function(x) {
		var self = this;
		this.items.forEach(function(item, i){
			if(_.equals(item, x)){
				self.items.splice(i, 1);
			}
		});
		return this;
	};

	Set.prototype.union = function(set) {
		var self = this;
		set.items.forEach(function(item){
			push(self, item);
		});
		return this;
	};

	return Set;
})();

module.exports = Set;