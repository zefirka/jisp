# jisp
Little JavaScript Lisp Interpreter

[Online REPL](https://zefirka.github.io/jisp/repl.html)


## Run
Repl:
```node jisp.js -r```

File:
```node jisp.js file.lisp```



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

###Constructions

####Conditions
#####If/then/else
`(if cond then else)` - evaluetes `cond` and if it's not `false` (`nil`) evaluetes `then` else evaluetes `else`

```lisp
(if t "Hoooray" "Never will be logd")
>"Hoooray"

(defun abs(x)
  (if (>= x 0)    ;cond
      x           ;then
      (* -1 x)))  ;else

(abs 10)
>10
(abs -10)
>10
```

#####Cond
`cond` has 2 signatures :

`(cond test value1 result1 value2 result2 ... & default )` and `(cond test1 result1 test2 result2 ... & default)` 

```lisp
; cond where every condition calculates 
(defun fac(n)
  (cond 
    (< n 0) (throw "Error: Argument is negative!")
    (= n 0) 1
    (<= n 2) n
    & (* n (fac (- n 1)))))

(fac -1)
Error: Argument is negative!

(fac 0)
>1

(fac 2)
>2

(fac 4)
>24
```

```lisp
; cond where test calculates once
(defun test(n)
  (cond n
    1 "Arg = 1"
    2 "Arg = 2"
    & "Arg != 1 and 2"))

(test 1)
>"Arg = 1"

(test 10)
>"Arg != 1 and 2"
```



####Form sequences
`(do form1 form2 form3 )` - repeatedly evaluetes forms and return value of last form

```lisp
(do 
  (log "Hey!")  
  (log "You!")
  (let (x 10 y 20)
    (+ x y))
)
Hey
You
>30
```

####Applications
`(apply fn list)` - applies given function to the list

```lisp
(apply + (1 2 3))
>6
(apply set ("alpha" "betta" "gamma"))
>#SET: <( "alpha" "betta" "gamma" ) >
```

###Data types

####Lists
  - `(list 1 2 3)` - creates list  `(1 2 3)`
  - `(car (1 2 3)` - takes head of list `1`
  - `(cdr (1 2 3)` - takes rest of list `(2 3)`
  - `(cons 1 (2 3)` - concats args to list `(1 2 3)`
  - `(length (1 2 3)` - return count of elements of list `3`

###Methods
  - `(map fn list)` - applies given function to the each list element return new list

```lisp
(defun square(x) (* x x))

(map square (1 2 3 4))
>(1 4 9 16)
```

  - `(filter fn list)` - filters list by given function

```lisp
(defun odd?(x) (not (eq? 0 (mod x 2))))

(filter odd? (1 2 3 4 5 6 7))
>(1 3 5 7)
```

  - `(reduce fn list)` - reduce list by given function

```lisp
(defun average(count)
  (let (sum (reduce + (range count))) 
    (log (str "count is " count))
    (/ sum count)))

(average 10)
>5.5
(average 20)
>10.5
```
