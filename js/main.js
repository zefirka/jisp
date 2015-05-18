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