var Jisp = require("./src/jisp.js");

Jisp.setup({
  stdin : process.stdin,
  stdout : process.stdout,
  env: 'dev'
});

function startRepl(){
  var repl = require('repl');

  repl.start({
    prompt: "> ",
    input: Jisp.stdin,
    output: Jisp.stdout,
    writer: function(x){
      return x;
    },
    ignoreUndefined : true,
    eval: function(cmd, context, filename, callback) {
      if (cmd !== "(\n)") {
        cmd = cmd.slice(1, -2);
        var res = Jisp.jispinize(Jisp.Eval(cmd));
        callback(null, res);
      } else {
        callback(null);
      }
    }
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
}

startRepl();