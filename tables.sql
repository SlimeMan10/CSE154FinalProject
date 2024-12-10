CREATE TABLE Users (
  username VARCHAR(50) PRIMARY KEY,
  email TEXT NOT NULL,
  salt BLOB NOT NULL,
  hash BLOB NOT NULL
);

CREATE TABLE Products (
  product_id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(5,2) NOT NULL,
  stock INT NOT NULL,
  type VARCHAR(255) NOT NULL,
);

CREATE TABLE Orders (
  order_id INT PRIMARY KEY,
  username VARCHAR(50),
  total_amount DECIMAL(5, 2) NOT NULL,
  product_id INT,
  FOREIGN KEY (username) REFERENCES Users (username) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES Products (product_id)
);

/*junction table between all the tables*/
CREATE TABLE Reviews (
  review_id INTEGER PRIMARY KEY,
  username VARCHAR(50),
  product_id INT,
  rating DECIMAL(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  average_rating DECIMAL(3,2) DEFAULT 0,
  num_ratings INT DEFAULT 0,
  FOREIGN KEY (username) REFERENCES Users(username),
  FOREIGN KEY (product_id) REFERENCES Products(product_id)
);