var _       = require("./utils.js"),
    Errors  = require("./Errors.js"),
    Set     = require("./Set.js");


/* Main interpreter function takes array and previous form*/
var Jisp = function(form, prev){
  /* If called with form */
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
            _var = Jisp.vars[Jisp.vars[id].id].value;
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
		Jisp.vars[name.id] = value;
		return value.value;
	}else{
		Jisp.vars[id] = {
			id: id,
			value: value
		}
		return value;
	}

}, 2);

/* Lambda function */
Jisp.names.lambda = Jisp.defun(function(argv, body){
	var names = argv.map(function(name){
		return name.id;
	});
	
	var fname = "fn_" + (new Date().getTime().toString().slice(-4)) + _.uuid();
	
	function body_parser(body, args){
		return body.map(function(token){
			if(Array.isArray(token)){
				return body_parser(token, args);
			}else
			if(token.id !== undefined){
				names.forEach(function(arg_name, arg_position){
					if(arg_name == token.id){
						token = args[arg_position];
					}
				});				
			}
			return token;
		});
	}

	Jisp.vars[fname] = {
		id: fname, 
		value: function(){
			var new_body = body_parser(body, arguments)
			return Jisp(new_body, {id: fname});
		}
	};
		
	return {id: fname};
}, 2, true);

Jisp.names.defun = Jisp.defun(function(name, argv, body){
  var res = [
    {id: 'def'}, 
    {id: name.id}, 
    [ {id:'lambda'} ].concat([argv, body]) ];
  return Jisp(res);
}, 3, true);

/* IF/THEN/ELSE */
Jisp.names['if'] = Jisp.defun(function(cond, then, _else){
	deb("IF", arguments);
	if(Jisp(cond)){
		return Jisp(then)
	}else{
		return _else ? Jisp(_else) : null;
	}
},3, true);


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

Jisp.names.apply = Jisp.defun(function(fn, arr){
  return Jisp([fn].concat(arr));
}, 2, true);

Jisp.names['quote'] = Jisp.defun(function(a){
	return a;
}, null, true);


Jisp.names.str = function(){
  return  _.toArray(arguments).map(function(e){
    return e.toString ? e.toString() : Object.prototype.toString.call(e);
  }).join("");
}

Jisp.names.let = Jisp.defun(function(bindings, body){
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

  if(bindings.length%2){
    throw "Even length of bindings list";
  }

  var aliases = []

  for(var i=0,l=bindings.length;i<l;i+=2){
    aliases.push({
      id: bindings[i].id,
      value : bindings[i+1]
    });
  }

  return Jisp(body.map(function(token){
    return parseBody(token, aliases);
  }));
}, 2, true);

Jisp.names.log = function(e){
  console.log(e);
}

Jisp.names.join = function(a, c){
  return a.join(c);
}

Jisp.names["."] = function(x, y){
  console.log(arguments);
  return x[y.id || y];
}

/* Set data type */
Jisp.names.set = function(){
	var argv = _.toArray(arguments),
		set = new Set(argv);

	return set;
}

Jisp.names.add = function(){
	var argv = _.toArray(arguments);

	var set  = new Set(argv[0].items);

	argv.slice(1).forEach(function(item){
		set.add(item);
	});

	return set;
}

Jisp.names.remove = function(){
	var argv = _.toArray(arguments);

	var set = new Set(argv[0].items);

	argv.slice(1).forEach(function(item){
		set.remove(item);
	})
	return set;
}

Jisp.names['throw'] = function(message){
  throw message;
}

Jisp.names.union = function(a, b){
	var set = new Set(a.items);
	return set.union(b);
}

/* Hashes */
Jisp.names.hash = function(){
	var argv = _.toArray(arguments);

	if(!argv.length%2){
		throw "Arity error";
	}
	var j = {};

	for(var i=0,l=argv.length;i<l;i+=2){
		var prop = argv[i];
		prop = prop.id || prop;
		
		if(prop[0] == ":"){
			prop = prop.slice(1);
		}

		j[prop.id || prop] = argv[i+1];
	}

	return j;
};

Jisp.names['length'] = function(e){
  return e.length;
}

Jisp.names.assoc = function(hash, prop, value){
	hash[prop.id || prop] = value.id || value;
	return hash;
}

Jisp.names.map = Jisp.defun(function(fn, arr){
	return arr.map(function(item){
    return Jisp([fn, item]);
  });
}, 2, true);

Jisp.names.reduce = Jisp.defun(function(fn, arr){
  return arr.reduce(function(a, b){
    return Jisp([fn, a ,b]);
  });
}, 2, true);

Jisp.names.filter = Jisp.defun(function(fn, arr){
  return arr.filter(function(item){
    return Jisp([fn, item]);
  });
}, 2, true);

/* List functions  */
Jisp.names.car = Jisp.defun(function(a){ return a[0]; }, 1);
Jisp.names.cdr = Jisp.defun(function(a){ return a.slice(1); }, 1);
Jisp.names.cons = Jisp.defun(function(a, b){ return [a].concat(b); }, 2);
Jisp.names.list = function(){ return _.toArray(arguments); }


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
Jisp.names['not'] = Jisp.defun(function(a){ return !a;}, 1);
Jisp.names['list?'] = Jisp.defun(function(a){ return Array.isArray(a);}, 1);

/* Debugging logger */
function deb(){ return Jisp.debug && console.log.apply(console, arguments); }


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

	var sequences = expr .replace(/\(/g, ' [ ') .replace(/\)/g, ' ] ')
	.replace(/\;.+(\n|$)/g, '') .replace(/\".*?\"/g, stringSwipeOn)
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


if(process.argv.length > 2){
  var filename = process.argv.pop();
  require('fs').readFile(filename, {encoding: 'utf-8'}, function(err, data){
    if(err){
      throw err;
    }
    Jisp.Eval(data);
  })
}

if(process.argv.indexOf("-d")>=0){
	Jisp.debug = true;
}

if(process.argv.indexOf("-r")>=0){
	var readline = require('readline'),
		rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			terminal: false
		});

	rl.on('line', function(line){
		console.log(Jisp.Eval(line));
	});

}