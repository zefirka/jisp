(defun inc(x)(+ x 1))
(defun dec(x)(- x 1))
(defun pos?(x)(> x 0))
(defun neg?(x)(< x 0))
(defun zero?(x)(= x 0))
(defun odd?(n) (if (= 0 (mod n 2)) nil t ))
(defun even?(n)(not (odd? n)))
(defun second(x)(car (cdr x)))
(defun nth(x coll)
	(if (<= x 0) (throw "NTH argument must be positive")
		(if (dec x)
			(nth (- x 1) (cdr coll))
			(car coll))))

(defun pow(a b)	
	(if (= b 0)	1 
		(if (= a 0) 0
			(* a (pow a (- b 1))))))

(defun fac(n)
  (cond 
    (< n 0) (throw "Error: Argument is negative!")
    (= n 0) 1
    (<= n 2) n
    & (* n (fac (- n 1)))))

(def Math (hash 
	:PI 3.1414 
	:E 2.7192
	:pow pow 
	:fac fac ))

(defun average(count)
  (let (sum (reduce + (range count))) 
    (do
    	(log (str "count is " count " and sum is " sum))
    	(/ sum count))))

(defun some?(fn arr)
	(let (res (filter fn arr))
		(pos? (length res))))

(defun every?(fn arr)
	(let (res (filter fn arr))
		(eq? (length arr) 
			(length res))))

;macro of dotimes
(defun dotimes(times fn)
	(let (count (range times) f '(fn))
		(each ~(fn) count)))

(def Vector2D (hash 
	:new (lambda(x y) (hash :x x :y y))

	:sum (lambda(a b)
			(let ( 	nx (+ (get a :x) (get b :x))
			  		ny (+ (get a :y) (get b :y)))
			(hash :x nx :y ny)))))

(def Matrix (hash 
	:matrix  (lambda(m n)
	 			(let (rng (lambda(i)(range (- n 1))))
	   				(map rng (range (- m 1)))))
	:nth (lambda(mt row col) (nth (+ row 1) (nth (+ col 1) mt)))))
