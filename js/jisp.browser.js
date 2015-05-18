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
Jisp.names['<'] = Jisp.defun(function(a,b){ return a < b; }, 2);
Jisp.names['='] = Jisp.defun(function(a,b){ return a == b;}, 2);
Jisp.names['eq?'] = Jisp.defun(function(a,b){return _.equals(a, b);}, 2);
Jisp.names['mod'] = Jisp.defun(function(a,b){ return a % b; }, 2);
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

window.Jisp = Jisp; 


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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9ob21lL2RhdC9Eb2N1bWVudHMvSklTUC9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvaG9tZS9kYXQvRG9jdW1lbnRzL0pJU1Avbm9kZV9tb2R1bGVzL2d1bHAtYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwiL2hvbWUvZGF0L0RvY3VtZW50cy9KSVNQL25vZGVfbW9kdWxlcy9ndWxwLWJyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIi9ob21lL2RhdC9Eb2N1bWVudHMvSklTUC9zcmMvZXRjL0Vycm9ycy5qcyIsIi9ob21lL2RhdC9Eb2N1bWVudHMvSklTUC9zcmMvZXRjL1V0aWxzLmpzIiwiL2hvbWUvZGF0L0RvY3VtZW50cy9KSVNQL3NyYy9mYWtlXzhkMDNhNDljLmpzIiwiL2hvbWUvZGF0L0RvY3VtZW50cy9KSVNQL3NyYy90eXBlcy9IYXNoLmpzIiwiL2hvbWUvZGF0L0RvY3VtZW50cy9KSVNQL3NyYy90eXBlcy9TZXQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2b0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIixudWxsLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG5wcm9jZXNzLm5leHRUaWNrID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgY2FuU2V0SW1tZWRpYXRlID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cuc2V0SW1tZWRpYXRlO1xuICAgIHZhciBjYW5Qb3N0ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB3aW5kb3cucG9zdE1lc3NhZ2UgJiYgd2luZG93LmFkZEV2ZW50TGlzdGVuZXJcbiAgICA7XG5cbiAgICBpZiAoY2FuU2V0SW1tZWRpYXRlKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZikgeyByZXR1cm4gd2luZG93LnNldEltbWVkaWF0ZShmKSB9O1xuICAgIH1cblxuICAgIGlmIChjYW5Qb3N0KSB7XG4gICAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGV2LnNvdXJjZTtcbiAgICAgICAgICAgIGlmICgoc291cmNlID09PSB3aW5kb3cgfHwgc291cmNlID09PSBudWxsKSAmJiBldi5kYXRhID09PSAncHJvY2Vzcy10aWNrJykge1xuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIGlmIChxdWV1ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmbiA9IHF1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgIGZuKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbmV4dFRpY2soZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlLnB1c2goZm4pO1xuICAgICAgICAgICAgd2luZG93LnBvc3RNZXNzYWdlKCdwcm9jZXNzLXRpY2snLCAnKicpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBmdW5jdGlvbiBuZXh0VGljayhmbikge1xuICAgICAgICBzZXRUaW1lb3V0KGZuLCAwKTtcbiAgICB9O1xufSkoKTtcblxucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59XG5cbi8vIFRPRE8oc2h0eWxtYW4pXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRsZXRBcml0eUVycm9yOiBcIk9kZCBjb3VudCBvZiBhcmd1bWVudHMgb2YgYmluZGluZ3MgbGlzdCwgZXhwZWN0ZWQgZXZlblwiLFxuXHRcblx0YXJpdHlFcnJvciA6IGZ1bmN0aW9uKGV4cGVjdGVkLCByZWFseSl7XG5cdFx0cmV0dXJuIFwiQXJpdHkgZXJyb3I6OiBleHByZWN0ZWQ6IFwiICsgZXhwZWN0ZWQgKyBcIiBnb3Q6IFwiICsgcmVhbHk7XG5cdH0sXG5cdHJlZmVyZW5jZUVycm9yIDogZnVuY3Rpb24obmFtZSl7XG5cdFx0cmV0dXJuIFwiUmVmZXJlbmUgRXJyb3I6OiB2YXJpYWJsZSBcIiArIG5hbWUgKyBcIiBjYW5ub3QgYmUgcmVzb2x2ZWQgaW4gdGhpcyBjb250ZW50XCJcblx0fSxcblx0cmVzZXJ2ZWRFcnJvciA6IGZ1bmN0aW9uKG5hbWUpe1xuXHRcdHJldHVybiBcIkVycm9yOjogXCIgKyBuYW1lICsgXCIgaXMgcmVzZXJ2ZWQgd29yZFwiXG5cdH0sXG5cdHN5bnRheEVycm9yTnVtYmVyIDogZnVuY3Rpb24obmFtZSl7XG5cdFx0cmV0dXJuIFwiU3ludGF4IEVycm9yOjogdW5leHBlY3RlZCBudW1iZXIgYXQgaWRlbnRpZmljYXRvcjogXCIgKyBuYW1lO1xuXHR9LFxuXHR1bmRleHBlY3RlZElkZW50aWZpY2F0b3IgOiBmdW5jdGlvbihuYW1lKXtcblx0XHRyZXR1cm4gXCJTeW50YXggRXJyb3I6OiB1bmV4cGVjdGVkIGlkZW50aWZpY2F0b3I6IFwiICsgbmFtZTtcblx0fVxufSIsIm1vZHVsZS5leHBvcnRzID0ge1xuIFx0dXVpZDogZnVuY3Rpb24obGVuZ3RoLCBjaWQpe1xuXHRcdHZhciBjID0gbGVuZ3RoIHx8IDEwMDtcblx0XHRyZXR1cm4gW2MsYyxjLGNdLm1hcChmdW5jdGlvbihpKXsgXG5cdFx0XHQgcmV0dXJuIGkgKiBNYXRoLnJhbmRvbSgpID4+IDA7XG5cdFx0fSkuam9pbihjaWQgfHwgXCJfXCIpO1xuIFx0fSxcbiBcdHByb3AgOiBmdW5jdGlvbihwKXtcbiBcdFx0cmV0dXJuIGZ1bmN0aW9uKG8pe1xuIFx0XHRcdHJldHVybiBvW3BdO1xuIFx0XHR9XG4gXHR9LFxuIFx0Zm5hbWUgOiBmdW5jdGlvbigpe1xuIFx0XHRyZXR1cm4gXCJmbl9cIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKS50b1N0cmluZygpLnNsaWNlKC0zKSkgKyB0aGlzLnV1aWQoKVxuIFx0fSxcblx0dG9BcnJheTogZnVuY3Rpb24gKGEpeyBcblx0XHRyZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYSk7IFxuXHR9LFxuXHRmbm9wIDogZnVuY3Rpb24ob3Ape1xuXHRcdHJldHVybiBldmFsKFwiKGZ1bmN0aW9uKGEsYil7IHJldHVybiBhXCIrb3ArXCJiO30pXCIpO1xuXHR9LFxuXHRpc0FycmF5IDogZnVuY3Rpb24oZSl7XG5cdFx0cmV0dXJuIEFycmF5LmlzQXJyYXkoZSk7XG5cdH0sXG5cdGVxdWFscyA6IGZ1bmN0aW9uKHgsIHkpe1xuXHRcdGlmICggeCA9PT0geSApIHJldHVybiB0cnVlO1xuXHRcblx0XHRpZiAoICEgKCB4IGluc3RhbmNlb2YgT2JqZWN0ICkgfHwgISAoIHkgaW5zdGFuY2VvZiBPYmplY3QgKSApIHJldHVybiBmYWxzZTtcblx0XG5cdFx0aWYgKCB4LmNvbnN0cnVjdG9yICE9PSB5LmNvbnN0cnVjdG9yICkgcmV0dXJuIGZhbHNlO1xuXHRcblx0XHRmb3IgKCB2YXIgcCBpbiB4ICkge1xuXHRcdFx0aWYgKCAhIHguaGFzT3duUHJvcGVydHkoIHAgKSApIGNvbnRpbnVlO1xuXHRcdFxuXHRcdFx0aWYgKCAhIHkuaGFzT3duUHJvcGVydHkoIHAgKSApIHJldHVybiBmYWxzZTtcblx0XHRcdFxuXHRcdFx0aWYgKCB4WyBwIF0gPT09IHlbIHAgXSApIGNvbnRpbnVlO1xuXHRcdFxuXHRcdFx0aWYgKCB0eXBlb2YoIHhbIHAgXSApICE9PSBcIm9iamVjdFwiICkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XG5cdFx0XHRpZiAoICEgdGhpcy5lcXVhbHMoIHhbIHAgXSwgIHlbIHAgXSApICkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0XG5cdFx0fVxuXG5cdFx0Zm9yICggcCBpbiB5ICkge1xuXHRcdFx0aWYgKCB5Lmhhc093blByb3BlcnR5KCBwICkgJiYgISB4Lmhhc093blByb3BlcnR5KCBwICkgKSByZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cdHRva2VuOiB7XG5cdFx0aXNTdHJpbmc6IGZ1bmN0aW9uKHQpe1xuXHRcdFx0cmV0dXJuIC9eXCIuKlwiJC8udGVzdCh0KTtcblx0XHR9LFxuXHRcdGlzTnVtYmVyOiBmdW5jdGlvbih0KXtcblx0XHRcdHJldHVybiAvXlxcZCokLy50ZXN0KHQpO1xuXHRcdH0sXG5cdFx0aXNEZWxpbTogZnVuY3Rpb24odCl7XG5cdFx0XHRyZXR1cm4gXCJbXSgpe30sXCIuaW5kZXhPZih0KSA+PSAwO1xuXHRcdH1cblx0fVxufSIsIihmdW5jdGlvbiAocHJvY2Vzcyl7XG4vKiBEZXBlbmRlbmNpZXMgKi9cbnZhciBfICAgICAgID0gcmVxdWlyZShcIi4vZXRjL1V0aWxzLmpzXCIpLFxuICAgIEVycm9ycyAgPSByZXF1aXJlKFwiLi9ldGMvRXJyb3JzLmpzXCIpLFxuICAgIFNldCAgICAgPSByZXF1aXJlKFwiLi90eXBlcy9TZXQuanNcIik7XG4gICAgSGFzaCAgICAgPSByZXF1aXJlKFwiLi90eXBlcy9IYXNoLmpzXCIpO1xuXG4vKiBNYWluIGludGVycHJldGVyIGZ1bmN0aW9uIHRha2VzIGFycmF5IGFuZCBwcmV2aW91cyBmb3JtKi9cbnZhciBKaXNwID0gZnVuY3Rpb24oZm9ybSwgcHJldiwgcHJldl9wb3NpdGlvbil7XG4gIHZhciBhc0FyZyA9IGZhbHNlO1xuXG4gIGlmKEFycmF5LmlzQXJyYXkoZm9ybSkpe1xuICAgIGZvcih2YXIgcG9zaXRpb249MCwgbGVuZ3RoPWZvcm0ubGVuZ3RoOyBwb3NpdGlvbjxsZW5ndGg7IHBvc2l0aW9uKyspe1xuICAgICAgdmFyIHRva2VuID0gZm9ybVtwb3NpdGlvbl07XG4gICAgICBcbiAgICAgIGlmKHByZXZfcG9zaXRpb24gPT09IDApe1xuICAgICAgICBhc0FyZyA9IHRydWU7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8qIGlmIGlkZW50aWZpY2F0b3IgKi9cbiAgICAgIGlmKHRva2VuLmlkICE9PSB1bmRlZmluZWQpe1xuICAgICAgICB2YXIgaWQgPSB0b2tlbi5pZDtcbiAgICAgICAgXG4gICAgICAgIGlmKHByZXYgJiYgcHJldi5pZCA9PSAnZGVmJyl7XG4gICAgICAgICAgLyogSGVyZSB3ZSBjYW4gY2hlY2sgUmVmZXJlbmNlIEVycm9ycyBhbmQgU2NvcGUgZm9sZGluZyovXG4gICAgICAgIH1lbHNle1xuXG4gICAgICAgICAgLyogRGVmaW5lZCB2YXJpYWJsZXMgZGVyZWZlcmVuY2VzICovXG4gICAgICAgICAgaWYoSmlzcC52YXJzW2lkXSAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHZhciBfdmFyID0gSmlzcC52YXJzW2lkXS52YWx1ZTsgICAgICAgICAgICBcblxuICAgICAgICAgICAgaWYoIV92YXIpe1xuICAgICAgICAgICAgICB2YXIgamlkID0gSmlzcC52YXJzW2lkXTtcbiAgICAgICAgICAgICAgX3ZhciA9IEppc3AudmFyc1tqaWRdLmlkID8gSmlzcC52YXJzW2ppZF0udmFsdWUgOiBKaXNwLnZhcnNbSmlzcC52YXJzW2ppZF0uaWRdLnZhbHVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZih0eXBlb2YgX3ZhciA9PSAnZnVuY3Rpb24nICYmIHBvc2l0aW9uID09IDApe1xuICAgICAgICAgICAgICBpZighYXNBcmcpe1xuICAgICAgICAgICAgICAgIGZvcm0gPSBfdmFyLmFwcGx5KGZvcm0sIEppc3AoZm9ybS5zbGljZSgxKSwgZm9ybSwgcG9zaXRpb24pKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgIGZvcm1bcG9zaXRpb25dID0gSmlzcC52YXJzW2lkXS52YWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cblxuICAgICAgICAgIC8qIFJlc2VydmVkIG5hbWVzIGRlcmVmZXJlbmNlcyAqL1xuICAgICAgICAgIGlmKEppc3AubmFtZXNbaWRdICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgdmFyIGtleXdvcmQgPSBKaXNwLm5hbWVzW2lkXTtcblxuICAgICAgICAgICAgaWYodHlwZW9mIGtleXdvcmQgPT0gJ2Z1bmN0aW9uJyAmJiBwb3NpdGlvbiA9PSAwKXtcbiAgICAgICAgICAgICAgdmFyIGFyZ3YgPSBmb3JtLnNsaWNlKDEpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGlmKCFrZXl3b3JkLnF1b3RlKXtcbiAgICAgICAgICAgICAgICBhcmd2ID0gSmlzcChhcmd2LCB0b2tlbiwgcG9zaXRpb24pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFhc0FyZyl7XG4gICAgICAgICAgICAgICAgZm9ybSA9IGtleXdvcmQuYXBwbHkoZm9ybSwgYXJndik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1lbHNlXG4gICAgICAgICAgICBpZih0eXBlb2Yga2V5d29yZCA9PSAnZnVuY3Rpb24nICYmIHBvc2l0aW9uICE9PSAwKXtcbiAgICAgICAgICAgICAgZm9ybVtwb3NpdGlvbl0gPSB0b2tlbjtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICBmb3JtW3Bvc2l0aW9uXSA9IEppc3AubmFtZXNbaWRdLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgICB9ZWxzZXsgICAgICAgIFxuICAgICAgICAvKiBSZWN1cnNpdmUgaW50ZXJwcmV0YXRpb25zICovXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkodG9rZW4pKXsgICAgICAgICAgXG4gICAgICAgICAgZm9ybVtwb3NpdGlvbl0gPSBKaXNwKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgfVx0XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZvcm07XG59XG5cbi8qIFN0b3JhZ2VzICovXG5KaXNwLm5hbWVzID0ge307IC8qIFJlc2VydmVkIG5hbWVzICovXG5KaXNwLnZhcnMgPSB7fTsgLyogVXNlciB2YXJpYWJsZXMgKi9cblxuLyogSGVscGluZyBtZXRob2QgdG8gY3JlYXRlIGZ1bmN0aW9ucyB3aXRoIGFyaXRoeSBjaGVja2luZyBhbmQgYXV0b21hdGljYWx5IHF1b3RlZCAqL1xuSmlzcC5kZWZ1biA9IGZ1bmN0aW9uKGZuLCBhcml0eSwgcXVvdGUpe1xuXHR2YXIgcmVzID0gZnVuY3Rpb24oKXtcblx0XHRpZihhcml0eSAmJiBhcmd1bWVudHMubGVuZ3RoID4gYXJpdHkpe1xuXHRcdFx0dGhyb3cgRXJyb3JzLmFyaXR5RXJyb3IoYXJpdHksIGFyZ3VtZW50cy5sZW5ndGgpO1xuXHRcdH1cblx0XHRpZihmbi5sZW5ndGggJiYgYXJndW1lbnRzLmxlbmd0aCA+IGZuLmxlbmd0aCl7XG5cdFx0XHRjb25zb2xlLndhcm4oXCJXYXJuaW5nISBNYXkgY2F1c2Ugb2Y6XCIgKyBFcnJvcnMuYXJpdHlFcnJvcihhcml0eSwgYXJndW1lbnRzLmxlbmd0aCkpXG5cdFx0fVxuXHRcdHJldHVybiBmbi5hcHBseShKaXNwLmN1cnJlbnRTY29wZSwgYXJndW1lbnRzKTtcblx0fVxuXHRpZihxdW90ZSl7XG5cdFx0cmVzLnF1b3RlID0gdHJ1ZTtcblx0fVxuXHRyZXMuYXJpdHkgPSBhcml0eTtcblx0cmV0dXJuIHJlcztcbn1cblxuSmlzcC5uYW1lc1snZGVmaW5lZD8nXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oZSl7XG4gIHJldHVybiB0eXBlb2YgKEppc3AubmFtZXNbZS5pZF0gfHwgSmlzcC52YXJzW2UuaWRdKSAhPT0gXCJ1bmRlZmluZWRcIjtcbn0sIDEsIHRydWUpO1xuXG5KaXNwLm5hbWVzWyd1c2UnXSA9IGZ1bmN0aW9uKGxpYil7XG4gIHZhciBmaWxlbmFtZSA9IGxpYi5pZCArIFwiLmppc3BcIjtcblxuICByZXF1aXJlKCdmcycpLnJlYWRGaWxlKGZpbGVuYW1lLCB7ZW5jb2Rpbmc6ICd1dGYtOCd9LCBmdW5jdGlvbihlcnIsIGRhdGEpe1xuICAgIGlmKGVycil7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfWVsc2V7XG4gICAgICBKaXNwLkV2YWwoZGF0YSk7XG4gICAgfVxuICB9KVxuXG59XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiBERUZJTklUSU9OUyAqL1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLyogRGVmaW5lICovXG5KaXNwLm5hbWVzLmRlZiA9IEppc3AuZGVmdW4oZnVuY3Rpb24obmFtZSwgdmFsdWUpe1xuICB2YXIgaWQgPSBuYW1lLmlkIHx8IG5hbWU7XG5cblx0LyogRXJyb3IgY2hlY2tpbmcgKi9cblx0aWYoSmlzcC5uYW1lc1tpZF0pe1xuXHRcdHRocm93IEVycm9ycy5yZXNlcnZlZEVycm9yKGlkKTtcblx0fWVsc2Vcblx0aWYoL1xcZCsvLnRlc3QoaWQpKXtcblx0XHR0aHJvdyBFcnJvcnMuc3ludGF4RXJyb3JOdW1iZXIobmFtZSk7XG5cdH1lbHNlXG5cdGlmKCFpZC5sZW5ndGgpe1xuXHRcdHRocm93IEVycm9ycy51bmRleHBlY3RlZElkZW50aWZpY2F0b3IobmFtZSk7XG5cdH1cblx0XG5cdGlmKHZhbHVlLmlkKXtcbiAgICBKaXNwLnZhcnNbbmFtZS5pZF0gPSAodmFsdWUuaWQgPyB2YWx1ZS5pZCA6IHZhbHVlKTtcblxuXHR9ZWxzZXtcblx0XHRKaXNwLnZhcnNbaWRdID0ge1xuXHRcdFx0aWQ6IGlkLFxuXHRcdFx0dmFsdWU6IHZhbHVlXG5cdFx0fVxuXHR9XG5cbiAgcmV0dXJuIHZhbHVlO1xuXG59LCAyKTtcblxuLyogTGFtYmRhIGZ1bmN0aW9uIGRlZmluaXRpb25zKi9cbkppc3AubmFtZXMubGFtYmRhID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhcmd2LCBib2R5KXtcblx0dmFyIG5hbWVzID0gYXJndi5tYXAoXy5wcm9wKCdpZCcpKSxcdFxuXHQgICAgZm5hbWUgPSBfLmZuYW1lKCk7XG5cdFxuXHRmdW5jdGlvbiBib2R5X3BhcnNlcihib2R5LCBhcmdzKXtcblx0XHRyZXR1cm4gYm9keS5tYXAoZnVuY3Rpb24odG9rZW4pe1xuXHRcdFx0aWYoQXJyYXkuaXNBcnJheSh0b2tlbikpe1xuXHRcdFx0XHRyZXR1cm4gYm9keV9wYXJzZXIodG9rZW4sIGFyZ3MpO1xuXHRcdFx0fWVsc2Vcblx0XHRcdGlmKHRva2VuLmlkICE9PSB1bmRlZmluZWQpe1xuICAgICAgICB2YXIgcmVzdHAgPSBuYW1lcy5pbmRleE9mKCcmJyk7XG4gICAgICAgIFxuICAgICAgICBuYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKGFyZ19uYW1lLCBhcmdfcG9zaXRpb24pe1xuICAgICAgICAgIGlmKGFyZ19uYW1lID09IHRva2VuLmlkICYmIGFyZ19uYW1lICE9PSAnJicpe1xuXHRcdFx0XHRcdFx0dG9rZW4gPSBhcmdzW2FyZ19wb3NpdGlvbl07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcdFx0XHRcdFxuXG4gICAgICAgIGlmKHRva2VuLmlkID09ICcmJyAmJiByZXN0cCA+PSAwKXtcbiAgICAgICAgICBpZihhcmdzLmxlbmd0aCA+PSBhcmd2Lmxlbmd0aCl7XG4gICAgICAgICAgICB0b2tlbiA9IF8udG9BcnJheShhcmdzKS5zbGljZShyZXN0cCwgKHJlc3RwID09IGFyZ3YubGVuZ3RoLTEpID8gdm9pZCAwIDogLTEpO1xuICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgdGhyb3cgXCJJbGxlZ2FsIHVzYWdlIG9mIHRoZSAmIChSRVNUIG9mIGFyZ3VtZW50cylcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRva2VuO1xuXHRcdH0pO1xuXHR9XG5cblx0SmlzcC52YXJzW2ZuYW1lXSA9IHtcblx0XHRpZDogZm5hbWUsIFxuXHRcdHZhbHVlOiBmdW5jdGlvbigpe1xuICAgICAgdmFyIHBhcnNlZF9ib2R5ID0gYm9keV9wYXJzZXIoYm9keSwgYXJndW1lbnRzKTtcblx0XHRcdHJldHVybiBKaXNwKHBhcnNlZF9ib2R5LCB7aWQ6IGZuYW1lfSk7XG5cdFx0fVxuXHR9O1xuXHRcdFxuXHRyZXR1cm4ge2lkOiBmbmFtZX07XG59LCAyLCB0cnVlKTtcblxuLyogTGV0IGJpbmRpbmdzICovXG5KaXNwLm5hbWVzLmxldCA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYmluZGluZ3MsIGJvZHkpe1xuICBpZihiaW5kaW5ncy5sZW5ndGglMil7IHRocm93IEVycm9yLmxldEFyaXR5RXJyb3I7ICB9XG4gIFxuICBmdW5jdGlvbiBwYXJzZUJvZHkodG9rZW4sIGFycil7ICAgIFxuICAgIGlmKHRva2VuLmlkKXtcbiAgICAgIGFyci5mb3JFYWNoKGZ1bmN0aW9uKGFsaWFzKXtcbiAgICAgICAgaWYoYWxpYXMuaWQgPT0gdG9rZW4uaWQpe1xuICAgICAgICAgIHRva2VuID0gYWxpYXMudmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmKEFycmF5LmlzQXJyYXkodG9rZW4pKXtcbiAgICAgIHJldHVybiB0b2tlbi5tYXAoZnVuY3Rpb24oeCl7XG4gICAgICAgIHJldHVybiBwYXJzZUJvZHkoeCwgYXJyKTtcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHRva2VuO1xuICB9XG5cbiAgdmFyIGFsaWFzZXMgPSBbXVxuXG4gIGZvcih2YXIgaT0wLGw9YmluZGluZ3MubGVuZ3RoO2k8bDtpKz0yKXtcbiAgICBhbGlhc2VzLnB1c2goe1xuICAgICAgaWQ6IGJpbmRpbmdzW2ldLmlkLFxuICAgICAgdmFsdWUgOiBKaXNwKHBhcnNlQm9keShiaW5kaW5nc1tpKzFdLCBhbGlhc2VzKSlcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiBKaXNwKGJvZHkubWFwKGZ1bmN0aW9uKHRva2VuKXtcbiAgICByZXR1cm4gcGFyc2VCb2R5KHRva2VuLCBhbGlhc2VzKTtcbiAgfSkpO1xufSwgMiwgdHJ1ZSk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiBDb25zdHJ1Y3Rpb25zICovXG5cbi8qIENvbmRpdGlvbnMgKi9cbkppc3AubmFtZXNbJ2lmJ10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGMsIHQsIGUpe1xuICByZXR1cm4gSmlzcChjKSA/IEppc3AodCkgOiAoZSA/IEppc3AoZSkgOiBudWxsKTtcbn0sMywgdHJ1ZSk7XG5cbkppc3AubmFtZXMuY29uZCA9IEppc3AuZGVmdW4oZnVuY3Rpb24oKXsgXG4gIHZhciBhcmd2ID0gXy50b0FycmF5KGFyZ3VtZW50cyk7XG4gIHZhciBfZGVmYXVsdDtcbiAgdmFyIGFyY2hlY2s7XG5cbiAgaWYoYXJndi5sZW5ndGglMil7XG4gICAgdmFyIGNoZWNrID0gSmlzcChhcmd2WzBdKTtcbiAgICBhcmd2ID0gYXJndi5zbGljZSgxKTtcbiAgICBhcmNoZWNrID0gdHJ1ZTtcbiAgfVxuXG4gIGZvcih2YXIgaT0wLGw9YXJndi5sZW5ndGg7aTxsO2krPTIpe1xuXG4gICAgaWYoYXJndltpXS5pZCAmJiBhcmd2W2ldLmlkID09ICcmJyl7XG4gICAgICBfZGVmYXVsdCA9IFthcmd2W2ldLCBhcmd2W2krMV1dO1xuICAgIH1lbHNle1xuICAgICAgaWYoYXJjaGVjayl7XG4gICAgICAgIGlmKF8uZXF1YWxzKGNoZWNrLCBKaXNwKGFyZ3ZbaV0pKSl7XG4gICAgICAgICAgcmV0dXJuIEppc3AoYXJndltpKzFdKTtcbiAgICAgICAgfVxuICAgICAgfWVsc2V7XG4gICAgICAgIGlmKEppc3AoYXJndltpXSkpe1xuICAgICAgICAgIHJldHVybiBKaXNwKGFyZ3ZbaSsxXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZihfZGVmYXVsdCl7XG4gICAgdmFyIHJlcyA9IF9kZWZhdWx0WzFdO1xuICAgIHJldHVybiBKaXNwKHJlcyk7XG4gIH1lbHNle1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG59LCBudWxsLCB0cnVlKTtcblxuLyogUXVvdGF0aW9uICovXG5KaXNwLm5hbWVzLnF1b3RlID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhKXtcbiAgcmV0dXJuIGE7XG59LCBudWxsLCB0cnVlKTtcblxuLyogQXBwbHlpbmcgKi9cbkppc3AubmFtZXMuYXBwbHkgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGZuLCBhcnIpe1xuICByZXR1cm4gSmlzcChbZm5dLmNvbmNhdChhcnIpKTtcbn0sIDIsIHRydWUpO1xuXG5KaXNwLm5hbWVzWydkbyddID0gZnVuY3Rpb24oKXtcbiAgdmFyIGFyZ3YgPSBfLnRvQXJyYXkoYXJndW1lbnRzKSwgcmVzO1xuICBmb3IodmFyIGkgPSAwLCBsID0gYXJndi5sZW5ndGg7IGk8bDsgaSsrKXtcbiAgICByZXMgPSBKaXNwKGFyZ3ZbaV0pO1xuICAgIGlmKGkgPT0gbC0xKXtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICB9XG59XG5cbi8qIEV2YWx1YXRpb24gKi9cbkppc3AubmFtZXNbJ2V2YWwnXSA9IGZ1bmN0aW9uKGV4cHJlc3Npb24pe1xuICByZXR1cm4gSmlzcChKaXNwKGV4cHJlc3Npb24pKTtcbn1cblxuSmlzcC5uYW1lc1sndGhyb3cnXSA9IGZ1bmN0aW9uKG1lc3NhZ2Upe1xuICB0aHJvdyBtZXNzYWdlO1xufVxuXG5KaXNwLm5hbWVzWydzZXQhJ10gPSBmdW5jdGlvbih4LCB5KXtcbiAgSmlzcC52YXJzW3guaWRdID0geVxufVxuXG5KaXNwLm5hbWVzWydkZWZtYWNybyddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihuYW1lLCBhcmdzLCBib2R5KXtcbiAgdmFyIG1hY3JvID0gW1xuICAgIHtpZDogJ2RlZnVuJ30sXG4gICAgbmFtZSxcbiAgICBhcmdzLFxuICAgIFt7aWQ6ICdxdW90ZScsIH0sIGJvZHldXG4gIF1cbiAgSmlzcChtYWNybyk7XG59LCAyLCB0cnVlKTtcblxuSmlzcC5uYW1lc1sndHlwZT8nXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24obyl7XG4gIHZhciB0eXBlID0gdHlwZW9mIG87XG4gIGlmKEFycmF5LmlzQXJyYXkobykpe1xuICAgIGlmKG8udHlwZSl7XG4gICAgICB0eXBlID0gby50eXBlO1xuICAgIH1lbHNle1xuICAgICAgdHlwZSA9ICdsaXN0JztcbiAgICB9XG4gIH1lbHNle1xuICAgIGlmKHR5cGUgPT0gJ29iamVjdCcpe1xuICAgICAgdHlwZSA9PSBcImhhc2hcIjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHR5cGU7XG59LCAxKTtcblxuSmlzcC5uYW1lcy5zY2FuID0gZnVuY3Rpb24obWVzc2FnZSwgaWQsIGZuKXtcbiAgdmFyIHJlYWRsaW5lID0gcmVxdWlyZSgncmVhZGxpbmUnKSxcbiAgICAgIHJsID0gcmVhZGxpbmUuY3JlYXRlSW50ZXJmYWNlKHtcbiAgICAgICAgaW5wdXQ6IHByb2Nlc3Muc3RkaW4sXG4gICAgICAgIG91dHB1dDogcHJvY2Vzcy5zdGRvdXQsXG4gICAgICAgIHRlcm1pbmFsOiBmYWxzZVxuICAgICAgfSk7XG5cbiAgcmwucXVlc3Rpb24oXCI+IFwiICsgbWVzc2FnZSwgZnVuY3Rpb24ocmVzKXtcbiAgICBKaXNwLkV2YWwoXCIoZGVmIFwiICsgaWQuaWQgKyBcIiBcXFwiXCIgKyByZXMudG9TdHJpbmcoKSArIFwiXFxcIiApXCIpO1xuICAgIHJsLmNsb3NlKCk7XG4gICAgSmlzcChbZm4sIGlkXSk7XG4gIH0pO1xufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyogTUFDUk9TRVMgKi9cbkppc3AubmFtZXMuZGVmdW4gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKG5hbWUsIGFyZ3YsIGJvZHkpe1xuICB2YXIgcmVzID0gW1xuICAgIHtpZDogJ2RlZid9LCBcbiAgICB7aWQ6IG5hbWUuaWR9LCBcbiAgICBbIHtpZDonbGFtYmRhJ30gXS5jb25jYXQoW2FyZ3YsIGJvZHldKV07XG4gIHJldHVybiBKaXNwKHJlcyk7XG59LCAzLCB0cnVlKTtcblxuSmlzcC5uYW1lcy5sb2cgPSBmdW5jdGlvbihlKXtcbiAgSmlzcC5zdGRvdXQud3JpdGUoSmlzcC5qaXNwaW5pemUoZSkpO1xufVxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiBMSVNUIERBVEEgVFlQRSAqL1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5KaXNwLm5hbWVzLmNhciA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSl7IHJldHVybiBhWzBdOyB9LCAxKTtcbkppc3AubmFtZXMuY2RyID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhKXsgcmV0dXJuIGEuc2xpY2UoMSk7IH0sIDEpO1xuSmlzcC5uYW1lcy5jb25zID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLCBiKXsgcmV0dXJuIFthXS5jb25jYXQoYik7IH0sIDIpO1xuSmlzcC5uYW1lcy5qb2luID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhLCBjKXsgcmV0dXJuIGEuam9pbihjKTsgfSwgMik7XG5KaXNwLm5hbWVzLmxpc3QgPSBmdW5jdGlvbigpeyByZXR1cm4gXy50b0FycmF5KGFyZ3VtZW50cyk7IH1cbkppc3AubmFtZXNbJ2xlbmd0aCddID0gZnVuY3Rpb24oZSl7XG4gIHJldHVybiBlLmxlbmd0aDtcbn1cblxuSmlzcC5uYW1lcy5yYW5nZSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oZnJvbSwgdG8pe1xuICBpZighdG8pe1xuICAgIHRvID0gZnJvbTtcbiAgICBmcm9tID0gMDtcbiAgfVxuICBcbiAgdmFyIHJlcyA9IFtdLCBlbmQgPSB0bztcblxuICB3aGlsZShmcm9tPD1lbmQpe1xuICAgIHJlcy5wdXNoKGZyb20rKyk7XG4gIH1cbiAgXG4gIHJldHVybiByZXM7XG59LCAyKTtcblxuSmlzcC5uYW1lcy5tYXAgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGZuLCBhcnIpe1xuICByZXR1cm4gSmlzcChhcnIpLm1hcChmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gSmlzcChbZm4sIGl0ZW1dKTtcbiAgfSk7XG59LCAyLCB0cnVlKTtcblxuSmlzcC5uYW1lcy5yZWR1Y2UgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGZuLCBhcnIpe1xuICByZXR1cm4gSmlzcChhcnIpLnJlZHVjZShmdW5jdGlvbihhLCBiKXtcbiAgICByZXR1cm4gSmlzcChbZm4sIGEgLGJdKTtcbiAgfSk7XG59LCAyLCB0cnVlKTtcblxuSmlzcC5uYW1lcy5maWx0ZXIgPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGZuLCBhcnIpe1xuICByZXR1cm4gSmlzcChhcnIpLmZpbHRlcihmdW5jdGlvbihpdGVtKXtcbiAgICByZXR1cm4gSmlzcChbZm4sIGl0ZW1dKTtcbiAgfSk7XG59LCAyLCB0cnVlKTtcblxuSmlzcC5uYW1lcy5zdHIgPSBmdW5jdGlvbigpe1xuICByZXR1cm4gIF8udG9BcnJheShhcmd1bWVudHMpLm1hcChmdW5jdGlvbihlKXtcbiAgICByZXR1cm4gZS50b1N0cmluZyA/IGUudG9TdHJpbmcoKSA6IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChlKTtcbiAgfSkuam9pbihcIlwiKTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyogU0VUIERBVEEgVFlQRSAqL1xuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5KaXNwLm5hbWVzLnNldCA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBuZXcgU2V0KF8udG9BcnJheShhcmd1bWVudHMpKTtcbn1cblxuSmlzcC5uYW1lcy5hZGQgPSBmdW5jdGlvbigpe1xuICB2YXIgYXJndiA9IF8udG9BcnJheShhcmd1bWVudHMpLFxuICAgICAgc2V0ICA9IG5ldyBTZXQoYXJndlswXS5pdGVtcyk7XG5cbiAgYXJndi5zbGljZSgxKS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0peyBzZXQuYWRkKGl0ZW0pOyAgfSk7XG5cbiAgcmV0dXJuIHNldDtcbn1cblxuSmlzcC5uYW1lcy5yZW1vdmUgPSBmdW5jdGlvbigpe1xuICB2YXIgYXJndiA9IF8udG9BcnJheShhcmd1bWVudHMpLFxuICAgICAgc2V0ID0gbmV3IFNldChhcmd2WzBdLml0ZW1zKTtcblxuICBhcmd2LnNsaWNlKDEpLmZvckVhY2goZnVuY3Rpb24oaXRlbSl7IHNldC5yZW1vdmUoaXRlbSk7IH0pXG4gIHJldHVybiBzZXQ7XG59XG5cbkppc3AubmFtZXMudW5pb24gPSBmdW5jdGlvbihhLCBiKXtcblx0cmV0dXJuIChuZXcgU2V0KGEuaXRlbXMpKS51bmlvbihiKTtcbn1cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyogSEFTSCBEQVRBIFRZUEUgKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbkppc3AubmFtZXMuaGFzaCA9IGZ1bmN0aW9uKCl7XG5cdHJldHVybiBuZXcgSGFzaChfLnRvQXJyYXkoYXJndW1lbnRzKSkuaXRlbXM7XG59XG5cbkppc3AubmFtZXMuYXNzb2MgPSBmdW5jdGlvbigpe1xuICB2YXIgYXJndiA9IF8udG9BcnJheShhcmd1bWVudHMpO1xuICByZXR1cm4gKG5ldyBIYXNoKGFyZ3ZbMF0pKS5hc3NvYyhhcmd2LnNsaWNlKDEpKTtcbn1cblxuSmlzcC5uYW1lcy5kaXNzb2MgPSBmdW5jdGlvbigpe1xuICB2YXIgYXJndiA9IF8udG9BcnJheShhcmd1bWVudHMpO1xuICByZXR1cm4gKG5ldyBIYXNoKGFyZ3ZbMF0pKS5kaXNzb2MoYXJndi5zbGljZSgxKSk7XG59XG5cbkppc3AubmFtZXMuZ2V0ID0gZnVuY3Rpb24oYSwgYil7XG4gIHJldHVybiBhW2IuaWQgPyBiLmlkLnNsaWNlKDEpIDogYl07XG59XG5cbkppc3AubmFtZXNbXCIuXCJdID0gSmlzcC5kZWZ1bihmdW5jdGlvbihoYXNoLCBuYW1lKXtcbiAgaGFzaCA9IGhhc2guaWQgPyBKaXNwLnZhcnNbaGFzaC5pZF0udmFsdWUgOiBKaXNwKGhhc2gpO1xuICByZXR1cm4gbmFtZS5pZCA/IGhhc2hbbmFtZS5pZF0gfHwgaGFzaFtuYW1lXSA6IGhhc2hbbmFtZV07XG59LCAyLCB0cnVlKTtcblxuLyogTWF0aCBvcGVyYXRpb25zICovXG5KaXNwLm5hbWVzWycrJ10gPSBmdW5jdGlvbihlKXsgcmV0dXJuIF8udG9BcnJheShhcmd1bWVudHMpLnJlZHVjZShfLmZub3AoJysnKSk7IH1cbkppc3AubmFtZXNbJy0nXSA9IGZ1bmN0aW9uKGUpeyByZXR1cm4gXy50b0FycmF5KGFyZ3VtZW50cykucmVkdWNlKF8uZm5vcCgnLScpKTsgfVxuSmlzcC5uYW1lc1snKiddID0gZnVuY3Rpb24oZSl7IHJldHVybiBfLnRvQXJyYXkoYXJndW1lbnRzKS5yZWR1Y2UoXy5mbm9wKCcqJykpOyB9XG5KaXNwLm5hbWVzWycvJ10gPSBmdW5jdGlvbihlKXsgcmV0dXJuIF8udG9BcnJheShhcmd1bWVudHMpLnJlZHVjZShfLmZub3AoJy8nKSk7IH1cbkppc3AubmFtZXNbJz4nXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSxiKXsgcmV0dXJuIGEgPiBiOyB9LCAyKTtcbkppc3AubmFtZXNbJz4nXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSxiKXsgcmV0dXJuIGEgPiBiOyB9LCAyKTtcbkppc3AubmFtZXNbJz49J10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsYil7cmV0dXJuIGEgPj0gYjt9LCAyKTtcbkppc3AubmFtZXNbJzw9J10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsYil7cmV0dXJuIGEgPD0gYjt9LCAyKTtcbkppc3AubmFtZXNbJzwnXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSxiKXtcdHJldHVybiBhIDwgYjsgfSwgMik7XG5KaXNwLm5hbWVzWyc9J10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsYil7XHRyZXR1cm4gYSA9PSBiO30sIDIpO1xuSmlzcC5uYW1lc1snZXE/J10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsYil7cmV0dXJuIF8uZXF1YWxzKGEsIGIpO30sIDIpO1xuSmlzcC5uYW1lc1snbW9kJ10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsYil7XHRyZXR1cm4gYSAlIGI7IH0sIDIpO1xuSmlzcC5uYW1lc1snYW5kJ10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsYil7cmV0dXJuIGEgJiYgYjt9LCAyKTtcbkppc3AubmFtZXNbJ29yJ10gPSBKaXNwLmRlZnVuKGZ1bmN0aW9uKGEsYil7IHJldHVybiBhIHx8IGI7fSwgMik7XG5KaXNwLm5hbWVzWydub3QnXSA9IEppc3AuZGVmdW4oZnVuY3Rpb24oYSl7ICByZXR1cm4gIWE7fSwgMSk7XG5KaXNwLm5hbWVzWydsaXN0PyddID0gSmlzcC5kZWZ1bihmdW5jdGlvbihhKXsgcmV0dXJuIEFycmF5LmlzQXJyYXkoYSk7fSwgMSk7XG5cbkppc3AuamlzcGluaXplID0gZnVuY3Rpb24gbGlzcGluaXplKGpzKXtcbiAgZnVuY3Rpb24gcmV0b2tlKGope1xuICAgIHZhciBzdHIgPSBKU09OLnN0cmluZ2lmeShqKTtcbiAgICByZXR1cm4gcmVzID0gc3RyLnJlcGxhY2UoL1xcWy9nLCAnKCAnKS5yZXBsYWNlKC9cXF0vZywgJyApJykucmVwbGFjZSgvLC9nLCAnICcpO1xuICB9XG5cbiAgZnVuY3Rpb24gcGFyc2VKcyhqKXtcbiAgICBpZihBcnJheS5pc0FycmF5KGopKXtcbiAgICAgIHJldHVybiByZXRva2Uoai5tYXAocGFyc2VKcykpO1xuICAgIH1lbHNle1xuICAgICAgaWYodHlwZW9mIGogPT09ICdvYmplY3QnICYmICFqKXtcbiAgICAgICAgcmV0dXJuICduaWwnO1xuICAgICAgfVxuICAgICAgXG4gICAgICBpZihqID09PSB1bmRlZmluZWQpe1xuICAgICAgICByZXR1cm4gJ25pbCc7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGlmKGouaWQpe1xuICAgICAgICB2YXIgdHlwZTtcbiAgICAgICAgXG4gICAgICAgIHR5cGUgPSB0eXBlb2YgKEppc3AubmFtZXNbai5pZF0gfHwgKEppc3AudmFyc1tqLmlkXSA/IEppc3AudmFyc1tqLmlkXS52YWx1ZSB8fCBKaXNwLnZhcnNbai5pZF0gOiB1bmRlZmluZWQpKSB8fCBcIklEXCI7XG4gICAgICAgIHR5cGUgPSB0eXBlLnNsaWNlKDAsMykudG9VcHBlckNhc2UoKTtcblxuICAgICAgICBpZih0eXBlID09IFwiVU5EXCIpe1xuICAgICAgICAgIHJldHVybiBcIjxcIiArIGouaWQgKyBcIj5cIjtcbiAgICAgICAgfWVsc2V7XG5cbiAgICAgICAgICBpZih0eXBlID09PSBcIkZVTlwiKXtcbiAgICAgICAgICAgIGZvcih2YXIgYWxpYXMgaW4gSmlzcC52YXJzKXtcbiAgICAgICAgICAgICAgaWYoai5pZCA9PSBKaXNwLnZhcnNbYWxpYXNdKXtcbiAgICAgICAgICAgICAgICBqLmlkID0gYWxpYXNcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBcIiNcIiArIHR5cGUgKyBcIjogPFwiICArIGouaWQgKyBcIj5cIjsgIFxuICAgICAgICB9ICAgICAgICBcbiAgICAgIH1lbHNlXG4gICAgICBpZihqLml0ZW1zKXtcbiAgICAgICAgcmV0dXJuIFwiI1NFVDogPCBcIiArIHBhcnNlSnMoai5pdGVtcykgKyBcIiA+XCI7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgaWYodHlwZW9mIGogPT0gJ29iamVjdCcpe1xuICAgICAgICAgIHJldHVybiBcIiNIQVNIOiA8IFwiICsgSlNPTi5zdHJpbmdpZnkoaikgKyBcIiA+XCI7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgIGlmKHR5cGVvZiBqID09PSBcImJvb2xlYW5cIil7XG4gICAgICAgICAgICBpZihqKXtcbiAgICAgICAgICAgICAgcmV0dXJuIFwiI3RcIjtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICByZXR1cm4gXCJuaWxcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHJldHVybiBqO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJzZUpzKGpzKTtcbn1cblxuLyogVG9rZW5pemVyIGZ1bmN0aW9uICovXG5mdW5jdGlvbiB0b2tlbml6ZShleHByKXtcdFxuXHRmdW5jdGlvbiBzdHJpbmdTd2lwZU9uKHN0cmluZyl7XG5cdFx0cmV0dXJuIHN0cmluZ1xuXHRcdFx0LnJlcGxhY2UoLyAvZywgXCJfX1BST0JfX1wiKVxuXHRcdFx0LnJlcGxhY2UoL1xcbi9nLCBcIl9fTkxJTl9fXCIpXG5cdFx0XHQucmVwbGFjZSgvXFx0L2csIFwiX19OVEFCX19cIilcblx0XHR9XG5cblx0ZnVuY3Rpb24gc3RyaW5nU3dpcGVPZmYoZSl7XG5cdFx0cmV0dXJuIGUucmVwbGFjZSgvX19QUk9CX18vZywgXCIgXCIpXG5cdFx0XHRcdC5yZXBsYWNlKC9fX05MSU5fXy9nLCBcIlxcblwiKVxuXHRcdFx0XHQucmVwbGFjZSgvX19OVEFCX18vZywgXCJcXHRcIik7XG5cdH1cblxuXHR2YXIgc2VxdWVuY2VzID0gZXhwclxuICAgIC5yZXBsYWNlKC8nXFwoLio/XFwpL2csIGZ1bmN0aW9uKGUpeyBcbiAgICAgIHJldHVybiBcIihxdW90ZSBcIiArIGUuc2xpY2UoMSkgKyBcIiApXCI7IH0pXG4gICAgLnJlcGxhY2UoL1xcflxcKC4qP1xcKS9nLCBmdW5jdGlvbihlKXsgXG4gICAgICByZXR1cm4gXCIoZXZhbCBcIiArIGUuc2xpY2UoMSkgKyBcIiApXCI7IH0pXG4gICAgLnJlcGxhY2UoL1xcKC9nLCAnIFsgJylcbiAgICAucmVwbGFjZSgvXFwpL2csICcgXSAnKVxuXHQgIC5yZXBsYWNlKC9cXDsuKyhcXG58JCkvZywgJycpXG4gICAgLnJlcGxhY2UoL1xcXCIuKj9cXFwiL2csIHN0cmluZ1N3aXBlT24pXG4gICAgLnJlcGxhY2UoL1xcey4qP1xcfS9nLCBzdHJpbmdTd2lwZU9uKTtcblxuXHRyZXR1cm4gc2VxdWVuY2VzLnRyaW0oKS5zcGxpdCgvXFxzKy8pLm1hcChzdHJpbmdTd2lwZU9mZik7XG59XG5cbi8qIFJldHVybiBKUyBzdHJ1Y3R1cmUgc3RyaW5nICovXG5mdW5jdGlvbiBzdHJ1Y3R1cml6ZShzdHJ1Y3Qpe1xuXHRzdHJ1Y3QgPSBzdHJ1Y3QubWFwKGZ1bmN0aW9uKHRva2VuLCBwKXtcblx0XHR2YXIgaXNJZCA9IHRva2VuICE9IFwiW1wiICYmIHRva2VuICE9IFwiXVwiICYmICAhL1xcZCsvLnRlc3QodG9rZW4pICYmIHRva2VuWzBdICE9ICdcIicgJiYgdG9rZW5bdG9rZW4ubGVuZ3RoLTFdICE9ICdcIicgJiYgdG9rZW4gIT09XCJ0XCIgJiYgdG9rZW4gIT09XCJuaWxcIjtcblx0XHRcblx0XHRpZiggaXNJZCApe1xuXHRcdFx0dG9rZW4gPSBcIntpZDogJ1wiICsgdG9rZW4gKyBcIid9XCJcblx0XHR9XG5cdFx0XG5cdFx0aWYodG9rZW4gPT0gXCJ0XCIpe1xuXHRcdFx0dG9rZW4gPSBcInRydWVcIjtcblx0XHR9XG5cblx0XHRpZih0b2tlbiA9PSBcIm5pbFwiKXtcblx0XHRcdHRva2VuID0gXCJmYWxzZVwiO1xuXHRcdH1cblx0XHRcblx0XHRpZih0b2tlbiA9PSBcIltcIiB8fCBzdHJ1Y3RbcCsxXSA9PSBcIl1cIiB8fCBwPT0oc3RydWN0Lmxlbmd0aC0xKSApe1xuXHRcdFx0aWYodG9rZW5bdG9rZW4ubGVuZ3RoLTFdID09ICdcIicgJiYgc3RydWN0W3ArMV0gIT09IFwiXVwiKXtcblx0XHRcdFx0cmV0dXJuIHRva2VuICsgXCIsXCI7IFxuXHRcdFx0fWVsc2V7XG5cdFx0XHRcdHJldHVybiB0b2tlbjtcblx0XHRcdH1cblx0XHR9ZWxzZXtcblx0XHRcdHJldHVybiB0b2tlbiArIFwiLFwiXG5cdFx0fVxuXG5cblx0fSkuam9pbignJyk7XG5cdFxuXHRyZXR1cm4gXCJbXCIgKyBzdHJ1Y3QgK1wiXVwiO1xufVxuXG5cblxuSmlzcC5FdmFsID0gZnVuY3Rpb24oc3RyKXtcblx0dmFyIHN0cnVjdHVyZSA9IHRva2VuaXplKHN0ciksXG5cdFx0anMgPSBzdHJ1Y3R1cml6ZShzdHJ1Y3R1cmUpLFxuXHRcdHJlcztcdFxuXHR0cnl7XG5cdFx0cmVzID0gSmlzcChldmFsKGpzKSk7XG5cdFx0cmV0dXJuIHJlc1tyZXMubGVuZ3RoLTFdO1xuXHR9Y2F0Y2goZXJyb3Ipe1xuXHRcdGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuXHRcdHJldHVybjtcblx0fVxufVxuXG5cblxuSmlzcC5zZXR1cCA9IGZ1bmN0aW9uKG9wdGlvbnMpe1xuICBKaXNwLnN0ZGluID0gb3B0aW9ucy5zdGRpbjtcbiAgSmlzcC5zdGRvdXQgPSBvcHRpb25zLnN0ZG91dDtcbiAgSmlzcC5lbnYgPSBvcHRpb25zLmVudjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKaXNwOyBcblxuLy8gSmlzcC5FdmFsKFwiKGRlZnVuIHNvbWU/KGZuIGFycikoPiAobGVuZ3RoIChmaWx0ZXIgZm4gYXJyKSkgMCApKVxcXG4vLyAoZGVmdW4gcG9zKHgpKD4geCAwKSlcXFxuLy8gKHNvbWU/IHBvcyAoMSAyIDMgNCkpXCIpO1xuXG5cbn0pLmNhbGwodGhpcyxyZXF1aXJlKFwiMVlpWjVTXCIpKSIsInZhciBfID0gcmVxdWlyZShcIi4uL2V0Yy9VdGlscy5qc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKXtcblx0ZnVuY3Rpb24gbW9kKG0sIHNldCwgcHJvcCwgdmFsKXtcblx0XHR2YXIgbmFtZSA9IHByb3AuaWQgfHwgcHJvcDtcblx0XHRpZihuYW1lWzBdPT1cIjpcIil7XG5cdFx0XHRuYW1lID0gbmFtZS5zbGljZSgxKTtcblx0XHR9XG5cdFx0XG5cdFx0aWYobSA9PSAnYWRkJyl7XG5cdFx0XHRzZXQuaXRlbXNbbmFtZV0gPSB2YWw7XG5cdFx0fWVsc2V7XG5cdFx0XHRzZXQuaXRlbXNbbmFtZV0gPSBudWxsO1xuXHRcdFx0ZGVsZXRlIHNldC5pdGVtc1tuYW1lXTtcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBIYXNoKGFyZ3Ype1xuXHRcdHRoaXMuaXRlbXMgPSB7fTtcblxuXHRcdGlmKEFycmF5LmlzQXJyYXkoYXJndikpe1xuXHRcdFx0aWYoIWFyZ3YubGVuZ3RoJTIpe1xuXHRcdFx0XHR0aHJvdyBcIkFyaXR5IGVycm9yXCI7XG5cdFx0XHR9XG5cdFx0XG5cdFx0XHRmb3IodmFyIGk9MCxsPWFyZ3YubGVuZ3RoO2k8bDtpKz0yKXtcblx0XHRcdFx0bW9kKCdhZGQnLCB0aGlzLCBhcmd2W2ldLCBhcmd2W2krMV0pO1xuXHRcdFx0fVxuXHRcdH1lbHNle1xuXHRcdFx0Zm9yKHZhciBpIGluIGFyZ3Ype1xuXHRcdFx0XHRtb2QoJ2FkZCcsIHRoaXMsIGksIGFyZ3ZbaV0pO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdEhhc2gucHJvdG90eXBlLmFzc29jID0gZnVuY3Rpb24oYXJndikge1xuXHRcdGZvcih2YXIgaT0wLGw9YXJndi5sZW5ndGg7aTxsO2krPTIpe1xuXHRcdFx0bW9kKCdhZGQnLCB0aGlzLCBhcmd2W2ldLCBhcmd2W2krMV0pO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5pdGVtcztcblx0fTtcblxuXHRIYXNoLnByb3RvdHlwZS5kaXNzb2MgPSBmdW5jdGlvbihhcmd2KSB7XG5cdFx0Zm9yKHZhciBpPTAsbD1hcmd2Lmxlbmd0aDtpPGw7aSsrKXtcblx0XHRcdG1vZCgncmVtJywgdGhpcywgYXJndltpXSk7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLml0ZW1zO1xuXHR9O1xuXG5cdEhhc2gucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHByb3ApIHtcblx0XHR2YXIgbmFtZSA9IHByb3AuaWQgfHwgcHJvcDtcblx0XHRpZihuYW1lWzBdPT1cIjpcIil7XG5cdFx0XHRuYW1lID0gbmFtZS5zbGljZSgxKTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMuaXRlbXNbbmFtZV07XG5cdH07XG5cblx0cmV0dXJuIEhhc2g7XG59KSgpOyIsInZhciBfID0gcmVxdWlyZShcIi4uL2V0Yy9VdGlscy5qc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKXtcblx0ZnVuY3Rpb24gcHVzaChzZXQsIGl0ZW0pe1xuXHRcdGlmKHNldC5pdGVtcy5sZW5ndGgpe1xuXHRcdFx0aWYoc2V0Lml0ZW1zLmV2ZXJ5KGZ1bmN0aW9uKHNpdGVtKXtcblx0XHRcdFx0aWYoIV8uZXF1YWxzKHNpdGVtLCBpdGVtKSl7XG5cdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pKXtcblx0XHRcdFx0c2V0Lml0ZW1zLnB1c2goaXRlbSk7XG5cdFx0XHR9XG5cdFx0fWVsc2V7XG5cdFx0XHRzZXQuaXRlbXMucHVzaChpdGVtKTtcblx0XHR9XG5cdFx0cmV0dXJuIHNldC5pdGVtcztcblx0fVxuXG5cdGZ1bmN0aW9uIFNldChpdGVtcyl7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHRoaXMuaXRlbXMgPSBbXTtcblxuXHRcdGl0ZW1zICYmIGl0ZW1zLmZvckVhY2goZnVuY3Rpb24oaSl7XG5cdFx0XHRzZWxmLml0ZW1zLnB1c2goaSk7XG5cdFx0fSk7XG5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcy5pdGVtcywgXCJ0eXBlXCIsIHtcblx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG5cdFx0XHRlbnVtZXJhYmxlIDogZmFsc2UsXG5cdFx0XHR2YWx1ZTogXCJzZXRcIlxuXHRcdH0pO1xuXHRcdHJldHVybiB0aGlzLml0ZW1zO1xuXHR9XG5cblx0U2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih4KSB7XG5cdFx0cHVzaCh0aGlzLCB4KTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHRTZXQucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKHgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dGhpcy5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0sIGkpe1xuXHRcdFx0aWYoXy5lcXVhbHMoaXRlbSwgeCkpe1xuXHRcdFx0XHRzZWxmLml0ZW1zLnNwbGljZShpLCAxKTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHRTZXQucHJvdG90eXBlLnVuaW9uID0gZnVuY3Rpb24oc2V0KSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHNldC5pdGVtcy5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pe1xuXHRcdFx0cHVzaChzZWxmLCBpdGVtKTtcblx0XHR9KTtcblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblxuXHRyZXR1cm4gU2V0O1xufSkoKTsiXX0=