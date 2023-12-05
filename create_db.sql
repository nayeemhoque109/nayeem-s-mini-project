CREATE DATABASE myBookshop;
USE myBookshop;
CREATE TABLE books (id INT AUTO_INCREMENT,name VARCHAR(50),price DECIMAL(5, 2) unsigned,PRIMARY KEY(id));
INSERT INTO books (name, price)VALUES('database book', 40.25),('Node.js book', 25.00), ('Express book', 31.99) ;
CREATE USER 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2027';
GRANT ALL PRIVILEGES ON myBookshop.* TO 'appuser'@'localhost';
CREATE TABLE users (
  username VARCHAR(20) PRIMARY KEY,
  first_name VARCHAR(20) NOT NULL,
  last_name VARCHAR(20) NOT NULL,
  email VARCHAR(50) NOT NULL,
  hashed_password VARCHAR(255) NOT NULL
);
