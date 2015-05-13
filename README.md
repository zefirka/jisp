# jisp
Little JavaScript Lisp Interpreter

## Commands
###Math and logic
  - `(+ 1 2 3)` - equals to 6 (1 + 2 + 3)
  - `(- 10 1 1)` - equals to 8 (10 - 1 - 1)
  - `(* 1 2 3)` - equals to 9 (1 * 2 * 3)
  - `(/ 100 4 5)` - equals to 5 (100 / 4 = 25 -> 25 / 5 = 5)
  - `(> 10 11)` - false (10 > 11)
  - `(< 10 11)` - true (10 < 11)
  - `(or (>= 10 10) (< 3 2))` - true (equals to (10 >= 10 || 3 < 2))
  - `(and (>= 10 10) (< 3 2))` - false (equals to (10 >= 10 && 3 < 2))
  - `(not true)` - false
  - `(eq? 1 1)` - true (strong equality)
  - `(= 1 1)` - true (== equality)
  - `(eq? (1 2) (1 2))` - true (lists comparsion)
  - `(= (1 2) (1 2))` - false (week comparsion don't take lists)

###Definitions
`(def var 100)` - defines global variable `var` with value `100`
`(def xv var)` - defines global variable `xv` with value `100` dereferenced from `var` variable
```lisp
(def result ; define global variable with value of sum of local vars
  (let (x 10 y 20) ; here x and y are local variables 
    (+ x y))) ;final result 
(log result) 
> 30
```

###Functions
Definition of anonymous functions:
```lisp 
;define var with name fac which is lambda-function
(def fac
  (lambda(n)
    (if (<= n 2)
        2
        (* n (fac (- n 1))))))
```
Or use `defun` macros:
```lisp
(defun inc(x) (+ x 1)) ; increment function
(defun dec(x) (- x 1)) ; decrement function
```

####Let-bindings
```lisp
(defun highest-first(x y) 
  (let (  firsta (car x)
          firstb (car y))
    (>= firsta firstb) firsta firstb))
```
