(use stdio/stdlib)

(def a (set 1 2 3))
(def b (set 4 5 6))

(defun max(a b)
	(let ( 	fa (if (list? a) (car a) a)
			fb (if (list? b) (car b) b))
		(if (>= fa fb) fa fb)))


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

(def start (coor 0 0))