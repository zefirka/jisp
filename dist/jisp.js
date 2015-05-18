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
var _       = require("./etc/Utils.js"),
    Errors  = require("./etc/Errors.js"),
    Set     = require("./types/Set.js");
    Hash     = require("./types/Hash.js")


/* Main interpreter function takes array and previous form*/
var Jisp = function(form, prev){
  if(Array.isArray(form)){

    for(var position=0, length=form.length; position<length; position++){
      var token = form[position];

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
              form = _var.apply(form, Jisp(form.slice(1)));
              break;
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
                argv = Jisp(argv, token);
              }
            
              form = keyword.apply(form, argv);
              break;
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
  return Jisp([fn].concat(arr));
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
  console.log(Jisp.jispinize(e));
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

  return ">" + parseJs(js);
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

function startRepl(){
  var readline = require('readline'),
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });

  rl.on('line', function(line){
    console.log(Jisp.jispinize(Jisp.Eval(line)));
  });

}


if(process.argv.length == 3){
  var filename = process.argv.pop();
  require('fs').readFile(filename, {encoding: 'utf-8'}, function(err, data){
    if(err){
      if(filename == "-r"){
        startRepl();
      }else{
        throw err;
      }
    }else{
      Jisp.Eval(data);
    }
  })
}else{
  if(process.argv.length == 2){
    startRepl();
  }else{
    var filename = process.argv.pop();
    require('fs').readFile(filename, {encoding: 'utf-8'}, function(err, data){
      if(err){
        throw err;
      }else{
        Jisp.Eval(data);
      }

      if(process.argv.indexOf("-r")>=0){
        startRepl();
      }    
    });

  }
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2RhdC9Eb2N1bWVudHMvSklTUC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kYXQvRG9jdW1lbnRzL0pJU1Avbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL2hvbWUvZGF0L0RvY3VtZW50cy9KSVNQL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9ob21lL2RhdC9Eb2N1bWVudHMvSklTUC9zcmMvZXRjL0Vycm9ycy5qcyIsIi9ob21lL2RhdC9Eb2N1bWVudHMvSklTUC9zcmMvZXRjL1V0aWxzLmpzIiwiL2hvbWUvZGF0L0RvY3VtZW50cy9KSVNQL3NyYy9mYWtlX2RiZTVkNTEyLmpzIiwiL2hvbWUvZGF0L0RvY3VtZW50cy9KSVNQL3NyYy90eXBlcy9IYXNoLmpzIiwiL2hvbWUvZGF0L0RvY3VtZW50cy9KSVNQL3NyYy90eXBlcy9TZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDanFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsbnVsbCwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxucHJvY2Vzcy5uZXh0VGljayA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGNhblNldEltbWVkaWF0ZSA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnNldEltbWVkaWF0ZTtcbiAgICB2YXIgY2FuUG9zdCA9IHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnXG4gICAgJiYgd2luZG93LnBvc3RNZXNzYWdlICYmIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyXG4gICAgO1xuXG4gICAgaWYgKGNhblNldEltbWVkaWF0ZSkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGYpIHsgcmV0dXJuIHdpbmRvdy5zZXRJbW1lZGlhdGUoZikgfTtcbiAgICB9XG5cbiAgICBpZiAoY2FuUG9zdCkge1xuICAgICAgICB2YXIgcXVldWUgPSBbXTtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBldi5zb3VyY2U7XG4gICAgICAgICAgICBpZiAoKHNvdXJjZSA9PT0gd2luZG93IHx8IHNvdXJjZSA9PT0gbnVsbCkgJiYgZXYuZGF0YSA9PT0gJ3Byb2Nlc3MtdGljaycpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICBpZiAocXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZm4gPSBxdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBmbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG5leHRUaWNrKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZS5wdXNoKGZuKTtcbiAgICAgICAgICAgIHdpbmRvdy5wb3N0TWVzc2FnZSgncHJvY2Vzcy10aWNrJywgJyonKTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgc2V0VGltZW91dChmbiwgMCk7XG4gICAgfTtcbn0pKCk7XG5cbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufVxuXG4vLyBUT0RPKHNodHlsbWFuKVxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0bGV0QXJpdHlFcnJvcjogXCJPZGQgY291bnQgb2YgYXJndW1lbnRzIG9mIGJpbmRpbmdzIGxpc3QsIGV4cGVjdGVkIGV2ZW5cIixcblx0XG5cdGFyaXR5RXJyb3IgOiBmdW5jdGlvbihleHBlY3RlZCwgcmVhbHkpe1xuXHRcdHJldHVybiBcIkFyaXR5IGVycm9yOjogZXhwcmVjdGVkOiBcIiArIGV4cGVjdGVkICsgXCIgZ290OiBcIiArIHJlYWx5O1xuXHR9LFxuXHRyZWZlcmVuY2VFcnJvciA6IGZ1bmN0aW9uKG5hbWUpe1xuXHRcdHJldHVybiBcIlJlZmVyZW5lIEVycm9yOjogdmFyaWFibGUgXCIgKyBuYW1lICsgXCIgY2Fubm90IGJlIHJlc29sdmVkIGluIHRoaXMgY29udGVudFwiXG5cdH0sXG5cdHJlc2VydmVkRXJyb3IgOiBmdW5jdGlvbihuYW1lKXtcblx0XHRyZXR1cm4gXCJFcnJvcjo6IFwiICsgbmFtZSArIFwiIGlzIHJlc2VydmVkIHdvcmRcIlxuXHR9LFxuXHRzeW50YXhFcnJvck51bWJlciA6IGZ1bmN0aW9uKG5hbWUpe1xuXHRcdHJldHVybiBcIlN5bnRheCBFcnJvcjo6IHVuZXhwZWN0ZWQgbnVtYmVyIGF0IGlkZW50aWZpY2F0b3I6IFwiICsgbmFtZTtcblx0fSxcblx0dW5kZXhwZWN0ZWRJZGVudGlmaWNhdG9yIDogZnVuY3Rpb24obmFtZSl7XG5cdFx0cmV0dXJuIFwiU3ludGF4IEVycm9yOjogdW5leHBlY3RlZCBpZGVudGlmaWNhdG9yOiBcIiArIG5hbWU7XG5cdH1cbn0iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiBcdHV1aWQ6IGZ1bmN0aW9uKGxlbmd0aCwgY2lkKXtcblx0XHR2YXIgYyA9IGxlbmd0aCB8fCAxMDA7XG5cdFx0cmV0dXJuIFtjLGMsYyxjXS5tYXAoZnVuY3Rpb24oaSl7IFxuXHRcdFx0IHJldHVybiBpICogTWF0aC5yYW5kb20oKSA+PiAwO1xuXHRcdH0pLmpvaW4oY2lkIHx8IFwiX1wiKTtcbiBcdH0sXG4gXHRwcm9wIDogZnVuY3Rpb24ocCl7XG4gXHRcdHJldHVybiBmdW5jdGlvbihvKXtcbiBcdFx0XHRyZXR1cm4gb1twXTtcbiBcdFx0fVxuIFx0fSxcbiBcdGZuYW1lIDogZnVuY3Rpb24oKXtcbiBcdFx0cmV0dXJuIFwiZm5fXCIgKyAobmV3IERhdGUoKS5nZXRUaW1lKCkudG9TdHJpbmcoKS5zbGljZSgtMykpICsgdGhpcy51dWlkKClcbiBcdH0sXG5cdHRvQXJyYXk6IGZ1bmN0aW9uIChhKXsgXG5cdFx0cmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGEpOyBcblx0fSxcblx0Zm5vcCA6IGZ1bmN0aW9uKG9wKXtcblx0XHRyZXR1cm4gZXZhbChcIihmdW5jdGlvbihhLGIpeyByZXR1cm4gYVwiK29wK1wiYjt9KVwiKTtcblx0fSxcblx0aXNBcnJheSA6IGZ1bmN0aW9uKGUpe1xuXHRcdHJldHVybiBBcnJheS5pc0FycmF5KGUpO1xuXHR9LFxuXHRlcXVhbHMgOiBmdW5jdGlvbih4LCB5KXtcblx0XHRpZiAoIHggPT09IHkgKSByZXR1cm4gdHJ1ZTtcblx0XG5cdFx0aWYgKCAhICggeCBpbnN0YW5jZW9mIE9iamVjdCApIHx8ICEgKCB5IGluc3RhbmNlb2YgT2JqZWN0ICkgKSByZXR1cm4gZmFsc2U7XG5cdFxuXHRcdGlmICggeC5jb25zdHJ1Y3RvciAhPT0geS5jb25zdHJ1Y3RvciApIHJldHVybiBmYWxzZTtcblx0XG5cdFx0Zm9yICggdmFyIHAgaW4geCApIHtcblx0XHRcdGlmICggISB4Lmhhc093blByb3BlcnR5KCBwICkgKSBjb250aW51ZTtcblx0XHRcblx0XHRcdGlmICggISB5Lmhhc093blByb3BlcnR5KCBwICkgKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcblx0XHRcdGlmICggeFsgcCBdID09PSB5WyBwIF0gKSBjb250aW51ZTtcblx0XHRcblx0XHRcdGlmICggdHlwZW9mKCB4WyBwIF0gKSAhPT0gXCJvYmplY3RcIiApIHJldHVybiBmYWxzZTtcblx0XHRcdFxuXHRcdFx0aWYgKCAhIHRoaXMuZXF1YWxzKCB4WyBwIF0sICB5WyBwIF0gKSApIHJldHVybiBmYWxzZTtcblx0XHRcdFxuXHRcdH1cblxuXHRcdGZvciAoIHAgaW4geSApIHtcblx0XHRcdGlmICggeS5oYXNPd25Qcm9wZXJ0eSggcCApICYmICEgeC5oYXNPd25Qcm9wZXJ0eSggcCApICkgcmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9LFxuXHR0b2tlbjoge1xuXHRcdGlzU3RyaW5nOiBmdW5jdGlvbih0KXtcblx0XHRcdHJldHVybiAvXlwiLipcIiQvLnRlc3QodCk7XG5cdFx0fSxcblx0XHRpc051bWJlcjogZnVuY3Rpb24odCl7XG5cdFx0XHRyZXR1cm4gL15cXGQqJC8udGVzdCh0KTtcblx0XHR9LFxuXHRcdGlzRGVsaW06IGZ1bmN0aW9uKHQpe1xuXHRcdFx0cmV0dXJuIFwiW10oKXt9LFwiLmluZGV4T2YodCkgPj0gMDtcblx0XHR9XG5cdH1cbn0iLCIoZnVuY3Rpb24gKHByb2Nlc3Mpe1xudmFyIF8gICAgICAgPSByZXF1aXJlKFwiLi9ldGMvVXRpbHMuanNcIiksXG4gICAgRXJyb3JzICA9IHJlcXVpcmUoXCIuL2V0Yy9FcnJvcnMuanNcIiksXG4gICAgU2V0ICAgICA9IHJlcXVpcmUoXCIuL3R5cGVzL1NldC5qc1wiKTtcbiAgICBIYXNoICAgICA9IHJlcXVpcmUoXCIuL3R5cGVzL0hhc2guanNcIilcblxuXG4vKiBNYWluIGludGVycHJldGVyIGZ1bmN0aW9uIHRha2VzIGFycmF5IGFuZCBwcmV2aW91cyBmb3JtKi9cbnZhciBKaXNwID0gZnVuY3Rpb24oZm9ybSwgcHJldil7XG4gIGlmKEFycmF5LmlzQXJyYXkoZm9ybSkpe1xuXG4gICAgZm9yKHZhciBwb3NpdGlvbj0wLCBsZW5ndGg9Zm9ybS5sZW5ndGg7IHBvc2l0aW9uPGxlbmd0aDsgcG9zaXRpb24rKyl7XG4gICAgICB2YXIgdG9rZW4gPSBmb3JtW3Bvc2l0aW9uXTtcblxuICAgICAgLyogaWYgaWRlbnRpZmljYXRvciAqL1xuICAgICAgaWYodG9rZW4uaWQgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgIHZhciBpZCA9IHRva2VuLmlkO1xuICAgICAgICBcbiAgICAgICAgaWYocHJldiAmJiBwcmV2LmlkID09ICdkZWYnKXtcbiAgICAgICAgICAvKiBIZXJlIHdlIGNhbiBjaGVjayBSZWZlcmVuY2UgRXJyb3JzIGFuZCBTY29wZSBmb2xkaW5nKi9cbiAgICAgICAgfWVsc2V7XG5cbiAgICAgICAgICAvKiBEZWZpbmVkIHZhcmlhYmxlcyBkZXJlZmVyZW5jZXMgKi9cbiAgICAgICAgICBpZihKaXNwLnZhcnNbaWRdICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgdmFyIF92YXIgPSBKaXNwLnZhcnNbaWRdLnZhbHVlOyAgICAgICAgICAgIFxuXG4gICAgICAgICAgICBpZighX3Zhcil7XG4gICAgICAgICAgICAgIHZhciBqaWQgPSBKaXNwLnZhcnNbaWRdO1xuICAgICAgICAgICAgICBfdmFyID0gSmlzcC52YXJzW2ppZF0uaWQgPyBKaXNwLnZhcnNbamlkXS52YWx1ZSA6IEppc3AudmFyc1tKaXNwLnZhcnNbamlkXS5pZF0udmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKHR5cGVvZiBfdmFyID09ICdmdW5jdGlvbicgJiYgcG9zaXRpb24gPT0gMCl7XG4gICAgICAgICAgICAgIGZvcm0gPSBfdmFyLmFwcGx5KGZvcm0sIEppc3AoZm9ybS5zbGljZSgxKSkpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICBmb3JtW3Bvc2l0aW9uXSA9IEppc3AudmFyc1tpZF0udmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG5cbiAgICAgICAgICAvKiBSZXNlcnZlZCBuYW1lcyBkZXJlZmVyZW5jZXMgKi9cbiAgICAgICAgICBpZihKaXNwLm5hbWVzW2lkXSAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHZhciBrZXl3b3JkID0gSmlzcC5uYW1lc1tpZF07XG5cbiAgICAgICAgICAgIGlmKHR5cGVvZiBrZXl3b3JkID09ICdmdW5jdGlvbicgJiYgcG9zaXRpb24gPT0gMCl7XG4gICAgICAgICAgICAgIHZhciBhcmd2ID0gZm9ybS5zbGljZSgxKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgICBpZigha2V5d29yZC5xdW90ZSl7XG4gICAgICAgICAgICAgICAgYXJndiA9IEppc3AoYXJndiwgdG9rZW4pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICAgZm9ybSA9IGtleXdvcmQuYXBwbHkoZm9ybSwgYXJndik7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfWVsc2VcbiAgICAgICAgICAgIGlmKHR5cGVvZiBrZXl3b3JkID09ICdmdW5jdGlvbicgJiYgcG9zaXRpb24gIT09IDApe1xuICAgICAgICAgICAgICBmb3JtW3Bvc2l0aW9uXSA9IHRva2VuO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIGZvcm1bcG9zaXRpb25dID0gSmlzcC5uYW1lc1tpZF0udmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgIH1cbiAgICAgIH1lbHNle1xuICAgICAgICBcbiAgICAgICAgLyogUmVjdXJzaXZlIGludGVycHJldGF0aW9ucyAqL1xuICAgICAgICBpZihBcnJheS5pc0FycmF5KHRva2VuKSl7ICAgICAgICAgIFxuICAgICAgICAgIGZvcm1bcG9zaXRpb25dID0gSmlzcCh0b2tlbik7XG4gICAgICAgIH1cbiAgICAgIH1cdFxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmb3JtO1xufVxuXG4vKiBTdG9yYWdlcyAqL1xuSmlzcC5uYW1lcyA9IHt9OyAvKiBSZXNlcnZlZCBuYW1lcyAqL1xuSmlzcC52YXJzID0ge307IC8qIFVzZXIgdmFyaWFibGVzICovXG5cbi8qIEhlbHBpbmcgbWV0aG9kIHRvIGNyZWF0ZSBmdW5jdGlvbnMgd2l0aCBhcml0aHkgY2hlY2tpbmcgYW5kIGF1dG9tYXRpY2FseSBxdW90ZWQgKi9cbkppc3AuZGVmdW4gPSBmdW5jdGlvbihmbiwgYXJpdHksIHF1b3RlKXtcblx0dmFyIHJlcyA9IGZ1bmN0aW9uKCl7XG5cdFx0aWYoYXJpdHkgJiYgYXJndW1lbnRzLmxlbmd0aCA+IGFyaXR5KXtcblx0XHRcdHRocm93IEVycm9ycy5hcml0eUVycm9yKGFyaXR5LCBhcmd1bWVudHMubGVuZ3RoKTtcblx0XHR9XG5cdFx0aWYoZm4ubGVuZ3RoICYmIGFyZ3VtZW50cy5sZW5ndGggPiBmbi5sZW5ndGgpe1xuXHRcdFx0Y29uc29sZS53YXJuKFwiV2FybmluZyEgTWF5IGNhdXNlIG9mOlwiICsgRXJyb3JzLmFyaXR5RXJyb3IoYXJpdHksIGFyZ3VtZW50cy5sZW5ndGgpKVxuXHRcdH1cblx0XHRyZXR1cm4gZm4uYXBwbHkoSmlzcC5jdXJyZW50U2NvcGUsIGFyZ3VtZW50cyk7XG5cdH1cblx0aWYocXVvdGUpe1xuXHRcdHJlcy5xdW90ZSA9IHRydWU7XG5cdH1cblx0cmVzLmFyaXR5ID0gYXJpdHk7XG5cdHJldHVybiByZXM7XG59XG5cbkppc3AubmFtZXNbJ2RlZmluZWQ/J10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGUpe1xuICByZXR1cm4gdHlwZW9mIChKaXNwLm5hbWVzW2UuaWRdIHx8IEppc3AudmFyc1tlLmlkXSkgIT09IFwidW5kZWZpbmVkXCI7XG59LCAxLCB0cnVlKTtcblxuSmlzcC5uYW1lc1sndXNlJ10gPSBmdW5jdGlvbihsaWIpe1xuICB2YXIgZmlsZW5hbWUgPSBsaWIuaWQgKyBcIi5qaXNwXCI7XG5cbiAgcmVxdWlyZSgnZnMnKS5yZWFkRmlsZShmaWxlbmFtZSwge2VuY29kaW5nOiAndXRmLTgnfSwgZnVuY3Rpb24oZXJyLCBkYXRhKXtcbiAgICBpZihlcnIpe1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1lbHNle1xuICAgICAgSmlzcC5FdmFsKGRhdGEpO1xuICAgIH1cbiAgfSlcblxufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyogREVGSU5JVElPTlMgKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8qIERlZmluZSAqL1xuSmlzcC5uYW1lcy5kZWYgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKG5hbWUsIHZhbHVlKXtcbiAgdmFyIGlkID0gbmFtZS5pZCB8fCBuYW1lO1xuXG5cdC8qIEVycm9yIGNoZWNraW5nICovXG5cdGlmKEppc3AubmFtZXNbaWRdKXtcblx0XHR0aHJvdyBFcnJvcnMucmVzZXJ2ZWRFcnJvcihpZCk7XG5cdH1lbHNlXG5cdGlmKC9cXGQrLy50ZXN0KGlkKSl7XG5cdFx0dGhyb3cgRXJyb3JzLnN5bnRheEVycm9yTnVtYmVyKG5hbWUpO1xuXHR9ZWxzZVxuXHRpZighaWQubGVuZ3RoKXtcblx0XHR0aHJvdyBFcnJvcnMudW5kZXhwZWN0ZWRJZGVudGlmaWNhdG9yKG5hbWUpO1xuXHR9XG5cdFxuXHRpZih2YWx1ZS5pZCl7XG4gICAgSmlzcC52YXJzW25hbWUuaWRdID0gKHZhbHVlLmlkID8gdmFsdWUuaWQgOiB2YWx1ZSk7XG5cblx0fWVsc2V7XG5cdFx0SmlzcC52YXJzW2lkXSA9IHtcblx0XHRcdGlkOiBpZCxcblx0XHRcdHZhbHVlOiB2YWx1ZVxuXHRcdH1cblx0fVxuXG4gIHJldHVybiB2YWx1ZTtcblxufSwgMik7XG5cbi8qIExhbWJkYSBmdW5jdGlvbiBkZWZpbml0aW9ucyovXG5KaXNwLm5hbWVzLmxhbWJkYSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYXJndiwgYm9keSl7XG5cdHZhciBuYW1lcyA9IGFyZ3YubWFwKF8ucHJvcCgnaWQnKSksXHRcblx0ICAgIGZuYW1lID0gXy5mbmFtZSgpO1xuXHRcblx0ZnVuY3Rpb24gYm9keV9wYXJzZXIoYm9keSwgYXJncyl7XG5cdFx0cmV0dXJuIGJvZHkubWFwKGZ1bmN0aW9uKHRva2VuKXtcblx0XHRcdGlmKEFycmF5LmlzQXJyYXkodG9rZW4pKXtcblx0XHRcdFx0cmV0dXJuIGJvZHlfcGFyc2VyKHRva2VuLCBhcmdzKTtcblx0XHRcdH1lbHNlXG5cdFx0XHRpZih0b2tlbi5pZCAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgdmFyIHJlc3RwID0gbmFtZXMuaW5kZXhPZignJicpO1xuICAgICAgICBcbiAgICAgICAgbmFtZXMuZm9yRWFjaChmdW5jdGlvbihhcmdfbmFtZSwgYXJnX3Bvc2l0aW9uKXtcbiAgICAgICAgICBpZihhcmdfbmFtZSA9PSB0b2tlbi5pZCAmJiBhcmdfbmFtZSAhPT0gJyYnKXtcblx0XHRcdFx0XHRcdHRva2VuID0gYXJnc1thcmdfcG9zaXRpb25dO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XHRcdFx0XHRcblxuICAgICAgICBpZih0b2tlbi5pZCA9PSAnJicgJiYgcmVzdHAgPj0gMCl7XG4gICAgICAgICAgaWYoYXJncy5sZW5ndGggPj0gYXJndi5sZW5ndGgpe1xuICAgICAgICAgICAgdG9rZW4gPSBfLnRvQXJyYXkoYXJncykuc2xpY2UocmVzdHAsIChyZXN0cCA9PSBhcmd2Lmxlbmd0aC0xKSA/IHZvaWQgMCA6IC0xKTtcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHRocm93IFwiSWxsZWdhbCB1c2FnZSBvZiB0aGUgJiAoUkVTVCBvZiBhcmd1bWVudHMpXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0b2tlbjtcblx0XHR9KTtcblx0fVxuXG5cdEppc3AudmFyc1tmbmFtZV0gPSB7XG5cdFx0aWQ6IGZuYW1lLCBcblx0XHR2YWx1ZTogZnVuY3Rpb24oKXtcbiAgICAgIHZhciBwYXJzZWRfYm9keSA9IGJvZHlfcGFyc2VyKGJvZHksIGFyZ3VtZW50cyk7XG5cdFx0XHRyZXR1cm4gSmlzcChwYXJzZWRfYm9keSwge2lkOiBmbmFtZX0pO1xuXHRcdH1cblx0fTtcblx0XHRcblx0cmV0dXJuIHtpZDogZm5hbWV9O1xufSwgMiwgdHJ1ZSk7XG5cbi8qIExldCBiaW5kaW5ncyAqL1xuSmlzcC5uYW1lcy5sZXQgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGJpbmRpbmdzLCBib2R5KXtcbiAgaWYoYmluZGluZ3MubGVuZ3RoJTIpeyB0aHJvdyBFcnJvci5sZXRBcml0eUVycm9yOyAgfVxuICBcbiAgZnVuY3Rpb24gcGFyc2VCb2R5KHRva2VuLCBhcnIpeyAgICBcbiAgICBpZih0b2tlbi5pZCl7XG4gICAgICBhcnIuZm9yRWFjaChmdW5jdGlvbihhbGlhcyl7XG4gICAgICAgIGlmKGFsaWFzLmlkID09IHRva2VuLmlkKXtcbiAgICAgICAgICB0b2tlbiA9IGFsaWFzLnZhbHVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZihBcnJheS5pc0FycmF5KHRva2VuKSl7XG4gICAgICByZXR1cm4gdG9rZW4ubWFwKGZ1bmN0aW9uKHgpe1xuICAgICAgICByZXR1cm4gcGFyc2VCb2R5KHgsIGFycik7XG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIHZhciBhbGlhc2VzID0gW11cblxuICBmb3IodmFyIGk9MCxsPWJpbmRpbmdzLmxlbmd0aDtpPGw7aSs9Mil7XG4gICAgYWxpYXNlcy5wdXNoKHtcbiAgICAgIGlkOiBiaW5kaW5nc1tpXS5pZCxcbiAgICAgIHZhbHVlIDogSmlzcChwYXJzZUJvZHkoYmluZGluZ3NbaSsxXSwgYWxpYXNlcykpXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gSmlzcChib2R5Lm1hcChmdW5jdGlvbih0b2tlbil7XG4gICAgcmV0dXJuIHBhcnNlQm9keSh0b2tlbiwgYWxpYXNlcyk7XG4gIH0pKTtcbn0sIDIsIHRydWUpO1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyogQ29uc3RydWN0aW9ucyAqL1xuXG4vKiBDb25kaXRpb25zICovXG5KaXNwLm5hbWVzWydpZiddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihjLCB0LCBlKXtcbiAgcmV0dXJuIEppc3AoYykgPyBKaXNwKHQpIDogKGUgPyBKaXNwKGUpIDogbnVsbCk7XG59LDMsIHRydWUpO1xuXG5KaXNwLm5hbWVzLmNvbmQgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKCl7IFxuICB2YXIgYXJndiA9IF8udG9BcnJheShhcmd1bWVudHMpO1xuICB2YXIgX2RlZmF1bHQ7XG4gIHZhciBhcmNoZWNrO1xuXG4gIGlmKGFyZ3YubGVuZ3RoJTIpe1xuICAgIHZhciBjaGVjayA9IEppc3AoYXJndlswXSk7XG4gICAgYXJndiA9IGFyZ3Yuc2xpY2UoMSk7XG4gICAgYXJjaGVjayA9IHRydWU7XG4gIH1cblxuICBmb3IodmFyIGk9MCxsPWFyZ3YubGVuZ3RoO2k8bDtpKz0yKXtcblxuICAgIGlmKGFyZ3ZbaV0uaWQgJiYgYXJndltpXS5pZCA9PSAnJicpe1xuICAgICAgX2RlZmF1bHQgPSBbYXJndltpXSwgYXJndltpKzFdXTtcbiAgICB9ZWxzZXtcbiAgICAgIGlmKGFyY2hlY2spe1xuICAgICAgICBpZihfLmVxdWFscyhjaGVjaywgSmlzcChhcmd2W2ldKSkpe1xuICAgICAgICAgIHJldHVybiBKaXNwKGFyZ3ZbaSsxXSk7XG4gICAgICAgIH1cbiAgICAgIH1lbHNle1xuICAgICAgICBpZihKaXNwKGFyZ3ZbaV0pKXtcbiAgICAgICAgICByZXR1cm4gSmlzcChhcmd2W2krMV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYoX2RlZmF1bHQpe1xuICAgIHZhciByZXMgPSBfZGVmYXVsdFsxXTtcbiAgICByZXR1cm4gSmlzcChyZXMpO1xuICB9ZWxzZXtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxufSwgbnVsbCwgdHJ1ZSk7XG5cbi8qIFF1b3RhdGlvbiAqL1xuSmlzcC5uYW1lcy5xdW90ZSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSl7XG4gIHJldHVybiBhO1xufSwgbnVsbCwgdHJ1ZSk7XG5cbi8qIEFwcGx5aW5nICovXG5KaXNwLm5hbWVzLmFwcGx5ID0gSmlzcC5kZWZ1bihmdW5jdGlvbihmbiwgYXJyKXtcbiAgcmV0dXJuIEppc3AoW2ZuXS5jb25jYXQoYXJyKSk7XG59LCAyLCB0cnVlKTtcblxuSmlzcC5uYW1lc1snZG8nXSA9IGZ1bmN0aW9uKCl7XG4gIHZhciBhcmd2ID0gXy50b0FycmF5KGFyZ3VtZW50cyksIHJlcztcbiAgZm9yKHZhciBpID0gMCwgbCA9IGFyZ3YubGVuZ3RoOyBpPGw7IGkrKyl7XG4gICAgcmVzID0gSmlzcChhcmd2W2ldKTtcbiAgICBpZihpID09IGwtMSl7XG4gICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgfVxufVxuXG4vKiBFdmFsdWF0aW9uICovXG5KaXNwLm5hbWVzWydldmFsJ10gPSBmdW5jdGlvbihleHByZXNzaW9uKXtcbiAgcmV0dXJuIEppc3AoSmlzcChleHByZXNzaW9uKSk7XG59XG5cbkppc3AubmFtZXNbJ3Rocm93J10gPSBmdW5jdGlvbihtZXNzYWdlKXtcbiAgdGhyb3cgbWVzc2FnZTtcbn1cblxuSmlzcC5uYW1lc1snc2V0ISddID0gZnVuY3Rpb24oeCwgeSl7XG4gIEppc3AudmFyc1t4LmlkXSA9IHlcbn1cblxuSmlzcC5uYW1lc1snZGVmbWFjcm8nXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24obmFtZSwgYXJncywgYm9keSl7XG4gIHZhciBtYWNybyA9IFtcbiAgICB7aWQ6ICdkZWZ1bid9LFxuICAgIG5hbWUsXG4gICAgYXJncyxcbiAgICBbe2lkOiAncXVvdGUnLCB9LCBib2R5XVxuICBdXG4gIEppc3AobWFjcm8pO1xufSwgMiwgdHJ1ZSk7XG5cbkppc3AubmFtZXNbJ3R5cGU/J10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKG8pe1xuICB2YXIgdHlwZSA9IHR5cGVvZiBvO1xuICBpZihBcnJheS5pc0FycmF5KG8pKXtcbiAgICBpZihvLnR5cGUpe1xuICAgICAgdHlwZSA9IG8udHlwZTtcbiAgICB9ZWxzZXtcbiAgICAgIHR5cGUgPSAnbGlzdCc7XG4gICAgfVxuICB9ZWxzZXtcbiAgICBpZih0eXBlID09ICdvYmplY3QnKXtcbiAgICAgIHR5cGUgPT0gXCJoYXNoXCI7XG4gICAgfVxuICB9XG4gIHJldHVybiB0eXBlO1xufSwgMSk7XG5cbkppc3AubmFtZXMuc2NhbiA9IGZ1bmN0aW9uKG1lc3NhZ2UsIGlkLCBmbil7XG4gIHZhciByZWFkbGluZSA9IHJlcXVpcmUoJ3JlYWRsaW5lJyksXG4gICAgICBybCA9IHJlYWRsaW5lLmNyZWF0ZUludGVyZmFjZSh7XG4gICAgICAgIGlucHV0OiBwcm9jZXNzLnN0ZGluLFxuICAgICAgICBvdXRwdXQ6IHByb2Nlc3Muc3Rkb3V0LFxuICAgICAgICB0ZXJtaW5hbDogZmFsc2VcbiAgICAgIH0pO1xuXG4gIHJsLnF1ZXN0aW9uKFwiPiBcIiArIG1lc3NhZ2UsIGZ1bmN0aW9uKHJlcyl7XG4gICAgSmlzcC5FdmFsKFwiKGRlZiBcIiArIGlkLmlkICsgXCIgXFxcIlwiICsgcmVzLnRvU3RyaW5nKCkgKyBcIlxcXCIgKVwiKTtcbiAgICBybC5jbG9zZSgpO1xuICAgIEppc3AoW2ZuLCBpZF0pO1xuICB9KTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qIE1BQ1JPU0VTICovXG5KaXNwLm5hbWVzLmRlZnVuID0gSmlzcC5kZWZ1bihmdW5jdGlvbihuYW1lLCBhcmd2LCBib2R5KXtcbiAgdmFyIHJlcyA9IFtcbiAgICB7aWQ6ICdkZWYnfSwgXG4gICAge2lkOiBuYW1lLmlkfSwgXG4gICAgWyB7aWQ6J2xhbWJkYSd9IF0uY29uY2F0KFthcmd2LCBib2R5XSldO1xuICByZXR1cm4gSmlzcChyZXMpO1xufSwgMywgdHJ1ZSk7XG5cbkppc3AubmFtZXMubG9nID0gZnVuY3Rpb24oZSl7XG4gIGNvbnNvbGUubG9nKEppc3AuamlzcGluaXplKGUpKTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyogTElTVCBEQVRBIFRZUEUgKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuSmlzcC5uYW1lcy5jYXIgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEpeyByZXR1cm4gYVswXTsgfSwgMSk7XG5KaXNwLm5hbWVzLmNkciA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSl7IHJldHVybiBhLnNsaWNlKDEpOyB9LCAxKTtcbkppc3AubmFtZXMuY29ucyA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSwgYil7IHJldHVybiBbYV0uY29uY2F0KGIpOyB9LCAyKTtcbkppc3AubmFtZXMuam9pbiA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSwgYyl7IHJldHVybiBhLmpvaW4oYyk7IH0sIDIpO1xuSmlzcC5uYW1lcy5saXN0ID0gZnVuY3Rpb24oKXsgcmV0dXJuIF8udG9BcnJheShhcmd1bWVudHMpOyB9XG5KaXNwLm5hbWVzWydsZW5ndGgnXSA9IGZ1bmN0aW9uKGUpe1xuICByZXR1cm4gZS5sZW5ndGg7XG59XG5cbkppc3AubmFtZXMucmFuZ2UgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGZyb20sIHRvKXtcbiAgaWYoIXRvKXtcbiAgICB0byA9IGZyb207XG4gICAgZnJvbSA9IDA7XG4gIH1cbiAgXG4gIHZhciByZXMgPSBbXSwgZW5kID0gdG87XG5cbiAgd2hpbGUoZnJvbTw9ZW5kKXtcbiAgICByZXMucHVzaChmcm9tKyspO1xuICB9XG4gIFxuICByZXR1cm4gcmVzO1xufSwgMik7XG5cbkppc3AubmFtZXMubWFwID0gSmlzcC5kZWZ1bihmdW5jdGlvbihmbiwgYXJyKXtcbiAgcmV0dXJuIEppc3AoYXJyKS5tYXAoZnVuY3Rpb24oaXRlbSl7XG4gICAgcmV0dXJuIEppc3AoW2ZuLCBpdGVtXSk7XG4gIH0pO1xufSwgMiwgdHJ1ZSk7XG5cbkppc3AubmFtZXMucmVkdWNlID0gSmlzcC5kZWZ1bihmdW5jdGlvbihmbiwgYXJyKXtcbiAgcmV0dXJuIEppc3AoYXJyKS5yZWR1Y2UoZnVuY3Rpb24oYSwgYil7XG4gICAgcmV0dXJuIEppc3AoW2ZuLCBhICxiXSk7XG4gIH0pO1xufSwgMiwgdHJ1ZSk7XG5cbkppc3AubmFtZXMuZmlsdGVyID0gSmlzcC5kZWZ1bihmdW5jdGlvbihmbiwgYXJyKXtcbiAgcmV0dXJuIEppc3AoYXJyKS5maWx0ZXIoZnVuY3Rpb24oaXRlbSl7XG4gICAgcmV0dXJuIEppc3AoW2ZuLCBpdGVtXSk7XG4gIH0pO1xufSwgMiwgdHJ1ZSk7XG5cbkppc3AubmFtZXMuc3RyID0gZnVuY3Rpb24oKXtcbiAgcmV0dXJuICBfLnRvQXJyYXkoYXJndW1lbnRzKS5tYXAoZnVuY3Rpb24oZSl7XG4gICAgcmV0dXJuIGUudG9TdHJpbmcgPyBlLnRvU3RyaW5nKCkgOiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZSk7XG4gIH0pLmpvaW4oXCJcIik7XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qIFNFVCBEQVRBIFRZUEUgKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuSmlzcC5uYW1lcy5zZXQgPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gbmV3IFNldChfLnRvQXJyYXkoYXJndW1lbnRzKSk7XG59XG5cbkppc3AubmFtZXMuYWRkID0gZnVuY3Rpb24oKXtcbiAgdmFyIGFyZ3YgPSBfLnRvQXJyYXkoYXJndW1lbnRzKSxcbiAgICAgIHNldCAgPSBuZXcgU2V0KGFyZ3ZbMF0uaXRlbXMpO1xuXG4gIGFyZ3Yuc2xpY2UoMSkuZm9yRWFjaChmdW5jdGlvbihpdGVtKXsgc2V0LmFkZChpdGVtKTsgIH0pO1xuXG4gIHJldHVybiBzZXQ7XG59XG5cbkppc3AubmFtZXMucmVtb3ZlID0gZnVuY3Rpb24oKXtcbiAgdmFyIGFyZ3YgPSBfLnRvQXJyYXkoYXJndW1lbnRzKSxcbiAgICAgIHNldCA9IG5ldyBTZXQoYXJndlswXS5pdGVtcyk7XG5cbiAgYXJndi5zbGljZSgxKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0peyBzZXQucmVtb3ZlKGl0ZW0pOyB9KVxuICByZXR1cm4gc2V0O1xufVxuXG5KaXNwLm5hbWVzLnVuaW9uID0gZnVuY3Rpb24oYSwgYil7XG5cdHJldHVybiAobmV3IFNldChhLml0ZW1zKSkudW5pb24oYik7XG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qIEhBU0ggREFUQSBUWVBFICovXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5KaXNwLm5hbWVzLmhhc2ggPSBmdW5jdGlvbigpe1xuXHRyZXR1cm4gbmV3IEhhc2goXy50b0FycmF5KGFyZ3VtZW50cykpLml0ZW1zO1xufVxuXG5KaXNwLm5hbWVzLmFzc29jID0gZnVuY3Rpb24oKXtcbiAgdmFyIGFyZ3YgPSBfLnRvQXJyYXkoYXJndW1lbnRzKTtcbiAgcmV0dXJuIChuZXcgSGFzaChhcmd2WzBdKSkuYXNzb2MoYXJndi5zbGljZSgxKSk7XG59XG5cbkppc3AubmFtZXMuZGlzc29jID0gZnVuY3Rpb24oKXtcbiAgdmFyIGFyZ3YgPSBfLnRvQXJyYXkoYXJndW1lbnRzKTtcbiAgcmV0dXJuIChuZXcgSGFzaChhcmd2WzBdKSkuZGlzc29jKGFyZ3Yuc2xpY2UoMSkpO1xufVxuXG5KaXNwLm5hbWVzLmdldCA9IGZ1bmN0aW9uKGEsIGIpe1xuICByZXR1cm4gYVtiLmlkID8gYi5pZC5zbGljZSgxKSA6IGJdO1xufVxuXG5KaXNwLm5hbWVzW1wiLlwiXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oaGFzaCwgbmFtZSl7XG4gIGhhc2ggPSBoYXNoLmlkID8gSmlzcC52YXJzW2hhc2guaWRdLnZhbHVlIDogSmlzcChoYXNoKTtcbiAgcmV0dXJuIG5hbWUuaWQgPyBoYXNoW25hbWUuaWRdIHx8IGhhc2hbbmFtZV0gOiBoYXNoW25hbWVdO1xufSwgMiwgdHJ1ZSk7XG5cbi8qIE1hdGggb3BlcmF0aW9ucyAqL1xuSmlzcC5uYW1lc1snKyddID0gZnVuY3Rpb24oZSl7IHJldHVybiBfLnRvQXJyYXkoYXJndW1lbnRzKS5yZWR1Y2UoXy5mbm9wKCcrJykpOyB9XG5KaXNwLm5hbWVzWyctJ10gPSBmdW5jdGlvbihlKXsgcmV0dXJuIF8udG9BcnJheShhcmd1bWVudHMpLnJlZHVjZShfLmZub3AoJy0nKSk7IH1cbkppc3AubmFtZXNbJyonXSA9IGZ1bmN0aW9uKGUpeyByZXR1cm4gXy50b0FycmF5KGFyZ3VtZW50cykucmVkdWNlKF8uZm5vcCgnKicpKTsgfVxuSmlzcC5uYW1lc1snLyddID0gZnVuY3Rpb24oZSl7IHJldHVybiBfLnRvQXJyYXkoYXJndW1lbnRzKS5yZWR1Y2UoXy5mbm9wKCcvJykpOyB9XG5KaXNwLm5hbWVzWyc+J10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsYil7IHJldHVybiBhID4gYjsgfSwgMik7XG5KaXNwLm5hbWVzWyc+J10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsYil7IHJldHVybiBhID4gYjsgfSwgMik7XG5KaXNwLm5hbWVzWyc+PSddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLGIpe3JldHVybiBhID49IGI7fSwgMik7XG5KaXNwLm5hbWVzWyc8PSddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLGIpe3JldHVybiBhIDw9IGI7fSwgMik7XG5KaXNwLm5hbWVzWyc8J10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsYil7XHRyZXR1cm4gYSA8IGI7IH0sIDIpO1xuSmlzcC5uYW1lc1snPSddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLGIpe1x0cmV0dXJuIGEgPT0gYjt9LCAyKTtcbkppc3AubmFtZXNbJ2VxPyddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLGIpe3JldHVybiBfLmVxdWFscyhhLCBiKTt9LCAyKTtcbkppc3AubmFtZXNbJ21vZCddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLGIpe1x0cmV0dXJuIGEgJSBiOyB9LCAyKTtcbkppc3AubmFtZXNbJ2FuZCddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLGIpe3JldHVybiBhICYmIGI7fSwgMik7XG5KaXNwLm5hbWVzWydvciddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLGIpeyByZXR1cm4gYSB8fCBiO30sIDIpO1xuSmlzcC5uYW1lc1snbm90J10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEpeyAgcmV0dXJuICFhO30sIDEpO1xuSmlzcC5uYW1lc1snbGlzdD8nXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSl7IHJldHVybiBBcnJheS5pc0FycmF5KGEpO30sIDEpO1xuXG5KaXNwLmppc3Bpbml6ZSA9IGZ1bmN0aW9uIGxpc3Bpbml6ZShqcyl7XG4gIGZ1bmN0aW9uIHJldG9rZShqKXtcbiAgICB2YXIgc3RyID0gSlNPTi5zdHJpbmdpZnkoaik7XG4gICAgcmV0dXJuIHJlcyA9IHN0ci5yZXBsYWNlKC9cXFsvZywgJyggJykucmVwbGFjZSgvXFxdL2csICcgKScpLnJlcGxhY2UoLywvZywgJyAnKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlSnMoail7XG4gICAgaWYoQXJyYXkuaXNBcnJheShqKSl7XG4gICAgICByZXR1cm4gcmV0b2tlKGoubWFwKHBhcnNlSnMpKTtcbiAgICB9ZWxzZXtcbiAgICAgIGlmKHR5cGVvZiBqID09PSAnb2JqZWN0JyAmJiAhail7XG4gICAgICAgIHJldHVybiAnbmlsJztcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYoaiA9PT0gdW5kZWZpbmVkKXtcbiAgICAgICAgcmV0dXJuICduaWwnO1xuICAgICAgfVxuICAgICAgXG4gICAgICBpZihqLmlkKXtcbiAgICAgICAgdmFyIHR5cGU7XG4gICAgICAgIFxuICAgICAgICB0eXBlID0gdHlwZW9mIChKaXNwLm5hbWVzW2ouaWRdIHx8IChKaXNwLnZhcnNbai5pZF0gPyBKaXNwLnZhcnNbai5pZF0udmFsdWUgfHwgSmlzcC52YXJzW2ouaWRdIDogdW5kZWZpbmVkKSkgfHwgXCJJRFwiO1xuICAgICAgICB0eXBlID0gdHlwZS5zbGljZSgwLDMpLnRvVXBwZXJDYXNlKCk7XG5cbiAgICAgICAgaWYodHlwZSA9PSBcIlVORFwiKXtcbiAgICAgICAgICByZXR1cm4gXCI8XCIgKyBqLmlkICsgXCI+XCI7XG4gICAgICAgIH1lbHNle1xuXG4gICAgICAgICAgaWYodHlwZSA9PT0gXCJGVU5cIil7XG4gICAgICAgICAgICBmb3IodmFyIGFsaWFzIGluIEppc3AudmFycyl7XG4gICAgICAgICAgICAgIGlmKGouaWQgPT0gSmlzcC52YXJzW2FsaWFzXSl7XG4gICAgICAgICAgICAgICAgai5pZCA9IGFsaWFzXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gXCIjXCIgKyB0eXBlICsgXCI6IDxcIiAgKyBqLmlkICsgXCI+XCI7ICBcbiAgICAgICAgfSAgICAgICAgXG4gICAgICB9ZWxzZVxuICAgICAgaWYoai5pdGVtcyl7XG4gICAgICAgIHJldHVybiBcIiNTRVQ6IDwgXCIgKyBwYXJzZUpzKGouaXRlbXMpICsgXCIgPlwiO1xuICAgICAgfWVsc2V7XG4gICAgICAgIGlmKHR5cGVvZiBqID09ICdvYmplY3QnKXtcbiAgICAgICAgICByZXR1cm4gXCIjSEFTSDogPCBcIiArIEpTT04uc3RyaW5naWZ5KGopICsgXCIgPlwiO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICBpZih0eXBlb2YgaiA9PT0gXCJib29sZWFuXCIpe1xuICAgICAgICAgICAgaWYoail7XG4gICAgICAgICAgICAgIHJldHVybiBcIiN0XCI7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgcmV0dXJuIFwibmlsXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICByZXR1cm4gajtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gXCI+XCIgKyBwYXJzZUpzKGpzKTtcbn1cblxuLyogVG9rZW5pemVyIGZ1bmN0aW9uICovXG5mdW5jdGlvbiB0b2tlbml6ZShleHByKXtcdFxuXHRmdW5jdGlvbiBzdHJpbmdTd2lwZU9uKHN0cmluZyl7XG5cdFx0cmV0dXJuIHN0cmluZ1xuXHRcdFx0LnJlcGxhY2UoLyAvZywgXCJfX1BST0JfX1wiKVxuXHRcdFx0LnJlcGxhY2UoL1xcbi9nLCBcIl9fTkxJTl9fXCIpXG5cdFx0XHQucmVwbGFjZSgvXFx0L2csIFwiX19OVEFCX19cIilcblx0XHR9XG5cblx0ZnVuY3Rpb24gc3RyaW5nU3dpcGVPZmYoZSl7XG5cdFx0cmV0dXJuIGUucmVwbGFjZSgvX19QUk9CX18vZywgXCIgXCIpXG5cdFx0XHRcdC5yZXBsYWNlKC9fX05MSU5fXy9nLCBcIlxcblwiKVxuXHRcdFx0XHQucmVwbGFjZSgvX19OVEFCX18vZywgXCJcXHRcIik7XG5cdH1cblxuXHR2YXIgc2VxdWVuY2VzID0gZXhwclxuICAgIC5yZXBsYWNlKC8nXFwoLio/XFwpL2csIGZ1bmN0aW9uKGUpeyBcbiAgICAgIHJldHVybiBcIihxdW90ZSBcIiArIGUuc2xpY2UoMSkgKyBcIiApXCI7IH0pXG4gICAgLnJlcGxhY2UoL1xcflxcKC4qP1xcKS9nLCBmdW5jdGlvbihlKXsgXG4gICAgICByZXR1cm4gXCIoZXZhbCBcIiArIGUuc2xpY2UoMSkgKyBcIiApXCI7IH0pXG4gICAgLnJlcGxhY2UoL1xcKC9nLCAnIFsgJylcbiAgICAucmVwbGFjZSgvXFwpL2csICcgXSAnKVxuXHQgIC5yZXBsYWNlKC9cXDsuKyhcXG58JCkvZywgJycpXG4gICAgLnJlcGxhY2UoL1xcXCIuKj9cXFwiL2csIHN0cmluZ1N3aXBlT24pXG4gICAgLnJlcGxhY2UoL1xcey4qP1xcfS9nLCBzdHJpbmdTd2lwZU9uKTtcblxuXHRyZXR1cm4gc2VxdWVuY2VzLnRyaW0oKS5zcGxpdCgvXFxzKy8pLm1hcChzdHJpbmdTd2lwZU9mZik7XG59XG5cbi8qIFJldHVybiBKUyBzdHJ1Y3R1cmUgc3RyaW5nICovXG5mdW5jdGlvbiBzdHJ1Y3R1cml6ZShzdHJ1Y3Qpe1xuXHRzdHJ1Y3QgPSBzdHJ1Y3QubWFwKGZ1bmN0aW9uKHRva2VuLCBwKXtcblx0XHR2YXIgaXNJZCA9IHRva2VuICE9IFwiW1wiICYmIHRva2VuICE9IFwiXVwiICYmICAhL1xcZCsvLnRlc3QodG9rZW4pICYmIHRva2VuWzBdICE9ICdcIicgJiYgdG9rZW5bdG9rZW4ubGVuZ3RoLTFdICE9ICdcIicgJiYgdG9rZW4gIT09XCJ0XCIgJiYgdG9rZW4gIT09XCJuaWxcIjtcblx0XHRcblx0XHRpZiggaXNJZCApe1xuXHRcdFx0dG9rZW4gPSBcIntpZDogJ1wiICsgdG9rZW4gKyBcIid9XCJcblx0XHR9XG5cdFx0XG5cdFx0aWYodG9rZW4gPT0gXCJ0XCIpe1xuXHRcdFx0dG9rZW4gPSBcInRydWVcIjtcblx0XHR9XG5cblx0XHRpZih0b2tlbiA9PSBcIm5pbFwiKXtcblx0XHRcdHRva2VuID0gXCJmYWxzZVwiO1xuXHRcdH1cblx0XHRcblx0XHRpZih0b2tlbiA9PSBcIltcIiB8fCBzdHJ1Y3RbcCsxXSA9PSBcIl1cIiB8fCBwPT0oc3RydWN0Lmxlbmd0aC0xKSApe1xuXHRcdFx0aWYodG9rZW5bdG9rZW4ubGVuZ3RoLTFdID09ICdcIicgJiYgc3RydWN0W3ArMV0gIT09IFwiXVwiKXtcblx0XHRcdFx0cmV0dXJuIHRva2VuICsgXCIsXCI7IFxuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHJldHVybiB0b2tlbjtcblx0XHRcdH1cblx0XHR9ZWxzZXtcblx0XHRcdHJldHVybiB0b2tlbiArIFwiLFwiXG5cdFx0fVxuXG5cblx0fSkuam9pbignJyk7XG5cdFxuXHRyZXR1cm4gXCJbXCIgKyBzdHJ1Y3QgK1wiXVwiO1xufVxuXG5cblxuSmlzcC5FdmFsID0gZnVuY3Rpb24oc3RyKXtcblx0dmFyIHN0cnVjdHVyZSA9IHRva2VuaXplKHN0ciksXG5cdFx0anMgPSBzdHJ1Y3R1cml6ZShzdHJ1Y3R1cmUpLFxuXHRcdHJlcztcblx0XG5cdHRyeXtcblx0XHRyZXMgPSBKaXNwKGV2YWwoanMpKTtcblx0XHRyZXR1cm4gcmVzW3Jlcy5sZW5ndGgtMV07XG5cdH1jYXRjaChlcnJvcil7XG5cdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdFx0cmV0dXJuO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHN0YXJ0UmVwbCgpe1xuICB2YXIgcmVhZGxpbmUgPSByZXF1aXJlKCdyZWFkbGluZScpLFxuICAgICAgcmwgPSByZWFkbGluZS5jcmVhdGVJbnRlcmZhY2Uoe1xuICAgICAgICBpbnB1dDogcHJvY2Vzcy5zdGRpbixcbiAgICAgICAgb3V0cHV0OiBwcm9jZXNzLnN0ZG91dCxcbiAgICAgICAgdGVybWluYWw6IGZhbHNlXG4gICAgICB9KTtcblxuICBybC5vbignbGluZScsIGZ1bmN0aW9uKGxpbmUpe1xuICAgIGNvbnNvbGUubG9nKEppc3AuamlzcGluaXplKEppc3AuRXZhbChsaW5lKSkpO1xuICB9KTtcblxufVxuXG5cbmlmKHByb2Nlc3MuYXJndi5sZW5ndGggPT0gMyl7XG4gIHZhciBmaWxlbmFtZSA9IHByb2Nlc3MuYXJndi5wb3AoKTtcbiAgcmVxdWlyZSgnZnMnKS5yZWFkRmlsZShmaWxlbmFtZSwge2VuY29kaW5nOiAndXRmLTgnfSwgZnVuY3Rpb24oZXJyLCBkYXRhKXtcbiAgICBpZihlcnIpe1xuICAgICAgaWYoZmlsZW5hbWUgPT0gXCItclwiKXtcbiAgICAgICAgc3RhcnRSZXBsKCk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1lbHNle1xuICAgICAgSmlzcC5FdmFsKGRhdGEpO1xuICAgIH1cbiAgfSlcbn1lbHNle1xuICBpZihwcm9jZXNzLmFyZ3YubGVuZ3RoID09IDIpe1xuICAgIHN0YXJ0UmVwbCgpO1xuICB9ZWxzZXtcbiAgICB2YXIgZmlsZW5hbWUgPSBwcm9jZXNzLmFyZ3YucG9wKCk7XG4gICAgcmVxdWlyZSgnZnMnKS5yZWFkRmlsZShmaWxlbmFtZSwge2VuY29kaW5nOiAndXRmLTgnfSwgZnVuY3Rpb24oZXJyLCBkYXRhKXtcbiAgICAgIGlmKGVycil7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1lbHNle1xuICAgICAgICBKaXNwLkV2YWwoZGF0YSk7XG4gICAgICB9XG5cbiAgICAgIGlmKHByb2Nlc3MuYXJndi5pbmRleE9mKFwiLXJcIik+PTApe1xuICAgICAgICBzdGFydFJlcGwoKTtcbiAgICAgIH0gICAgXG4gICAgfSk7XG5cbiAgfVxufVxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCIxWWlaNVNcIikpIiwidmFyIF8gPSByZXF1aXJlKFwiLi4vZXRjL1V0aWxzLmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpe1xuXHRmdW5jdGlvbiBtb2QobSwgc2V0LCBwcm9wLCB2YWwpe1xuXHRcdHZhciBuYW1lID0gcHJvcC5pZCB8fCBwcm9wO1xuXHRcdGlmKG5hbWVbMF09PVwiOlwiKXtcblx0XHRcdG5hbWUgPSBuYW1lLnNsaWNlKDEpO1xuXHRcdH1cblx0XHRcblx0XHRpZihtID09ICdhZGQnKXtcblx0XHRcdHNldC5pdGVtc1tuYW1lXSA9IHZhbDtcblx0XHR9ZWxzZXtcblx0XHRcdHNldC5pdGVtc1tuYW1lXSA9IG51bGw7XG5cdFx0XHRkZWxldGUgc2V0Lml0ZW1zW25hbWVdO1xuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIEhhc2goYXJndil7XG5cdFx0dGhpcy5pdGVtcyA9IHt9O1xuXG5cdFx0aWYoQXJyYXkuaXNBcnJheShhcmd2KSl7XG5cdFx0XHRpZighYXJndi5sZW5ndGglMil7XG5cdFx0XHRcdHRocm93IFwiQXJpdHkgZXJyb3JcIjtcblx0XHRcdH1cblx0XHRcblx0XHRcdGZvcih2YXIgaT0wLGw9YXJndi5sZW5ndGg7aTxsO2krPTIpe1xuXHRcdFx0XHRtb2QoJ2FkZCcsIHRoaXMsIGFyZ3ZbaV0sIGFyZ3ZbaSsxXSk7XG5cdFx0XHR9XG5cdFx0fWVsc2V7XG5cdFx0XHRmb3IodmFyIGkgaW4gYXJndil7XG5cdFx0XHRcdG1vZCgnYWRkJywgdGhpcywgaSwgYXJndltpXSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0SGFzaC5wcm90b3R5cGUuYXNzb2MgPSBmdW5jdGlvbihhcmd2KSB7XG5cdFx0Zm9yKHZhciBpPTAsbD1hcmd2Lmxlbmd0aDtpPGw7aSs9Mil7XG5cdFx0XHRtb2QoJ2FkZCcsIHRoaXMsIGFyZ3ZbaV0sIGFyZ3ZbaSsxXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLml0ZW1zO1xuXHR9O1xuXG5cdEhhc2gucHJvdG90eXBlLmRpc3NvYyA9IGZ1bmN0aW9uKGFyZ3YpIHtcblx0XHRmb3IodmFyIGk9MCxsPWFyZ3YubGVuZ3RoO2k8bDtpKyspe1xuXHRcdFx0bW9kKCdyZW0nLCB0aGlzLCBhcmd2W2ldKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXM7XG5cdH07XG5cblx0SGFzaC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24ocHJvcCkge1xuXHRcdHZhciBuYW1lID0gcHJvcC5pZCB8fCBwcm9wO1xuXHRcdGlmKG5hbWVbMF09PVwiOlwiKXtcblx0XHRcdG5hbWUgPSBuYW1lLnNsaWNlKDEpO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5pdGVtc1tuYW1lXTtcblx0fTtcblxuXHRyZXR1cm4gSGFzaDtcbn0pKCk7IiwidmFyIF8gPSByZXF1aXJlKFwiLi4vZXRjL1V0aWxzLmpzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpe1xuXHRmdW5jdGlvbiBwdXNoKHNldCwgaXRlbSl7XG5cdFx0aWYoc2V0Lml0ZW1zLmxlbmd0aCl7XG5cdFx0XHRpZihzZXQuaXRlbXMuZXZlcnkoZnVuY3Rpb24oc2l0ZW0pe1xuXHRcdFx0XHRpZighXy5lcXVhbHMoc2l0ZW0sIGl0ZW0pKXtcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0fVxuXHRcdFx0fSkpe1xuXHRcdFx0XHRzZXQuaXRlbXMucHVzaChpdGVtKTtcblx0XHRcdH1cblx0XHR9ZWxzZXtcblx0XHRcdHNldC5pdGVtcy5wdXNoKGl0ZW0pO1xuXHRcdH1cblx0XHRyZXR1cm4gc2V0Lml0ZW1zO1xuXHR9XG5cblx0ZnVuY3Rpb24gU2V0KGl0ZW1zKXtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dGhpcy5pdGVtcyA9IFtdO1xuXG5cdFx0aXRlbXMgJiYgaXRlbXMuZm9yRWFjaChmdW5jdGlvbihpKXtcblx0XHRcdHNlbGYuaXRlbXMucHVzaChpKTtcblx0XHR9KTtcblxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0aGlzLml0ZW1zLCBcInR5cGVcIiwge1xuXHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcblx0XHRcdGVudW1lcmFibGUgOiBmYWxzZSxcblx0XHRcdHZhbHVlOiBcInNldFwiXG5cdFx0fSk7XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXM7XG5cdH1cblxuXHRTZXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHgpIHtcblx0XHRwdXNoKHRoaXMsIHgpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdFNldC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oeCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR0aGlzLml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSwgaSl7XG5cdFx0XHRpZihfLmVxdWFscyhpdGVtLCB4KSl7XG5cdFx0XHRcdHNlbGYuaXRlbXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdFNldC5wcm90b3R5cGUudW5pb24gPSBmdW5jdGlvbihzZXQpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0c2V0Lml0ZW1zLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7XG5cdFx0XHRwdXNoKHNlbGYsIGl0ZW0pO1xuXHRcdH0pO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9O1xuXG5cdHJldHVybiBTZXQ7XG59KSgpOyJdfQ==
