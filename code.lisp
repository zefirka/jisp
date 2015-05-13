(defun inc(x)(+ x 1))
(defun dec(x)(- x 1))
(defun second(x)(car (cdr x)))
(defun nth(x coll)
	(if x
		(nth (- x 1) (cdr coll))
		(car coll)))

(defun odd?(n) (if (= 0 (% n 2)) nil t ))