
$(function(){
  var stdout = {
    obj: $("#to"),
    write: function(text, clear){
      text = text.toString();
      if(clear){
        this.obj.html('');
      }
      this.obj.html(this.obj.html() + text.replace(/\</g, "&lt;").replace(/\>/g, "&gt;").replace("\n", "</br>") + "<br>");
    }  
  };

  Jisp.setup({
    stdout : stdout
  });


  $("#eval").click(function(){
    var jisp = $("#from").val();
    if(jisp){
      stdout.write(Jisp.jispinize(Jisp.Eval(jisp)), 0);
    }
  })
  
})