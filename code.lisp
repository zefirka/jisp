(defun inc(x)(+ x 1))
(defun dec(x)(- x 1))
(defun second(x)(car (cdr x)))
(defun nth(x coll)
	(if x
		(nth (- x 1) (cdr coll))
		(car coll)))

(defun odd?(n) (if (= 0 (mod n 2)) nil t ))
(defun even?(n)(not odd? n))
(defun Math-Constants 
	(hash 
		:PI 3.1414 
		:E 2.7192 ))

(def a (set 1 2 3))
(def b (set 4 5 6))
(log (apply add (a 7 8 9)))
(log (apply remove (a 1 2)))

(def factorial (lambda(n)
	(if (<= n 2) 
		n 
		(* n (factorial (- n 1))))))

(defun pow(a b)	
	(if (= b 0)	1 
		(if (= a 0) 0
			(* a (pow a (- b 1))))))