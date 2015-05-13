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

(def factorial (lambda(n)
	(if (<= n 2) 
		n 
		(* n (factorial (- n 1))))))

(def Math (hash 
	:PI 3.1414 
	:E 2.7192
	:inc (lambda(x)(+ x 1)) ))

(def a (set 1 2 3))
(def b (set 4 5 6))


(defun max(a b)
	(let ( 	fa (if (list? a) (car a) a)
			fb (if (list? b) (car b) b))
		(if (>= fa fb) fa fb)))

(defun average(lst)
	(/ (reduce + lst) (length lst)))
