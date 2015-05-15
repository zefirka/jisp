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


(def taked-inc (get Math :inc))
(def used (taked-inc 10));

(def a (set 1 2 3))
(def b (set 4 5 6))


(defun max(a b)
	(let ( 	fa (if (list? a) (car a) a)
			fb (if (list? b) (car b) b))
		(if (>= fa fb) fa fb)))

(defun average(count)
  (let (sum (reduce + (range count))) 
    (do
    	(log (str "count is " count " and sum is " sum))
    	(/ sum count))))

(defun test(c)
	(cond c
		1 "Arg = 1"
		2 "Arg = 2"
		& "Arg not = 1 or 2"))

(defun testc(c)
	(cond 
		(= c 1) "Arg = 1"
		(= c 2) "Arg = 2"
		& "Arg not = 1 or 2"))

(defun fac(n)
  (cond 
    (< n 0) (throw "Error: Argument is negative!")
    (= n 0) 1
    (<= n 2) n
    & (* n (fac (- n 1)))))

;; currying 
(defun addn(n)
	(lambda(x)(+ x n)))

(def add-two (addn 2))

(defun is-prime(n)
	(cond 
		(<= n 0) (throw "Error: Argument is not natural")
		(or (= n 1) 
			(= n 2)) t 		
		
		&	(let 
				( 	less (range 2 (- n 1)) 
					testfn (lambda(x) (if (= (mod n x) 0) t nil)) 
					divs (filter testfn less) )

				(if (= 0 (length divs))
					t
					nil))))

(is-prime 10)