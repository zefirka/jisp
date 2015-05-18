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