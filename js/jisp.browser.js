_ = {
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


Errors = {
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

Hash = (function(){
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


Set = (function(){
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

/* Main interpreter function takes array and previous form*/
var Jisp = function(form, prev, deb){
  /* If called with form */
  if(deb){
    console.log(JSON.stringify(form));
  }
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

Jisp.names['defined?'] = function(e){
  return  Jisp.names[e.id || e] || Jisp.vars[e.id || e];
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
      return Jisp(body_parser(body, arguments), {id: fname});
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
      value : Jisp(bindings[i+1])
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
  stdout.put(Jisp.jispinize(e));
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
Jisp.names['not'] = Jisp.defun(function(a){ return !a;}, 1);
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

  var sequences = expr.replace(/\(/g, ' [ ') .replace(/\)/g, ' ] ')
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
    stdout.put(error);
    return;
  }
}


var stdout;

$(function(){
  stdout = {
    obj: $("#to"),
    put: function(a){
      var t = $("#to"),
          res = Jisp.jispinize(Jisp.Eval(a));

      t.html(res.replace("\n", "</br>"));
    }
  }


  $("#eval").click(function(){
    var jisp = $("#from").val();
    if(jisp){
      stdout.obj.html( Jisp.jispinize(Jisp.Eval(jisp)).replace(/\</g, "&lt;").replace(/\>/g, "&gt;") + "<br>");
    }
  })
  
})