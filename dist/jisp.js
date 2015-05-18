(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],3:[function(require,module,exports){
module.exports = {
	letArityError: "Odd count of arguments of bindings list, expected even",
	
	arityError : function(expected, realy){
		return "Arity error:: exprected: " + expected + " got: " + realy;
	},
	referenceError : function(name){
		return "Referene Error:: variable " + name + " cannot be resolved in this content"
	},
	reservedError : function(name){
		return "Error:: " + name + " is reserved word"
	},
	syntaxErrorNumber : function(name){
		return "Syntax Error:: unexpected number at identificator: " + name;
	},
	undexpectedIdentificator : function(name){
		return "Syntax Error:: unexpected identificator: " + name;
	}
}
},{}],4:[function(require,module,exports){
module.exports = {
 	uuid: function(length, cid){
		var c = length || 100;
		return [c,c,c,c].map(function(i){ 
			 return i * Math.random() >> 0;
		}).join(cid || "_");
 	},
 	prop : function(p){
 		return function(o){
 			return o[p];
 		}
 	},
 	fname : function(){
 		return "fn_" + (new Date().getTime().toString().slice(-3)) + this.uuid()
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
},{}],5:[function(require,module,exports){
(function (process){
/* Dependencies */
var _       = require("./etc/Utils.js"),
    Errors  = require("./etc/Errors.js"),
    Set     = require("./types/Set.js");
    Hash     = require("./types/Hash.js");

/* Main interpreter function takes array and previous form*/
var Jisp = function(form, prev, prev_position){
  var asArg = false;

  if(Array.isArray(form)){
    for(var position=0, length=form.length; position<length; position++){
      var token = form[position];
      
      if(prev_position === 0){
        asArg = true;
      }
      
      /* if identificator */
      if(token.id !== undefined){
        var id = token.id;
        
        if(prev && prev.id == 'def'){
          /* Here we can check Reference Errors and Scope folding*/
        }else{

          /* Defined variables dereferences */
          if(Jisp.vars[id] !== undefined){
            var _var = Jisp.vars[id].value;            

            if(!_var){
              var jid = Jisp.vars[id];
              _var = Jisp.vars[jid].id ? Jisp.vars[jid].value : Jisp.vars[Jisp.vars[jid].id].value;
            }

            if(typeof _var == 'function' && position == 0){
              if(!asArg){
                form = _var.apply(form, Jisp(form.slice(1), form, position));
                break;
              }
            }else{
              form[position] = Jisp.vars[id].value;
            }
          }


          /* Reserved names dereferences */
          if(Jisp.names[id] !== undefined){
            var keyword = Jisp.names[id];

            if(typeof keyword == 'function' && position == 0){
              var argv = form.slice(1);
            
              if(!keyword.quote){
                argv = Jisp(argv, token, position);
              }
              if(!asArg){
                form = keyword.apply(form, argv);
                break;
              }
            }else
            if(typeof keyword == 'function' && position !== 0){
              form[position] = token;
            }else{
              form[position] = Jisp.names[id].value;
            }
          }

        }
      }else{        
        /* Recursive interpretations */
        if(Array.isArray(token)){          
          form[position] = Jisp(token);
        }
      }	
    }
  }

  return form;
}

/* Storages */
Jisp.names = {}; /* Reserved names */
Jisp.vars = {}; /* User variables */

/* Helping method to create functions with arithy checking and automaticaly quoted */
Jisp.defun = function(fn, arity, quote){
	var res = function(){
		if(arity && arguments.length > arity){
			throw Errors.arityError(arity, arguments.length);
		}
		if(fn.length && arguments.length > fn.length){
			console.warn("Warning! May cause of:" + Errors.arityError(arity, arguments.length))
		}
		return fn.apply(Jisp.currentScope, arguments);
	}
	if(quote){
		res.quote = true;
	}
	res.arity = arity;
	return res;
}

Jisp.names['defined?'] = Jisp.defun(function(e){
  return typeof (Jisp.names[e.id] || Jisp.vars[e.id]) !== "undefined";
}, 1, true);

Jisp.names['use'] = function(lib){
  var filename = lib.id + ".jisp";

  require('fs').readFile(filename, {encoding: 'utf-8'}, function(err, data){
    if(err){
      throw err;
    }else{
      Jisp.Eval(data);
    }
  })

}

/*********************************************************/
/* DEFINITIONS */
/*********************************************************/

/* Define */
Jisp.names.def = Jisp.defun(function(name, value){
  var id = name.id || name;

	/* Error checking */
	if(Jisp.names[id]){
		throw Errors.reservedError(id);
	}else
	if(/\d+/.test(id)){
		throw Errors.syntaxErrorNumber(name);
	}else
	if(!id.length){
		throw Errors.undexpectedIdentificator(name);
	}
	
	if(value.id){
    Jisp.vars[name.id] = (value.id ? value.id : value);

	}else{
		Jisp.vars[id] = {
			id: id,
			value: value
		}
	}

  return value;

}, 2);

/* Lambda function definitions*/
Jisp.names.lambda = Jisp.defun(function(argv, body){
	var names = argv.map(_.prop('id')),	
	    fname = _.fname();
	
	function body_parser(body, args){
		return body.map(function(token){
			if(Array.isArray(token)){
				return body_parser(token, args);
			}else
			if(token.id !== undefined){
        var restp = names.indexOf('&');
        
        names.forEach(function(arg_name, arg_position){
          if(arg_name == token.id && arg_name !== '&'){
						token = args[arg_position];
					}
				});				

        if(token.id == '&' && restp >= 0){
          if(args.length >= argv.length){
            token = _.toArray(args).slice(restp, (restp == argv.length-1) ? void 0 : -1);
          }else{
            throw "Illegal usage of the & (REST of arguments)";
          }
        }
			}

			return token;
		});
	}

	Jisp.vars[fname] = {
		id: fname, 
		value: function(){
      var parsed_body = body_parser(body, arguments);
			return Jisp(parsed_body, {id: fname});
		}
	};
		
	return {id: fname};
}, 2, true);

/* Let bindings */
Jisp.names.let = Jisp.defun(function(bindings, body){
  if(bindings.length%2){ throw Error.letArityError;  }
  
  function parseBody(token, arr){    
    if(token.id){
      arr.forEach(function(alias){
        if(alias.id == token.id){
          token = alias.value;
        }
      });
    }

    if(Array.isArray(token)){
      return token.map(function(x){
        return parseBody(x, arr);
      })
    }

    return token;
  }

  var aliases = []

  for(var i=0,l=bindings.length;i<l;i+=2){
    aliases.push({
      id: bindings[i].id,
      value : Jisp(parseBody(bindings[i+1], aliases))
    });
  }

  return Jisp(body.map(function(token){
    return parseBody(token, aliases);
  }));
}, 2, true);

/**********************************************************************************/
/**********************************************************************************/
/* Constructions */

/* Conditions */
Jisp.names['if'] = Jisp.defun(function(c, t, e){
  return Jisp(c) ? Jisp(t) : (e ? Jisp(e) : null);
},3, true);

Jisp.names.cond = Jisp.defun(function(){ 
  var argv = _.toArray(arguments);
  var _default;
  var archeck;

  if(argv.length%2){
    var check = Jisp(argv[0]);
    argv = argv.slice(1);
    archeck = true;
  }

  for(var i=0,l=argv.length;i<l;i+=2){

    if(argv[i].id && argv[i].id == '&'){
      _default = [argv[i], argv[i+1]];
    }else{
      if(archeck){
        if(_.equals(check, Jisp(argv[i]))){
          return Jisp(argv[i+1]);
        }
      }else{
        if(Jisp(argv[i])){
          return Jisp(argv[i+1]);
        }
      }
    }
  }

  if(_default){
    var res = _default[1];
    return Jisp(res);
  }else{
    return false;
  }

}, null, true);

/* Quotation */
Jisp.names.quote = Jisp.defun(function(a){
  return a;
}, null, true);

/* Applying */
Jisp.names.apply = Jisp.defun(function(fn, arr){
  return Jisp([fn].concat(Jisp(arr)));
}, 2, true);

Jisp.names['do'] = function(){
  var argv = _.toArray(arguments), res;
  for(var i = 0, l = argv.length; i<l; i++){
    res = Jisp(argv[i]);
    if(i == l-1){
      return res;
    }
  }
}

/* Evaluation */
Jisp.names['eval'] = function(expression){
  return Jisp(Jisp(expression));
}

Jisp.names['throw'] = function(message){
  throw message;
}

Jisp.names['set!'] = function(x, y){
  Jisp.vars[x.id] = y
}

Jisp.names['defmacro'] = Jisp.defun(function(name, args, body){
  var macro = [
    {id: 'defun'},
    name,
    args,
    [{id: 'quote', }, body]
  ]
  Jisp(macro);
}, 2, true);

Jisp.names['type?'] = Jisp.defun(function(o){
  var type = typeof o;
  if(Array.isArray(o)){
    if(o.type){
      type = o.type;
    }else{
      type = 'list';
    }
  }else{
    if(type == 'object'){
      type == "hash";
    }
  }
  return type;
}, 1);

Jisp.names.scan = function(message, id, fn){
  var readline = require('readline'),
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });

  rl.question("> " + message, function(res){
    Jisp.Eval("(def " + id.id + " \"" + res.toString() + "\" )");
    rl.close();
    Jisp([fn, id]);
  });
}

/**********************************************************************************/
/**********************************************************************************/
/* MACROSES */
Jisp.names.defun = Jisp.defun(function(name, argv, body){
  var res = [
    {id: 'def'}, 
    {id: name.id}, 
    [ {id:'lambda'} ].concat([argv, body])];
  return Jisp(res);
}, 3, true);

Jisp.names.log = function(e){
  Jisp.stdout.write(Jisp.jispinize(e));
}

/********************************************************************/
/* LIST DATA TYPE */
/********************************************************************/

Jisp.names.car = Jisp.defun(function(a){ return a[0]; }, 1);
Jisp.names.cdr = Jisp.defun(function(a){ return a.slice(1); }, 1);
Jisp.names.cons = Jisp.defun(function(a, b){ return [a].concat(b); }, 2);
Jisp.names.join = Jisp.defun(function(a, c){ return a.join(c); }, 2);
Jisp.names.list = function(){ return _.toArray(arguments); }
Jisp.names['length'] = function(e){
  return e.length;
}

Jisp.names.range = Jisp.defun(function(from, to){
  if(!to){
    to = from;
    from = 0;
  }
  
  var res = [], end = to;

  while(from<=end){
    res.push(from++);
  }
  
  return res;
}, 2);

Jisp.names.map = Jisp.defun(function(fn, arr){
  return Jisp(arr).map(function(item){
    return Jisp([fn, item]);
  });
}, 2, true);

Jisp.names.reduce = Jisp.defun(function(fn, arr){
  return Jisp(arr).reduce(function(a, b){
    return Jisp([fn, a ,b]);
  });
}, 2, true);

Jisp.names.filter = Jisp.defun(function(fn, arr){
  return Jisp(arr).filter(function(item){
    return Jisp([fn, item]);
  });
}, 2, true);

Jisp.names.str = function(){
  return  _.toArray(arguments).map(function(e){
    return e.toString ? e.toString() : Object.prototype.toString.call(e);
  }).join("");
}

/********************************************************************/
/* SET DATA TYPE */
/********************************************************************/

Jisp.names.set = function(){
	return new Set(_.toArray(arguments));
}

Jisp.names.add = function(){
  var argv = _.toArray(arguments),
      set  = new Set(argv[0].items);

  argv.slice(1).forEach(function(item){ set.add(item);  });

  return set;
}

Jisp.names.remove = function(){
  var argv = _.toArray(arguments),
      set = new Set(argv[0].items);

  argv.slice(1).forEach(function(item){ set.remove(item); })
  return set;
}

Jisp.names.union = function(a, b){
	return (new Set(a.items)).union(b);
}

/********************************************************************/
/* HASH DATA TYPE */
/********************************************************************/
Jisp.names.hash = function(){
	return new Hash(_.toArray(arguments)).items;
}

Jisp.names.assoc = function(){
  var argv = _.toArray(arguments);
  return (new Hash(argv[0])).assoc(argv.slice(1));
}

Jisp.names.dissoc = function(){
  var argv = _.toArray(arguments);
  return (new Hash(argv[0])).dissoc(argv.slice(1));
}

Jisp.names.get = function(a, b){
  return a[b.id ? b.id.slice(1) : b];
}

Jisp.names["."] = Jisp.defun(function(hash, name){
  hash = hash.id ? Jisp.vars[hash.id].value : Jisp(hash);
  return name.id ? hash[name.id] || hash[name] : hash[name];
}, 2, true);

/* Math operations */
Jisp.names['+'] = function(e){ return _.toArray(arguments).reduce(_.fnop('+')); }
Jisp.names['-'] = function(e){ return _.toArray(arguments).reduce(_.fnop('-')); }
Jisp.names['*'] = function(e){ return _.toArray(arguments).reduce(_.fnop('*')); }
Jisp.names['/'] = function(e){ return _.toArray(arguments).reduce(_.fnop('/')); }
Jisp.names['>'] = Jisp.defun(function(a,b){ return a > b; }, 2);
Jisp.names['>'] = Jisp.defun(function(a,b){ return a > b; }, 2);
Jisp.names['>='] = Jisp.defun(function(a,b){return a >= b;}, 2);
Jisp.names['<='] = Jisp.defun(function(a,b){return a <= b;}, 2);
Jisp.names['<'] = Jisp.defun(function(a,b){	return a < b; }, 2);
Jisp.names['='] = Jisp.defun(function(a,b){	return a == b;}, 2);
Jisp.names['eq?'] = Jisp.defun(function(a,b){return _.equals(a, b);}, 2);
Jisp.names['mod'] = Jisp.defun(function(a,b){	return a % b; }, 2);
Jisp.names['and'] = Jisp.defun(function(a,b){return a && b;}, 2);
Jisp.names['or'] = Jisp.defun(function(a,b){ return a || b;}, 2);
Jisp.names['not'] = Jisp.defun(function(a){  return !a;}, 1);
Jisp.names['list?'] = Jisp.defun(function(a){ return Array.isArray(a);}, 1);

Jisp.jispinize = function lispinize(js){
  function retoke(j){
    var str = JSON.stringify(j);
    return res = str.replace(/\[/g, '( ').replace(/\]/g, ' )').replace(/,/g, ' ');
  }

  function parseJs(j){
    if(Array.isArray(j)){
      return retoke(j.map(parseJs));
    }else{
      if(typeof j === 'object' && !j){
        return 'nil';
      }
      
      if(j === undefined){
        return 'nil';
      }
      
      if(j.id){
        var type;
        
        type = typeof (Jisp.names[j.id] || (Jisp.vars[j.id] ? Jisp.vars[j.id].value || Jisp.vars[j.id] : undefined)) || "ID";
        type = type.slice(0,3).toUpperCase();

        if(type == "UND"){
          return "<" + j.id + ">";
        }else{

          if(type === "FUN"){
            for(var alias in Jisp.vars){
              if(j.id == Jisp.vars[alias]){
                j.id = alias
              }
            }
          }

          return "#" + type + ": <"  + j.id + ">";  
        }        
      }else
      if(j.items){
        return "#SET: < " + parseJs(j.items) + " >";
      }else{
        if(typeof j == 'object'){
          return "#HASH: < " + JSON.stringify(j) + " >";
        }else{
          if(typeof j === "boolean"){
            if(j){
              return "#t";
            }else{
              return "nil";
            }
          }else{
            return j;
          }
        }
      }
    }
  }

  return parseJs(js);
}

/* Tokenizer function */
function tokenize(expr){	
	function stringSwipeOn(string){
		return string
			.replace(/ /g, "__PROB__")
			.replace(/\n/g, "__NLIN__")
			.replace(/\t/g, "__NTAB__")
		}

	function stringSwipeOff(e){
		return e.replace(/__PROB__/g, " ")
				.replace(/__NLIN__/g, "\n")
				.replace(/__NTAB__/g, "\t");
	}

	var sequences = expr
    .replace(/'\(.*?\)/g, function(e){ 
      return "(quote " + e.slice(1) + " )"; })
    .replace(/\~\(.*?\)/g, function(e){ 
      return "(eval " + e.slice(1) + " )"; })
    .replace(/\(/g, ' [ ')
    .replace(/\)/g, ' ] ')
	  .replace(/\;.+(\n|$)/g, '')
    .replace(/\".*?\"/g, stringSwipeOn)
    .replace(/\{.*?\}/g, stringSwipeOn);

	return sequences.trim().split(/\s+/).map(stringSwipeOff);
}

/* Return JS structure string */
function structurize(struct){
	struct = struct.map(function(token, p){
		var isId = token != "[" && token != "]" &&  !/\d+/.test(token) && token[0] != '"' && token[token.length-1] != '"' && token !=="t" && token !=="nil";
		
		if( isId ){
			token = "{id: '" + token + "'}"
		}
		
		if(token == "t"){
			token = "true";
		}

		if(token == "nil"){
			token = "false";
		}
		
		if(token == "[" || struct[p+1] == "]" || p==(struct.length-1) ){
			if(token[token.length-1] == '"' && struct[p+1] !== "]"){
				return token + ","; 
			}else{
				return token;
			}
		}else{
			return token + ","
		}


	}).join('');
	
	return "[" + struct +"]";
}



Jisp.Eval = function(str){
	var structure = tokenize(str),
		js = structurize(structure),
		res;	
	try{
		res = Jisp(eval(js));
		return res[res.length-1];
	}catch(error){
		console.error(error);
		return;
	}
}



Jisp.setup = function(options){
  Jisp.stdin = options.stdin;
  Jisp.stdout = options.stdout;
  Jisp.env = options.env;
}

module.exports = Jisp; 
}).call(this,require("1YiZ5S"))
},{"./etc/Errors.js":3,"./etc/Utils.js":4,"./types/Hash.js":6,"./types/Set.js":7,"1YiZ5S":2,"fs":1,"readline":1}],6:[function(require,module,exports){
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
},{"../etc/Utils.js":4}],7:[function(require,module,exports){
var _ = require("../etc/Utils.js");

module.exports = (function(){
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

		Object.defineProperty(this.items, "type", {
			configurable: false,
			enumerable : false,
			value: "set"
		});
		return this.items;
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
},{"../etc/Utils.js":4}]},{},[5])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2RhdC9Eb2N1bWVudHMvSklTUC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kYXQvRG9jdW1lbnRzL0pJU1Avbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL2hvbWUvZGF0L0RvY3VtZW50cy9KSVNQL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9ob21lL2RhdC9Eb2N1bWVudHMvSklTUC9zcmMvZXRjL0Vycm9ycy5qcyIsIi9ob21lL2RhdC9Eb2N1bWVudHMvSklTUC9zcmMvZXRjL1V0aWxzLmpzIiwiL2hvbWUvZGF0L0RvY3VtZW50cy9KSVNQL3NyYy9mYWtlXzc1YWE5OTkuanMiLCIvaG9tZS9kYXQvRG9jdW1lbnRzL0pJU1Avc3JjL3R5cGVzL0hhc2guanMiLCIvaG9tZS9kYXQvRG9jdW1lbnRzL0pJU1Avc3JjL3R5cGVzL1NldC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLG51bGwsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbnByb2Nlc3MubmV4dFRpY2sgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBjYW5TZXRJbW1lZGlhdGUgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5zZXRJbW1lZGlhdGU7XG4gICAgdmFyIGNhblBvc3QgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJ1xuICAgICYmIHdpbmRvdy5wb3N0TWVzc2FnZSAmJiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lclxuICAgIDtcblxuICAgIGlmIChjYW5TZXRJbW1lZGlhdGUpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmKSB7IHJldHVybiB3aW5kb3cuc2V0SW1tZWRpYXRlKGYpIH07XG4gICAgfVxuXG4gICAgaWYgKGNhblBvc3QpIHtcbiAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICB2YXIgc291cmNlID0gZXYuc291cmNlO1xuICAgICAgICAgICAgaWYgKChzb3VyY2UgPT09IHdpbmRvdyB8fCBzb3VyY2UgPT09IG51bGwpICYmIGV2LmRhdGEgPT09ICdwcm9jZXNzLXRpY2snKSB7XG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgaWYgKHF1ZXVlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZuID0gcXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgZm4oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgICAgICB3aW5kb3cucG9zdE1lc3NhZ2UoJ3Byb2Nlc3MtdGljaycsICcqJyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZm4sIDApO1xuICAgIH07XG59KSgpO1xuXG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn1cblxuLy8gVE9ETyhzaHR5bG1hbilcbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdGxldEFyaXR5RXJyb3I6IFwiT2RkIGNvdW50IG9mIGFyZ3VtZW50cyBvZiBiaW5kaW5ncyBsaXN0LCBleHBlY3RlZCBldmVuXCIsXG5cdFxuXHRhcml0eUVycm9yIDogZnVuY3Rpb24oZXhwZWN0ZWQsIHJlYWx5KXtcblx0XHRyZXR1cm4gXCJBcml0eSBlcnJvcjo6IGV4cHJlY3RlZDogXCIgKyBleHBlY3RlZCArIFwiIGdvdDogXCIgKyByZWFseTtcblx0fSxcblx0cmVmZXJlbmNlRXJyb3IgOiBmdW5jdGlvbihuYW1lKXtcblx0XHRyZXR1cm4gXCJSZWZlcmVuZSBFcnJvcjo6IHZhcmlhYmxlIFwiICsgbmFtZSArIFwiIGNhbm5vdCBiZSByZXNvbHZlZCBpbiB0aGlzIGNvbnRlbnRcIlxuXHR9LFxuXHRyZXNlcnZlZEVycm9yIDogZnVuY3Rpb24obmFtZSl7XG5cdFx0cmV0dXJuIFwiRXJyb3I6OiBcIiArIG5hbWUgKyBcIiBpcyByZXNlcnZlZCB3b3JkXCJcblx0fSxcblx0c3ludGF4RXJyb3JOdW1iZXIgOiBmdW5jdGlvbihuYW1lKXtcblx0XHRyZXR1cm4gXCJTeW50YXggRXJyb3I6OiB1bmV4cGVjdGVkIG51bWJlciBhdCBpZGVudGlmaWNhdG9yOiBcIiArIG5hbWU7XG5cdH0sXG5cdHVuZGV4cGVjdGVkSWRlbnRpZmljYXRvciA6IGZ1bmN0aW9uKG5hbWUpe1xuXHRcdHJldHVybiBcIlN5bnRheCBFcnJvcjo6IHVuZXhwZWN0ZWQgaWRlbnRpZmljYXRvcjogXCIgKyBuYW1lO1xuXHR9XG59IiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gXHR1dWlkOiBmdW5jdGlvbihsZW5ndGgsIGNpZCl7XG5cdFx0dmFyIGMgPSBsZW5ndGggfHwgMTAwO1xuXHRcdHJldHVybiBbYyxjLGMsY10ubWFwKGZ1bmN0aW9uKGkpeyBcblx0XHRcdCByZXR1cm4gaSAqIE1hdGgucmFuZG9tKCkgPj4gMDtcblx0XHR9KS5qb2luKGNpZCB8fCBcIl9cIik7XG4gXHR9LFxuIFx0cHJvcCA6IGZ1bmN0aW9uKHApe1xuIFx0XHRyZXR1cm4gZnVuY3Rpb24obyl7XG4gXHRcdFx0cmV0dXJuIG9bcF07XG4gXHRcdH1cbiBcdH0sXG4gXHRmbmFtZSA6IGZ1bmN0aW9uKCl7XG4gXHRcdHJldHVybiBcImZuX1wiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpLnRvU3RyaW5nKCkuc2xpY2UoLTMpKSArIHRoaXMudXVpZCgpXG4gXHR9LFxuXHR0b0FycmF5OiBmdW5jdGlvbiAoYSl7IFxuXHRcdHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhKTsgXG5cdH0sXG5cdGZub3AgOiBmdW5jdGlvbihvcCl7XG5cdFx0cmV0dXJuIGV2YWwoXCIoZnVuY3Rpb24oYSxiKXsgcmV0dXJuIGFcIitvcCtcImI7fSlcIik7XG5cdH0sXG5cdGlzQXJyYXkgOiBmdW5jdGlvbihlKXtcblx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheShlKTtcblx0fSxcblx0ZXF1YWxzIDogZnVuY3Rpb24oeCwgeSl7XG5cdFx0aWYgKCB4ID09PSB5ICkgcmV0dXJuIHRydWU7XG5cdFxuXHRcdGlmICggISAoIHggaW5zdGFuY2VvZiBPYmplY3QgKSB8fCAhICggeSBpbnN0YW5jZW9mIE9iamVjdCApICkgcmV0dXJuIGZhbHNlO1xuXHRcblx0XHRpZiAoIHguY29uc3RydWN0b3IgIT09IHkuY29uc3RydWN0b3IgKSByZXR1cm4gZmFsc2U7XG5cdFxuXHRcdGZvciAoIHZhciBwIGluIHggKSB7XG5cdFx0XHRpZiAoICEgeC5oYXNPd25Qcm9wZXJ0eSggcCApICkgY29udGludWU7XG5cdFx0XG5cdFx0XHRpZiAoICEgeS5oYXNPd25Qcm9wZXJ0eSggcCApICkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XG5cdFx0XHRpZiAoIHhbIHAgXSA9PT0geVsgcCBdICkgY29udGludWU7XG5cdFx0XG5cdFx0XHRpZiAoIHR5cGVvZiggeFsgcCBdICkgIT09IFwib2JqZWN0XCIgKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcblx0XHRcdGlmICggISB0aGlzLmVxdWFscyggeFsgcCBdLCAgeVsgcCBdICkgKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcblx0XHR9XG5cblx0XHRmb3IgKCBwIGluIHkgKSB7XG5cdFx0XHRpZiAoIHkuaGFzT3duUHJvcGVydHkoIHAgKSAmJiAhIHguaGFzT3duUHJvcGVydHkoIHAgKSApIHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0dG9rZW46IHtcblx0XHRpc1N0cmluZzogZnVuY3Rpb24odCl7XG5cdFx0XHRyZXR1cm4gL15cIi4qXCIkLy50ZXN0KHQpO1xuXHRcdH0sXG5cdFx0aXNOdW1iZXI6IGZ1bmN0aW9uKHQpe1xuXHRcdFx0cmV0dXJuIC9eXFxkKiQvLnRlc3QodCk7XG5cdFx0fSxcblx0XHRpc0RlbGltOiBmdW5jdGlvbih0KXtcblx0XHRcdHJldHVybiBcIltdKCl7fSxcIi5pbmRleE9mKHQpID49IDA7XG5cdFx0fVxuXHR9XG59IiwiKGZ1bmN0aW9uIChwcm9jZXNzKXtcbi8qIERlcGVuZGVuY2llcyAqL1xudmFyIF8gICAgICAgPSByZXF1aXJlKFwiLi9ldGMvVXRpbHMuanNcIiksXG4gICAgRXJyb3JzICA9IHJlcXVpcmUoXCIuL2V0Yy9FcnJvcnMuanNcIiksXG4gICAgU2V0ICAgICA9IHJlcXVpcmUoXCIuL3R5cGVzL1NldC5qc1wiKTtcbiAgICBIYXNoICAgICA9IHJlcXVpcmUoXCIuL3R5cGVzL0hhc2guanNcIik7XG5cbi8qIE1haW4gaW50ZXJwcmV0ZXIgZnVuY3Rpb24gdGFrZXMgYXJyYXkgYW5kIHByZXZpb3VzIGZvcm0qL1xudmFyIEppc3AgPSBmdW5jdGlvbihmb3JtLCBwcmV2LCBwcmV2X3Bvc2l0aW9uKXtcbiAgdmFyIGFzQXJnID0gZmFsc2U7XG5cbiAgaWYoQXJyYXkuaXNBcnJheShmb3JtKSl7XG4gICAgZm9yKHZhciBwb3NpdGlvbj0wLCBsZW5ndGg9Zm9ybS5sZW5ndGg7IHBvc2l0aW9uPGxlbmd0aDsgcG9zaXRpb24rKyl7XG4gICAgICB2YXIgdG9rZW4gPSBmb3JtW3Bvc2l0aW9uXTtcbiAgICAgIFxuICAgICAgaWYocHJldl9wb3NpdGlvbiA9PT0gMCl7XG4gICAgICAgIGFzQXJnID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLyogaWYgaWRlbnRpZmljYXRvciAqL1xuICAgICAgaWYodG9rZW4uaWQgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgIHZhciBpZCA9IHRva2VuLmlkO1xuICAgICAgICBcbiAgICAgICAgaWYocHJldiAmJiBwcmV2LmlkID09ICdkZWYnKXtcbiAgICAgICAgICAvKiBIZXJlIHdlIGNhbiBjaGVjayBSZWZlcmVuY2UgRXJyb3JzIGFuZCBTY29wZSBmb2xkaW5nKi9cbiAgICAgICAgfWVsc2V7XG5cbiAgICAgICAgICAvKiBEZWZpbmVkIHZhcmlhYmxlcyBkZXJlZmVyZW5jZXMgKi9cbiAgICAgICAgICBpZihKaXNwLnZhcnNbaWRdICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgdmFyIF92YXIgPSBKaXNwLnZhcnNbaWRdLnZhbHVlOyAgICAgICAgICAgIFxuXG4gICAgICAgICAgICBpZighX3Zhcil7XG4gICAgICAgICAgICAgIHZhciBqaWQgPSBKaXNwLnZhcnNbaWRdO1xuICAgICAgICAgICAgICBfdmFyID0gSmlzcC52YXJzW2ppZF0uaWQgPyBKaXNwLnZhcnNbamlkXS52YWx1ZSA6IEppc3AudmFyc1tKaXNwLnZhcnNbamlkXS5pZF0udmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHR5cGVvZiBfdmFyID09ICdmdW5jdGlvbicgJiYgcG9zaXRpb24gPT0gMCl7XG4gICAgICAgICAgICAgIGlmKCFhc0FyZyl7XG4gICAgICAgICAgICAgICAgZm9ybSA9IF92YXIuYXBwbHkoZm9ybSwgSmlzcChmb3JtLnNsaWNlKDEpLCBmb3JtLCBwb3NpdGlvbikpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgZm9ybVtwb3NpdGlvbl0gPSBKaXNwLnZhcnNbaWRdLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuXG4gICAgICAgICAgLyogUmVzZXJ2ZWQgbmFtZXMgZGVyZWZlcmVuY2VzICovXG4gICAgICAgICAgaWYoSmlzcC5uYW1lc1tpZF0gIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICB2YXIga2V5d29yZCA9IEppc3AubmFtZXNbaWRdO1xuXG4gICAgICAgICAgICBpZih0eXBlb2Yga2V5d29yZCA9PSAnZnVuY3Rpb24nICYmIHBvc2l0aW9uID09IDApe1xuICAgICAgICAgICAgICB2YXIgYXJndiA9IGZvcm0uc2xpY2UoMSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgaWYoIWtleXdvcmQucXVvdGUpe1xuICAgICAgICAgICAgICAgIGFyZ3YgPSBKaXNwKGFyZ3YsIHRva2VuLCBwb3NpdGlvbik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYoIWFzQXJnKXtcbiAgICAgICAgICAgICAgICBmb3JtID0ga2V5d29yZC5hcHBseShmb3JtLCBhcmd2KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfWVsc2VcbiAgICAgICAgICAgIGlmKHR5cGVvZiBrZXl3b3JkID09ICdmdW5jdGlvbicgJiYgcG9zaXRpb24gIT09IDApe1xuICAgICAgICAgICAgICBmb3JtW3Bvc2l0aW9uXSA9IHRva2VuO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIGZvcm1bcG9zaXRpb25dID0gSmlzcC5uYW1lc1tpZF0udmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgIH1lbHNleyAgICAgICAgXG4gICAgICAgIC8qIFJlY3Vyc2l2ZSBpbnRlcnByZXRhdGlvbnMgKi9cbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheSh0b2tlbikpeyAgICAgICAgICBcbiAgICAgICAgICBmb3JtW3Bvc2l0aW9uXSA9IEppc3AodG9rZW4pO1xuICAgICAgICB9XG4gICAgICB9XHRcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZm9ybTtcbn1cblxuLyogU3RvcmFnZXMgKi9cbkppc3AubmFtZXMgPSB7fTsgLyogUmVzZXJ2ZWQgbmFtZXMgKi9cbkppc3AudmFycyA9IHt9OyAvKiBVc2VyIHZhcmlhYmxlcyAqL1xuXG4vKiBIZWxwaW5nIG1ldGhvZCB0byBjcmVhdGUgZnVuY3Rpb25zIHdpdGggYXJpdGh5IGNoZWNraW5nIGFuZCBhdXRvbWF0aWNhbHkgcXVvdGVkICovXG5KaXNwLmRlZnVuID0gZnVuY3Rpb24oZm4sIGFyaXR5LCBxdW90ZSl7XG5cdHZhciByZXMgPSBmdW5jdGlvbigpe1xuXHRcdGlmKGFyaXR5ICYmIGFyZ3VtZW50cy5sZW5ndGggPiBhcml0eSl7XG5cdFx0XHR0aHJvdyBFcnJvcnMuYXJpdHlFcnJvcihhcml0eSwgYXJndW1lbnRzLmxlbmd0aCk7XG5cdFx0fVxuXHRcdGlmKGZuLmxlbmd0aCAmJiBhcmd1bWVudHMubGVuZ3RoID4gZm4ubGVuZ3RoKXtcblx0XHRcdGNvbnNvbGUud2FybihcIldhcm5pbmchIE1heSBjYXVzZSBvZjpcIiArIEVycm9ycy5hcml0eUVycm9yKGFyaXR5LCBhcmd1bWVudHMubGVuZ3RoKSlcblx0XHR9XG5cdFx0cmV0dXJuIGZuLmFwcGx5KEppc3AuY3VycmVudFNjb3BlLCBhcmd1bWVudHMpO1xuXHR9XG5cdGlmKHF1b3RlKXtcblx0XHRyZXMucXVvdGUgPSB0cnVlO1xuXHR9XG5cdHJlcy5hcml0eSA9IGFyaXR5O1xuXHRyZXR1cm4gcmVzO1xufVxuXG5KaXNwLm5hbWVzWydkZWZpbmVkPyddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihlKXtcbiAgcmV0dXJuIHR5cGVvZiAoSmlzcC5uYW1lc1tlLmlkXSB8fCBKaXNwLnZhcnNbZS5pZF0pICE9PSBcInVuZGVmaW5lZFwiO1xufSwgMSwgdHJ1ZSk7XG5cbkppc3AubmFtZXNbJ3VzZSddID0gZnVuY3Rpb24obGliKXtcbiAgdmFyIGZpbGVuYW1lID0gbGliLmlkICsgXCIuamlzcFwiO1xuXG4gIHJlcXVpcmUoJ2ZzJykucmVhZEZpbGUoZmlsZW5hbWUsIHtlbmNvZGluZzogJ3V0Zi04J30sIGZ1bmN0aW9uKGVyciwgZGF0YSl7XG4gICAgaWYoZXJyKXtcbiAgICAgIHRocm93IGVycjtcbiAgICB9ZWxzZXtcbiAgICAgIEppc3AuRXZhbChkYXRhKTtcbiAgICB9XG4gIH0pXG5cbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qIERFRklOSVRJT05TICovXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vKiBEZWZpbmUgKi9cbkppc3AubmFtZXMuZGVmID0gSmlzcC5kZWZ1bihmdW5jdGlvbihuYW1lLCB2YWx1ZSl7XG4gIHZhciBpZCA9IG5hbWUuaWQgfHwgbmFtZTtcblxuXHQvKiBFcnJvciBjaGVja2luZyAqL1xuXHRpZihKaXNwLm5hbWVzW2lkXSl7XG5cdFx0dGhyb3cgRXJyb3JzLnJlc2VydmVkRXJyb3IoaWQpO1xuXHR9ZWxzZVxuXHRpZigvXFxkKy8udGVzdChpZCkpe1xuXHRcdHRocm93IEVycm9ycy5zeW50YXhFcnJvck51bWJlcihuYW1lKTtcblx0fWVsc2Vcblx0aWYoIWlkLmxlbmd0aCl7XG5cdFx0dGhyb3cgRXJyb3JzLnVuZGV4cGVjdGVkSWRlbnRpZmljYXRvcihuYW1lKTtcblx0fVxuXHRcblx0aWYodmFsdWUuaWQpe1xuICAgIEppc3AudmFyc1tuYW1lLmlkXSA9ICh2YWx1ZS5pZCA/IHZhbHVlLmlkIDogdmFsdWUpO1xuXG5cdH1lbHNle1xuXHRcdEppc3AudmFyc1tpZF0gPSB7XG5cdFx0XHRpZDogaWQsXG5cdFx0XHR2YWx1ZTogdmFsdWVcblx0XHR9XG5cdH1cblxuICByZXR1cm4gdmFsdWU7XG5cbn0sIDIpO1xuXG4vKiBMYW1iZGEgZnVuY3Rpb24gZGVmaW5pdGlvbnMqL1xuSmlzcC5uYW1lcy5sYW1iZGEgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGFyZ3YsIGJvZHkpe1xuXHR2YXIgbmFtZXMgPSBhcmd2Lm1hcChfLnByb3AoJ2lkJykpLFx0XG5cdCAgICBmbmFtZSA9IF8uZm5hbWUoKTtcblx0XG5cdGZ1bmN0aW9uIGJvZHlfcGFyc2VyKGJvZHksIGFyZ3Mpe1xuXHRcdHJldHVybiBib2R5Lm1hcChmdW5jdGlvbih0b2tlbil7XG5cdFx0XHRpZihBcnJheS5pc0FycmF5KHRva2VuKSl7XG5cdFx0XHRcdHJldHVybiBib2R5X3BhcnNlcih0b2tlbiwgYXJncyk7XG5cdFx0XHR9ZWxzZVxuXHRcdFx0aWYodG9rZW4uaWQgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgIHZhciByZXN0cCA9IG5hbWVzLmluZGV4T2YoJyYnKTtcbiAgICAgICAgXG4gICAgICAgIG5hbWVzLmZvckVhY2goZnVuY3Rpb24oYXJnX25hbWUsIGFyZ19wb3NpdGlvbil7XG4gICAgICAgICAgaWYoYXJnX25hbWUgPT0gdG9rZW4uaWQgJiYgYXJnX25hbWUgIT09ICcmJyl7XG5cdFx0XHRcdFx0XHR0b2tlbiA9IGFyZ3NbYXJnX3Bvc2l0aW9uXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1x0XHRcdFx0XG5cbiAgICAgICAgaWYodG9rZW4uaWQgPT0gJyYnICYmIHJlc3RwID49IDApe1xuICAgICAgICAgIGlmKGFyZ3MubGVuZ3RoID49IGFyZ3YubGVuZ3RoKXtcbiAgICAgICAgICAgIHRva2VuID0gXy50b0FycmF5KGFyZ3MpLnNsaWNlKHJlc3RwLCAocmVzdHAgPT0gYXJndi5sZW5ndGgtMSkgPyB2b2lkIDAgOiAtMSk7XG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICB0aHJvdyBcIklsbGVnYWwgdXNhZ2Ugb2YgdGhlICYgKFJFU1Qgb2YgYXJndW1lbnRzKVwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdG9rZW47XG5cdFx0fSk7XG5cdH1cblxuXHRKaXNwLnZhcnNbZm5hbWVdID0ge1xuXHRcdGlkOiBmbmFtZSwgXG5cdFx0dmFsdWU6IGZ1bmN0aW9uKCl7XG4gICAgICB2YXIgcGFyc2VkX2JvZHkgPSBib2R5X3BhcnNlcihib2R5LCBhcmd1bWVudHMpO1xuXHRcdFx0cmV0dXJuIEppc3AocGFyc2VkX2JvZHksIHtpZDogZm5hbWV9KTtcblx0XHR9XG5cdH07XG5cdFx0XG5cdHJldHVybiB7aWQ6IGZuYW1lfTtcbn0sIDIsIHRydWUpO1xuXG4vKiBMZXQgYmluZGluZ3MgKi9cbkppc3AubmFtZXMubGV0ID0gSmlzcC5kZWZ1bihmdW5jdGlvbihiaW5kaW5ncywgYm9keSl7XG4gIGlmKGJpbmRpbmdzLmxlbmd0aCUyKXsgdGhyb3cgRXJyb3IubGV0QXJpdHlFcnJvcjsgIH1cbiAgXG4gIGZ1bmN0aW9uIHBhcnNlQm9keSh0b2tlbiwgYXJyKXsgICAgXG4gICAgaWYodG9rZW4uaWQpe1xuICAgICAgYXJyLmZvckVhY2goZnVuY3Rpb24oYWxpYXMpe1xuICAgICAgICBpZihhbGlhcy5pZCA9PSB0b2tlbi5pZCl7XG4gICAgICAgICAgdG9rZW4gPSBhbGlhcy52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYoQXJyYXkuaXNBcnJheSh0b2tlbikpe1xuICAgICAgcmV0dXJuIHRva2VuLm1hcChmdW5jdGlvbih4KXtcbiAgICAgICAgcmV0dXJuIHBhcnNlQm9keSh4LCBhcnIpO1xuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gdG9rZW47XG4gIH1cblxuICB2YXIgYWxpYXNlcyA9IFtdXG5cbiAgZm9yKHZhciBpPTAsbD1iaW5kaW5ncy5sZW5ndGg7aTxsO2krPTIpe1xuICAgIGFsaWFzZXMucHVzaCh7XG4gICAgICBpZDogYmluZGluZ3NbaV0uaWQsXG4gICAgICB2YWx1ZSA6IEppc3AocGFyc2VCb2R5KGJpbmRpbmdzW2krMV0sIGFsaWFzZXMpKVxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIEppc3AoYm9keS5tYXAoZnVuY3Rpb24odG9rZW4pe1xuICAgIHJldHVybiBwYXJzZUJvZHkodG9rZW4sIGFsaWFzZXMpO1xuICB9KSk7XG59LCAyLCB0cnVlKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qIENvbnN0cnVjdGlvbnMgKi9cblxuLyogQ29uZGl0aW9ucyAqL1xuSmlzcC5uYW1lc1snaWYnXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYywgdCwgZSl7XG4gIHJldHVybiBKaXNwKGMpID8gSmlzcCh0KSA6IChlID8gSmlzcChlKSA6IG51bGwpO1xufSwzLCB0cnVlKTtcblxuSmlzcC5uYW1lcy5jb25kID0gSmlzcC5kZWZ1bihmdW5jdGlvbigpeyBcbiAgdmFyIGFyZ3YgPSBfLnRvQXJyYXkoYXJndW1lbnRzKTtcbiAgdmFyIF9kZWZhdWx0O1xuICB2YXIgYXJjaGVjaztcblxuICBpZihhcmd2Lmxlbmd0aCUyKXtcbiAgICB2YXIgY2hlY2sgPSBKaXNwKGFyZ3ZbMF0pO1xuICAgIGFyZ3YgPSBhcmd2LnNsaWNlKDEpO1xuICAgIGFyY2hlY2sgPSB0cnVlO1xuICB9XG5cbiAgZm9yKHZhciBpPTAsbD1hcmd2Lmxlbmd0aDtpPGw7aSs9Mil7XG5cbiAgICBpZihhcmd2W2ldLmlkICYmIGFyZ3ZbaV0uaWQgPT0gJyYnKXtcbiAgICAgIF9kZWZhdWx0ID0gW2FyZ3ZbaV0sIGFyZ3ZbaSsxXV07XG4gICAgfWVsc2V7XG4gICAgICBpZihhcmNoZWNrKXtcbiAgICAgICAgaWYoXy5lcXVhbHMoY2hlY2ssIEppc3AoYXJndltpXSkpKXtcbiAgICAgICAgICByZXR1cm4gSmlzcChhcmd2W2krMV0pO1xuICAgICAgICB9XG4gICAgICB9ZWxzZXtcbiAgICAgICAgaWYoSmlzcChhcmd2W2ldKSl7XG4gICAgICAgICAgcmV0dXJuIEppc3AoYXJndltpKzFdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmKF9kZWZhdWx0KXtcbiAgICB2YXIgcmVzID0gX2RlZmF1bHRbMV07XG4gICAgcmV0dXJuIEppc3AocmVzKTtcbiAgfWVsc2V7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbn0sIG51bGwsIHRydWUpO1xuXG4vKiBRdW90YXRpb24gKi9cbkppc3AubmFtZXMucXVvdGUgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEpe1xuICByZXR1cm4gYTtcbn0sIG51bGwsIHRydWUpO1xuXG4vKiBBcHBseWluZyAqL1xuSmlzcC5uYW1lcy5hcHBseSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oZm4sIGFycil7XG4gIHJldHVybiBKaXNwKFtmbl0uY29uY2F0KEppc3AoYXJyKSkpO1xufSwgMiwgdHJ1ZSk7XG5cbkppc3AubmFtZXNbJ2RvJ10gPSBmdW5jdGlvbigpe1xuICB2YXIgYXJndiA9IF8udG9BcnJheShhcmd1bWVudHMpLCByZXM7XG4gIGZvcih2YXIgaSA9IDAsIGwgPSBhcmd2Lmxlbmd0aDsgaTxsOyBpKyspe1xuICAgIHJlcyA9IEppc3AoYXJndltpXSk7XG4gICAgaWYoaSA9PSBsLTEpe1xuICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG4gIH1cbn1cblxuLyogRXZhbHVhdGlvbiAqL1xuSmlzcC5uYW1lc1snZXZhbCddID0gZnVuY3Rpb24oZXhwcmVzc2lvbil7XG4gIHJldHVybiBKaXNwKEppc3AoZXhwcmVzc2lvbikpO1xufVxuXG5KaXNwLm5hbWVzWyd0aHJvdyddID0gZnVuY3Rpb24obWVzc2FnZSl7XG4gIHRocm93IG1lc3NhZ2U7XG59XG5cbkppc3AubmFtZXNbJ3NldCEnXSA9IGZ1bmN0aW9uKHgsIHkpe1xuICBKaXNwLnZhcnNbeC5pZF0gPSB5XG59XG5cbkppc3AubmFtZXNbJ2RlZm1hY3JvJ10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKG5hbWUsIGFyZ3MsIGJvZHkpe1xuICB2YXIgbWFjcm8gPSBbXG4gICAge2lkOiAnZGVmdW4nfSxcbiAgICBuYW1lLFxuICAgIGFyZ3MsXG4gICAgW3tpZDogJ3F1b3RlJywgfSwgYm9keV1cbiAgXVxuICBKaXNwKG1hY3JvKTtcbn0sIDIsIHRydWUpO1xuXG5KaXNwLm5hbWVzWyd0eXBlPyddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihvKXtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgbztcbiAgaWYoQXJyYXkuaXNBcnJheShvKSl7XG4gICAgaWYoby50eXBlKXtcbiAgICAgIHR5cGUgPSBvLnR5cGU7XG4gICAgfWVsc2V7XG4gICAgICB0eXBlID0gJ2xpc3QnO1xuICAgIH1cbiAgfWVsc2V7XG4gICAgaWYodHlwZSA9PSAnb2JqZWN0Jyl7XG4gICAgICB0eXBlID09IFwiaGFzaFwiO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHlwZTtcbn0sIDEpO1xuXG5KaXNwLm5hbWVzLnNjYW4gPSBmdW5jdGlvbihtZXNzYWdlLCBpZCwgZm4pe1xuICB2YXIgcmVhZGxpbmUgPSByZXF1aXJlKCdyZWFkbGluZScpLFxuICAgICAgcmwgPSByZWFkbGluZS5jcmVhdGVJbnRlcmZhY2Uoe1xuICAgICAgICBpbnB1dDogcHJvY2Vzcy5zdGRpbixcbiAgICAgICAgb3V0cHV0OiBwcm9jZXNzLnN0ZG91dCxcbiAgICAgICAgdGVybWluYWw6IGZhbHNlXG4gICAgICB9KTtcblxuICBybC5xdWVzdGlvbihcIj4gXCIgKyBtZXNzYWdlLCBmdW5jdGlvbihyZXMpe1xuICAgIEppc3AuRXZhbChcIihkZWYgXCIgKyBpZC5pZCArIFwiIFxcXCJcIiArIHJlcy50b1N0cmluZygpICsgXCJcXFwiIClcIik7XG4gICAgcmwuY2xvc2UoKTtcbiAgICBKaXNwKFtmbiwgaWRdKTtcbiAgfSk7XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiBNQUNST1NFUyAqL1xuSmlzcC5uYW1lcy5kZWZ1biA9IEppc3AuZGVmdW4oZnVuY3Rpb24obmFtZSwgYXJndiwgYm9keSl7XG4gIHZhciByZXMgPSBbXG4gICAge2lkOiAnZGVmJ30sIFxuICAgIHtpZDogbmFtZS5pZH0sIFxuICAgIFsge2lkOidsYW1iZGEnfSBdLmNvbmNhdChbYXJndiwgYm9keV0pXTtcbiAgcmV0dXJuIEppc3AocmVzKTtcbn0sIDMsIHRydWUpO1xuXG5KaXNwLm5hbWVzLmxvZyA9IGZ1bmN0aW9uKGUpe1xuICBKaXNwLnN0ZG91dC53cml0ZShKaXNwLmppc3Bpbml6ZShlKSk7XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qIExJU1QgREFUQSBUWVBFICovXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkppc3AubmFtZXMuY2FyID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhKXsgcmV0dXJuIGFbMF07IH0sIDEpO1xuSmlzcC5uYW1lcy5jZHIgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEpeyByZXR1cm4gYS5zbGljZSgxKTsgfSwgMSk7XG5KaXNwLm5hbWVzLmNvbnMgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsIGIpeyByZXR1cm4gW2FdLmNvbmNhdChiKTsgfSwgMik7XG5KaXNwLm5hbWVzLmpvaW4gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsIGMpeyByZXR1cm4gYS5qb2luKGMpOyB9LCAyKTtcbkppc3AubmFtZXMubGlzdCA9IGZ1bmN0aW9uKCl7IHJldHVybiBfLnRvQXJyYXkoYXJndW1lbnRzKTsgfVxuSmlzcC5uYW1lc1snbGVuZ3RoJ10gPSBmdW5jdGlvbihlKXtcbiAgcmV0dXJuIGUubGVuZ3RoO1xufVxuXG5KaXNwLm5hbWVzLnJhbmdlID0gSmlzcC5kZWZ1bihmdW5jdGlvbihmcm9tLCB0byl7XG4gIGlmKCF0byl7XG4gICAgdG8gPSBmcm9tO1xuICAgIGZyb20gPSAwO1xuICB9XG4gIFxuICB2YXIgcmVzID0gW10sIGVuZCA9IHRvO1xuXG4gIHdoaWxlKGZyb208PWVuZCl7XG4gICAgcmVzLnB1c2goZnJvbSsrKTtcbiAgfVxuICBcbiAgcmV0dXJuIHJlcztcbn0sIDIpO1xuXG5KaXNwLm5hbWVzLm1hcCA9IEppc3AuZGVmdW4oZnVuY3Rpb24oZm4sIGFycil7XG4gIHJldHVybiBKaXNwKGFycikubWFwKGZ1bmN0aW9uKGl0ZW0pe1xuICAgIHJldHVybiBKaXNwKFtmbiwgaXRlbV0pO1xuICB9KTtcbn0sIDIsIHRydWUpO1xuXG5KaXNwLm5hbWVzLnJlZHVjZSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oZm4sIGFycil7XG4gIHJldHVybiBKaXNwKGFycikucmVkdWNlKGZ1bmN0aW9uKGEsIGIpe1xuICAgIHJldHVybiBKaXNwKFtmbiwgYSAsYl0pO1xuICB9KTtcbn0sIDIsIHRydWUpO1xuXG5KaXNwLm5hbWVzLmZpbHRlciA9IEppc3AuZGVmdW4oZnVuY3Rpb24oZm4sIGFycil7XG4gIHJldHVybiBKaXNwKGFycikuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pe1xuICAgIHJldHVybiBKaXNwKFtmbiwgaXRlbV0pO1xuICB9KTtcbn0sIDIsIHRydWUpO1xuXG5KaXNwLm5hbWVzLnN0ciA9IGZ1bmN0aW9uKCl7XG4gIHJldHVybiAgXy50b0FycmF5KGFyZ3VtZW50cykubWFwKGZ1bmN0aW9uKGUpe1xuICAgIHJldHVybiBlLnRvU3RyaW5nID8gZS50b1N0cmluZygpIDogT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGUpO1xuICB9KS5qb2luKFwiXCIpO1xufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiBTRVQgREFUQSBUWVBFICovXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbkppc3AubmFtZXMuc2V0ID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIG5ldyBTZXQoXy50b0FycmF5KGFyZ3VtZW50cykpO1xufVxuXG5KaXNwLm5hbWVzLmFkZCA9IGZ1bmN0aW9uKCl7XG4gIHZhciBhcmd2ID0gXy50b0FycmF5KGFyZ3VtZW50cyksXG4gICAgICBzZXQgID0gbmV3IFNldChhcmd2WzBdLml0ZW1zKTtcblxuICBhcmd2LnNsaWNlKDEpLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7IHNldC5hZGQoaXRlbSk7ICB9KTtcblxuICByZXR1cm4gc2V0O1xufVxuXG5KaXNwLm5hbWVzLnJlbW92ZSA9IGZ1bmN0aW9uKCl7XG4gIHZhciBhcmd2ID0gXy50b0FycmF5KGFyZ3VtZW50cyksXG4gICAgICBzZXQgPSBuZXcgU2V0KGFyZ3ZbMF0uaXRlbXMpO1xuXG4gIGFyZ3Yuc2xpY2UoMSkuZm9yRWFjaChmdW5jdGlvbihpdGVtKXsgc2V0LnJlbW92ZShpdGVtKTsgfSlcbiAgcmV0dXJuIHNldDtcbn1cblxuSmlzcC5uYW1lcy51bmlvbiA9IGZ1bmN0aW9uKGEsIGIpe1xuXHRyZXR1cm4gKG5ldyBTZXQoYS5pdGVtcykpLnVuaW9uKGIpO1xufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiBIQVNIIERBVEEgVFlQRSAqL1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuSmlzcC5uYW1lcy5oYXNoID0gZnVuY3Rpb24oKXtcblx0cmV0dXJuIG5ldyBIYXNoKF8udG9BcnJheShhcmd1bWVudHMpKS5pdGVtcztcbn1cblxuSmlzcC5uYW1lcy5hc3NvYyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBhcmd2ID0gXy50b0FycmF5KGFyZ3VtZW50cyk7XG4gIHJldHVybiAobmV3IEhhc2goYXJndlswXSkpLmFzc29jKGFyZ3Yuc2xpY2UoMSkpO1xufVxuXG5KaXNwLm5hbWVzLmRpc3NvYyA9IGZ1bmN0aW9uKCl7XG4gIHZhciBhcmd2ID0gXy50b0FycmF5KGFyZ3VtZW50cyk7XG4gIHJldHVybiAobmV3IEhhc2goYXJndlswXSkpLmRpc3NvYyhhcmd2LnNsaWNlKDEpKTtcbn1cblxuSmlzcC5uYW1lcy5nZXQgPSBmdW5jdGlvbihhLCBiKXtcbiAgcmV0dXJuIGFbYi5pZCA/IGIuaWQuc2xpY2UoMSkgOiBiXTtcbn1cblxuSmlzcC5uYW1lc1tcIi5cIl0gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGhhc2gsIG5hbWUpe1xuICBoYXNoID0gaGFzaC5pZCA/IEppc3AudmFyc1toYXNoLmlkXS52YWx1ZSA6IEppc3AoaGFzaCk7XG4gIHJldHVybiBuYW1lLmlkID8gaGFzaFtuYW1lLmlkXSB8fCBoYXNoW25hbWVdIDogaGFzaFtuYW1lXTtcbn0sIDIsIHRydWUpO1xuXG4vKiBNYXRoIG9wZXJhdGlvbnMgKi9cbkppc3AubmFtZXNbJysnXSA9IGZ1bmN0aW9uKGUpeyByZXR1cm4gXy50b0FycmF5KGFyZ3VtZW50cykucmVkdWNlKF8uZm5vcCgnKycpKTsgfVxuSmlzcC5uYW1lc1snLSddID0gZnVuY3Rpb24oZSl7IHJldHVybiBfLnRvQXJyYXkoYXJndW1lbnRzKS5yZWR1Y2UoXy5mbm9wKCctJykpOyB9XG5KaXNwLm5hbWVzWycqJ10gPSBmdW5jdGlvbihlKXsgcmV0dXJuIF8udG9BcnJheShhcmd1bWVudHMpLnJlZHVjZShfLmZub3AoJyonKSk7IH1cbkppc3AubmFtZXNbJy8nXSA9IGZ1bmN0aW9uKGUpeyByZXR1cm4gXy50b0FycmF5KGFyZ3VtZW50cykucmVkdWNlKF8uZm5vcCgnLycpKTsgfVxuSmlzcC5uYW1lc1snPiddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLGIpeyByZXR1cm4gYSA+IGI7IH0sIDIpO1xuSmlzcC5uYW1lc1snPiddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLGIpeyByZXR1cm4gYSA+IGI7IH0sIDIpO1xuSmlzcC5uYW1lc1snPj0nXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSxiKXtyZXR1cm4gYSA+PSBiO30sIDIpO1xuSmlzcC5uYW1lc1snPD0nXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSxiKXtyZXR1cm4gYSA8PSBiO30sIDIpO1xuSmlzcC5uYW1lc1snPCddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLGIpe1x0cmV0dXJuIGEgPCBiOyB9LCAyKTtcbkppc3AubmFtZXNbJz0nXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSxiKXtcdHJldHVybiBhID09IGI7fSwgMik7XG5KaXNwLm5hbWVzWydlcT8nXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSxiKXtyZXR1cm4gXy5lcXVhbHMoYSwgYik7fSwgMik7XG5KaXNwLm5hbWVzWydtb2QnXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSxiKXtcdHJldHVybiBhICUgYjsgfSwgMik7XG5KaXNwLm5hbWVzWydhbmQnXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSxiKXtyZXR1cm4gYSAmJiBiO30sIDIpO1xuSmlzcC5uYW1lc1snb3InXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSxiKXsgcmV0dXJuIGEgfHwgYjt9LCAyKTtcbkppc3AubmFtZXNbJ25vdCddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhKXsgIHJldHVybiAhYTt9LCAxKTtcbkppc3AubmFtZXNbJ2xpc3Q/J10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEpeyByZXR1cm4gQXJyYXkuaXNBcnJheShhKTt9LCAxKTtcblxuSmlzcC5qaXNwaW5pemUgPSBmdW5jdGlvbiBsaXNwaW5pemUoanMpe1xuICBmdW5jdGlvbiByZXRva2Uoail7XG4gICAgdmFyIHN0ciA9IEpTT04uc3RyaW5naWZ5KGopO1xuICAgIHJldHVybiByZXMgPSBzdHIucmVwbGFjZSgvXFxbL2csICcoICcpLnJlcGxhY2UoL1xcXS9nLCAnICknKS5yZXBsYWNlKC8sL2csICcgJyk7XG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZUpzKGope1xuICAgIGlmKEFycmF5LmlzQXJyYXkoaikpe1xuICAgICAgcmV0dXJuIHJldG9rZShqLm1hcChwYXJzZUpzKSk7XG4gICAgfWVsc2V7XG4gICAgICBpZih0eXBlb2YgaiA9PT0gJ29iamVjdCcgJiYgIWope1xuICAgICAgICByZXR1cm4gJ25pbCc7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmKGogPT09IHVuZGVmaW5lZCl7XG4gICAgICAgIHJldHVybiAnbmlsJztcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYoai5pZCl7XG4gICAgICAgIHZhciB0eXBlO1xuICAgICAgICBcbiAgICAgICAgdHlwZSA9IHR5cGVvZiAoSmlzcC5uYW1lc1tqLmlkXSB8fCAoSmlzcC52YXJzW2ouaWRdID8gSmlzcC52YXJzW2ouaWRdLnZhbHVlIHx8IEppc3AudmFyc1tqLmlkXSA6IHVuZGVmaW5lZCkpIHx8IFwiSURcIjtcbiAgICAgICAgdHlwZSA9IHR5cGUuc2xpY2UoMCwzKS50b1VwcGVyQ2FzZSgpO1xuXG4gICAgICAgIGlmKHR5cGUgPT0gXCJVTkRcIil7XG4gICAgICAgICAgcmV0dXJuIFwiPFwiICsgai5pZCArIFwiPlwiO1xuICAgICAgICB9ZWxzZXtcblxuICAgICAgICAgIGlmKHR5cGUgPT09IFwiRlVOXCIpe1xuICAgICAgICAgICAgZm9yKHZhciBhbGlhcyBpbiBKaXNwLnZhcnMpe1xuICAgICAgICAgICAgICBpZihqLmlkID09IEppc3AudmFyc1thbGlhc10pe1xuICAgICAgICAgICAgICAgIGouaWQgPSBhbGlhc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIFwiI1wiICsgdHlwZSArIFwiOiA8XCIgICsgai5pZCArIFwiPlwiOyAgXG4gICAgICAgIH0gICAgICAgIFxuICAgICAgfWVsc2VcbiAgICAgIGlmKGouaXRlbXMpe1xuICAgICAgICByZXR1cm4gXCIjU0VUOiA8IFwiICsgcGFyc2VKcyhqLml0ZW1zKSArIFwiID5cIjtcbiAgICAgIH1lbHNle1xuICAgICAgICBpZih0eXBlb2YgaiA9PSAnb2JqZWN0Jyl7XG4gICAgICAgICAgcmV0dXJuIFwiI0hBU0g6IDwgXCIgKyBKU09OLnN0cmluZ2lmeShqKSArIFwiID5cIjtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgaWYodHlwZW9mIGogPT09IFwiYm9vbGVhblwiKXtcbiAgICAgICAgICAgIGlmKGope1xuICAgICAgICAgICAgICByZXR1cm4gXCIjdFwiO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIHJldHVybiBcIm5pbFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgcmV0dXJuIGo7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhcnNlSnMoanMpO1xufVxuXG4vKiBUb2tlbml6ZXIgZnVuY3Rpb24gKi9cbmZ1bmN0aW9uIHRva2VuaXplKGV4cHIpe1x0XG5cdGZ1bmN0aW9uIHN0cmluZ1N3aXBlT24oc3RyaW5nKXtcblx0XHRyZXR1cm4gc3RyaW5nXG5cdFx0XHQucmVwbGFjZSgvIC9nLCBcIl9fUFJPQl9fXCIpXG5cdFx0XHQucmVwbGFjZSgvXFxuL2csIFwiX19OTElOX19cIilcblx0XHRcdC5yZXBsYWNlKC9cXHQvZywgXCJfX05UQUJfX1wiKVxuXHRcdH1cblxuXHRmdW5jdGlvbiBzdHJpbmdTd2lwZU9mZihlKXtcblx0XHRyZXR1cm4gZS5yZXBsYWNlKC9fX1BST0JfXy9nLCBcIiBcIilcblx0XHRcdFx0LnJlcGxhY2UoL19fTkxJTl9fL2csIFwiXFxuXCIpXG5cdFx0XHRcdC5yZXBsYWNlKC9fX05UQUJfXy9nLCBcIlxcdFwiKTtcblx0fVxuXG5cdHZhciBzZXF1ZW5jZXMgPSBleHByXG4gICAgLnJlcGxhY2UoLydcXCguKj9cXCkvZywgZnVuY3Rpb24oZSl7IFxuICAgICAgcmV0dXJuIFwiKHF1b3RlIFwiICsgZS5zbGljZSgxKSArIFwiIClcIjsgfSlcbiAgICAucmVwbGFjZSgvXFx+XFwoLio/XFwpL2csIGZ1bmN0aW9uKGUpeyBcbiAgICAgIHJldHVybiBcIihldmFsIFwiICsgZS5zbGljZSgxKSArIFwiIClcIjsgfSlcbiAgICAucmVwbGFjZSgvXFwoL2csICcgWyAnKVxuICAgIC5yZXBsYWNlKC9cXCkvZywgJyBdICcpXG5cdCAgLnJlcGxhY2UoL1xcOy4rKFxcbnwkKS9nLCAnJylcbiAgICAucmVwbGFjZSgvXFxcIi4qP1xcXCIvZywgc3RyaW5nU3dpcGVPbilcbiAgICAucmVwbGFjZSgvXFx7Lio/XFx9L2csIHN0cmluZ1N3aXBlT24pO1xuXG5cdHJldHVybiBzZXF1ZW5jZXMudHJpbSgpLnNwbGl0KC9cXHMrLykubWFwKHN0cmluZ1N3aXBlT2ZmKTtcbn1cblxuLyogUmV0dXJuIEpTIHN0cnVjdHVyZSBzdHJpbmcgKi9cbmZ1bmN0aW9uIHN0cnVjdHVyaXplKHN0cnVjdCl7XG5cdHN0cnVjdCA9IHN0cnVjdC5tYXAoZnVuY3Rpb24odG9rZW4sIHApe1xuXHRcdHZhciBpc0lkID0gdG9rZW4gIT0gXCJbXCIgJiYgdG9rZW4gIT0gXCJdXCIgJiYgICEvXFxkKy8udGVzdCh0b2tlbikgJiYgdG9rZW5bMF0gIT0gJ1wiJyAmJiB0b2tlblt0b2tlbi5sZW5ndGgtMV0gIT0gJ1wiJyAmJiB0b2tlbiAhPT1cInRcIiAmJiB0b2tlbiAhPT1cIm5pbFwiO1xuXHRcdFxuXHRcdGlmKCBpc0lkICl7XG5cdFx0XHR0b2tlbiA9IFwie2lkOiAnXCIgKyB0b2tlbiArIFwiJ31cIlxuXHRcdH1cblx0XHRcblx0XHRpZih0b2tlbiA9PSBcInRcIil7XG5cdFx0XHR0b2tlbiA9IFwidHJ1ZVwiO1xuXHRcdH1cblxuXHRcdGlmKHRva2VuID09IFwibmlsXCIpe1xuXHRcdFx0dG9rZW4gPSBcImZhbHNlXCI7XG5cdFx0fVxuXHRcdFxuXHRcdGlmKHRva2VuID09IFwiW1wiIHx8IHN0cnVjdFtwKzFdID09IFwiXVwiIHx8IHA9PShzdHJ1Y3QubGVuZ3RoLTEpICl7XG5cdFx0XHRpZih0b2tlblt0b2tlbi5sZW5ndGgtMV0gPT0gJ1wiJyAmJiBzdHJ1Y3RbcCsxXSAhPT0gXCJdXCIpe1xuXHRcdFx0XHRyZXR1cm4gdG9rZW4gKyBcIixcIjsgXG5cdFx0XHR9ZWxzZXtcblx0XHRcdFx0cmV0dXJuIHRva2VuO1xuXHRcdFx0fVxuXHRcdH1lbHNle1xuXHRcdFx0cmV0dXJuIHRva2VuICsgXCIsXCJcblx0XHR9XG5cblxuXHR9KS5qb2luKCcnKTtcblx0XG5cdHJldHVybiBcIltcIiArIHN0cnVjdCArXCJdXCI7XG59XG5cblxuXG5KaXNwLkV2YWwgPSBmdW5jdGlvbihzdHIpe1xuXHR2YXIgc3RydWN0dXJlID0gdG9rZW5pemUoc3RyKSxcblx0XHRqcyA9IHN0cnVjdHVyaXplKHN0cnVjdHVyZSksXG5cdFx0cmVzO1x0XG5cdHRyeXtcblx0XHRyZXMgPSBKaXNwKGV2YWwoanMpKTtcblx0XHRyZXR1cm4gcmVzW3Jlcy5sZW5ndGgtMV07XG5cdH1jYXRjaChlcnJvcil7XG5cdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0cmV0dXJuO1xuXHR9XG59XG5cblxuXG5KaXNwLnNldHVwID0gZnVuY3Rpb24ob3B0aW9ucyl7XG4gIEppc3Auc3RkaW4gPSBvcHRpb25zLnN0ZGluO1xuICBKaXNwLnN0ZG91dCA9IG9wdGlvbnMuc3Rkb3V0O1xuICBKaXNwLmVudiA9IG9wdGlvbnMuZW52O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEppc3A7IFxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIikpIiwidmFyIF8gPSByZXF1aXJlKFwiLi4vZXRjL1V0aWxzLmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpe1xuXHRmdW5jdGlvbiBtb2QobSwgc2V0LCBwcm9wLCB2YWwpe1xuXHRcdHZhciBuYW1lID0gcHJvcC5pZCB8fCBwcm9wO1xuXHRcdGlmKG5hbWVbMF09PVwiOlwiKXtcblx0XHRcdG5hbWUgPSBuYW1lLnNsaWNlKDEpO1xuXHRcdH1cblx0XHRcblx0XHRpZihtID09ICdhZGQnKXtcblx0XHRcdHNldC5pdGVtc1tuYW1lXSA9IHZhbDtcblx0XHR9ZWxzZXtcblx0XHRcdHNldC5pdGVtc1tuYW1lXSA9IG51bGw7XG5cdFx0XHRkZWxldGUgc2V0Lml0ZW1zW25hbWVdO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIEhhc2goYXJndil7XG5cdFx0dGhpcy5pdGVtcyA9IHt9O1xuXG5cdFx0aWYoQXJyYXkuaXNBcnJheShhcmd2KSl7XG5cdFx0XHRpZighYXJndi5sZW5ndGglMil7XG5cdFx0XHRcdHRocm93IFwiQXJpdHkgZXJyb3JcIjtcblx0XHRcdH1cblx0XHRcblx0XHRcdGZvcih2YXIgaT0wLGw9YXJndi5sZW5ndGg7aTxsO2krPTIpe1xuXHRcdFx0XHRtb2QoJ2FkZCcsIHRoaXMsIGFyZ3ZbaV0sIGFyZ3ZbaSsxXSk7XG5cdFx0XHR9XG5cdFx0fWVsc2V7XG5cdFx0XHRmb3IodmFyIGkgaW4gYXJndil7XG5cdFx0XHRcdG1vZCgnYWRkJywgdGhpcywgaSwgYXJndltpXSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0SGFzaC5wcm90b3R5cGUuYXNzb2MgPSBmdW5jdGlvbihhcmd2KSB7XG5cdFx0Zm9yKHZhciBpPTAsbD1hcmd2Lmxlbmd0aDtpPGw7aSs9Mil7XG5cdFx0XHRtb2QoJ2FkZCcsIHRoaXMsIGFyZ3ZbaV0sIGFyZ3ZbaSsxXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLml0ZW1zO1xuXHR9O1xuXG5cdEhhc2gucHJvdG90eXBlLmRpc3NvYyA9IGZ1bmN0aW9uKGFyZ3YpIHtcblx0XHRmb3IodmFyIGk9MCxsPWFyZ3YubGVuZ3RoO2k8bDtpKyspe1xuXHRcdFx0bW9kKCdyZW0nLCB0aGlzLCBhcmd2W2ldKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXM7XG5cdH07XG5cblx0SGFzaC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24ocHJvcCkge1xuXHRcdHZhciBuYW1lID0gcHJvcC5pZCB8fCBwcm9wO1xuXHRcdGlmKG5hbWVbMF09PVwiOlwiKXtcblx0XHRcdG5hbWUgPSBuYW1lLnNsaWNlKDEpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5pdGVtc1tuYW1lXTtcblx0fTtcblxuXHRyZXR1cm4gSGFzaDtcbn0pKCk7IiwidmFyIF8gPSByZXF1aXJlKFwiLi4vZXRjL1V0aWxzLmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpe1xuXHRmdW5jdGlvbiBwdXNoKHNldCwgaXRlbSl7XG5cdFx0aWYoc2V0Lml0ZW1zLmxlbmd0aCl7XG5cdFx0XHRpZihzZXQuaXRlbXMuZXZlcnkoZnVuY3Rpb24oc2l0ZW0pe1xuXHRcdFx0XHRpZighXy5lcXVhbHMoc2l0ZW0sIGl0ZW0pKXtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSkpe1xuXHRcdFx0XHRzZXQuaXRlbXMucHVzaChpdGVtKTtcblx0XHRcdH1cblx0XHR9ZWxzZXtcblx0XHRcdHNldC5pdGVtcy5wdXNoKGl0ZW0pO1xuXHRcdH1cblx0XHRyZXR1cm4gc2V0Lml0ZW1zO1xuXHR9XG5cblx0ZnVuY3Rpb24gU2V0KGl0ZW1zKXtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dGhpcy5pdGVtcyA9IFtdO1xuXG5cdFx0aXRlbXMgJiYgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpKXtcblx0XHRcdHNlbGYuaXRlbXMucHVzaChpKTtcblx0XHR9KTtcblxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLml0ZW1zLCBcInR5cGVcIiwge1xuXHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcblx0XHRcdGVudW1lcmFibGUgOiBmYWxzZSxcblx0XHRcdHZhbHVlOiBcInNldFwiXG5cdFx0fSk7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXM7XG5cdH1cblxuXHRTZXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHgpIHtcblx0XHRwdXNoKHRoaXMsIHgpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdFNldC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oeCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR0aGlzLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSwgaSl7XG5cdFx0XHRpZihfLmVxdWFscyhpdGVtLCB4KSl7XG5cdFx0XHRcdHNlbGYuaXRlbXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdFNldC5wcm90b3R5cGUudW5pb24gPSBmdW5jdGlvbihzZXQpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0c2V0Lml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7XG5cdFx0XHRwdXNoKHNlbGYsIGl0ZW0pO1xuXHRcdH0pO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdHJldHVybiBTZXQ7XG59KSgpOyJdfQ==
