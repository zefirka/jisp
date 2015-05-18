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

// Jisp.Eval("(defun some?(fn arr)(> (length (filter fn arr)) 0 ))\
// (defun pos(x)(> x 0))\
// (some? pos (1 2 3 4))");

