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
CREATE TABLE chat (
  sender VARCHAR(20),
  receiver VARCHAR(20),
  message TEXT DEFAULT NULL,
  url VARCHAR(255) DEFAULT NULL,
  title VARCHAR(255) DEFAULT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  timestamp_formatted VARCHAR(19) GENERATED ALWAYS AS (DATE_FORMAT(timestamp, '%d-%m-%Y %H:%i')) STORED,
  FOREIGN KEY (sender) REFERENCES users(username),
  FOREIGN KEY (receiver) REFERENCES users(username)
);

CREATE TABLE friends (
  sender VARCHAR(20),
  receiver VARCHAR(20),
  message TEXT DEFAULT NULL,
  group_id INT DEFAULT NULL,
  url VARCHAR(255) DEFAULT NULL,
  title VARCHAR(255) DEFAULT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  timestamp_formatted VARCHAR(19) GENERATED ALWAYS AS (DATE_FORMAT(timestamp, '%d-%m-%Y %H:%i')) STORED,
  FOREIGN KEY (sender) REFERENCES users(username),
  FOREIGN KEY (receiver) REFERENCES users(username)
);
CREATE TABLE groupss (
  group_id INT PRIMARY KEY AUTO_INCREMENT,
  group_name VARCHAR(255) NOT NULL,
  admin VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin) REFERENCES users(username)
);
CREATE TABLE group_members (
  group_id INT,
  user_id VARCHAR(20),
  PRIMARY KEY (group_id),
  UNIQUE KEY (group_id, user_id),
  FOREIGN KEY (group_id) REFERENCES groupss(group_id),
  FOREIGN KEY (user_id) REFERENCES users(username)
);


ALTER TABLE chat ADD COLUMN group_id INT;
ALTER TABLE group_members
ADD UNIQUE INDEX unique_group_user (group_id, user_id);
ALTER TABLE chat
ADD FOREIGN KEY (sender) REFERENCES users(username) ON DELETE CASCADE,
ADD FOREIGN KEY (receiver) REFERENCES users(username) ON DELETE CASCADE;
ALTER TABLE friends
ADD CONSTRAINT fk_sender
FOREIGN KEY (sender) REFERENCES users(username)
ON DELETE CASCADE;




USE myBookshop;
SELECT * FROM users;
SELECT * FROM chat;
SELECT * FROM friends;
SELECT * FROM groupss;
SELECT * FROM group_members;


SELECT * FROM books;

INSERT INTO users (username, first_name, last_name, email, hashed_password)VALUES ('username2', 'first name', 'last name', 'email@dscsk.com', '$2b$10$zrc8kXAw.L4qDQQJa/jsiulOfIphI5B28iLI/mOzVm6xeEktoblRq');

INSERT INTO users (username, first_name, last_name, email, hashed_password)VALUES ('username', 'first name', 'last name', 'sad@ksmd.ccom', '$2b$10$CpCpRsgy8UyUF03rm/cpoedsnJnZgraxUWI32dOMjMgxrVtk9DHVy');

