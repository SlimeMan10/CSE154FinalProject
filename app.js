'use strict';

//install express, sqlite3, sqlite, crypto, multer
const express = require('express');
const app = express();
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const crypto = require('crypto');
const multer = require('multer');
const upload = multer();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(upload.none())

const serverError = 'An error occurred on the server. Try again later.';
const USERERROR = 400;
const SERVERERROR = 500;

async function getDBConnection() {
 const db = await sqlite.open({filename: 'store.db', driver: sqlite3.Database});
 return db;
}

//use Form in post for this
//created this for testing to make it easier for you to check instead of writing queries in the terminal
app.post("/addProduct", async function(req, res) {
 let product_id = req.body.product_id;
 let name = req.body.name;
 let description = req.body.description;
 let price = req.body.price;
 let stock = req.body.stock;
 let image = req.body.image;
 let type = req.body.type;
 if (product_id && name && description && price && stock && image && type) {
   try {
     const query = "INSERT INTO Products (product_id, name, description, price, stock, image, type) VALUES (?, ?, ?, ?, ?, ?, ?)";
     const db = await getDBConnection();
     await db.run(query, [product_id, name, description, price, stock, image, type]);
     await db.close();
     res.json({"message": "Product added successfully"});
   } catch (err) {
     console.error("Database error:", err);
     res.status(SERVERERROR).json({"error": serverError});
   }
 } else {
   let missing = [];
   if (!product_id) missing.push("product_id");
   if (!name) missing.push("name");
   if (!description) missing.push("description");
   if (!price) missing.push("price");
   if (!stock) missing.push("stock");
   if (!image) missing.push("image");
   if (!type) missing.push("type");
   res.status(USERERROR).type('text').send("Missing required product information");
 }
});

//Additional Feature 4
app.post("/newUser", async function(req, res) {
 let username = req.body.username;
 let password = req.body.password;
 let email = req.body.email;
 if (username && password && email) {
   try {
     const query = "INSERT INTO Users (username, email, salt, hash) VALUES (?, ?, ?, ?)";
     const salt = generateSalt();
     const hashedPassword = await hashPassword(password, salt);
     const db = await getDBConnection();
     await db.run(query, [username, email, salt, hashedPassword]);
     await db.close();
     res.json({"message": "User created"});
   } catch (err) {
     res.status(SERVERERROR).json({ "error": serverError });
   }
 } else {
   res.status(USERERROR).type('text').send("Must add all parameters");
 }
});

function generateSalt() {
 return crypto.randomBytes(16);
}

function hashPassword(password, salt) {
 let hash = new Promise(function(resolve, reject) {
   crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
     if (err) {
       reject(err);
     } else {
       resolve(derivedKey);
     }
   });
 });
 return hash;
}

//use this for when loading the page and just pass in the name of the product in a JSON or Form to get the exact product
//Feature 1, 3, 5
app.get("/getProducts", async function (req, res) {
  const name = req.query.name;
  const type = req.query.type;
  const minPrice = req.query.minPrice;
  try {
    const db = await getDBConnection();
    let query = "SELECT p.name, p.description, p.price, p.stock, p.image, p.product_id, p.type, AVG(r.cumulative_rating) AS average_rating " +
                "FROM Products p " +
                "LEFT JOIN Reviews r ON r.product_id = p.product_id";
    let params = [];
    if (name || type || minPrice) {
      let conditions = [];
      if (name) {
        conditions.push("LOWER(p.name) LIKE LOWER(?)");
        params.push(`%${name}%`);
      }
      if (type) {
        conditions.push("p.type = ?");
        params.push(type);
      }
      if (minPrice) {
        conditions.push("p.price >= ?");
        params.push(minPrice);
      }
      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }
    }
    query += " GROUP BY p.product_id";
    const data = await db.all(query, params);
    await db.close();
    res.json(data);
  } catch (err) {
    console.error("Error:", err);
    res.status(SERVERERROR).type('text').send(serverError);
  }
});

//feature 2
app.post("/login", async function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    res.status(USERERROR).type('text').send("Missing username or password");
  } else {
    try {
      const query = "SELECT salt, hash FROM Users WHERE username = ?";
      const db = await getDBConnection();
      const user = await db.get(query, [username]);
      if (!user) {
        await db.close();
        res.status(USERERROR).type('text').send("User does not exist");
      } else {
        const hashedPassword = await hashPassword(password, user.salt);
        const match = crypto.timingSafeEqual(hashedPassword, user.hash);
        await db.close();
        if (match) {
          res.json({"message": "Login successful", "valid": true});
        } else {
          res.status(USERERROR).type('text').send("Password did not match the username");
        }
      }
    } catch (err) {
      res.status(SERVERERROR).type('text').send(serverError);
    }
  }
});

//Feature 4: User must be able to purchase a product
app.post("/purchase", async function(req, res) {
  const username = req.body.username;
  const product_id = req.body.product_id;
  const cost = req.body.cost;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const db = await getDBConnection();
    //let's check if we even have stock
    const stockQuery = "SELECT stock FROM Products WHERE product_id = ?";
    const stockResult = await db.get(stockQuery, [product_id]);
    if (!stockResult || stockResult.stock <= 0) {
      await db.close();
      return res.status(400).json({ error: "Product is out of stock" });
    }
    const updateStockQuery = "UPDATE Products SET stock = stock - 1 WHERE product_id = ?";
    await db.run(updateStockQuery, [product_id]);
    // Create a new order
    const confirmationCode = generateConfirmationCode();
    const insertOrderQuery = "INSERT INTO Orders (order_id, product_id, username, total_amount) VALUES (?, ?, ?, ?)";
    await db.run(insertOrderQuery, [confirmationCode, product_id, username, cost]);
    await db.close();
    res.json({ message: "Purchase successful", confirmationCode: confirmationCode });
  } catch (err) {
    console.error("Error processing purchase:", err);
    res.status(SERVERERROR).json({ error: "An error occurred while processing the purchase" });
  }
});

function generateConfirmationCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

//User must be able to access all previous transactions
app.get("/transactions", async function (req, res) {
  const username = req.body.username;
  if (!username) {
    res.status(400).json({ error: "Username is required" });
  } else {
    try {
      const db = await getDBConnection();
      const query = "SELECT o.order_id, p.name, p.description, p.price, p.image, p.product_id " +
                    "FROM Orders o " +
                    "JOIN Products p ON o.product_id = p.product_id " +
                    "WHERE o.username = ?";
      const transactions = await db.all(query, [username]);
      await db.close();
      res.json(transactions);
    } catch (err) {
      res.status(SERVERERROR).json({ error: "An error occurred while retrieving transactions" });
    }
  }
});

//Additional Feature 1: any logged in user can give feedback on 1-5
app.post("/review", async function(req, res) {
  const username = req.body.username;
  const rating = req.body.rating;
  const comment = req.body.comment;
  const product_id = req.body.product_id;

  try {
    const db = await getDBConnection();
    await db.run("BEGIN TRANSACTION");

    const insertQuery = "INSERT INTO Reviews (rating, comment, username, product_id) VALUES (?, ?, ?, ?)";
    await db.run(insertQuery, [rating, comment, username, product_id]);

    const updateQuery = "UPDATE Reviews SET total_ratings = total_ratings + 1 WHERE product_id = ?";
    await db.run(updateQuery, [product_id]);

    const numberQuery = "SELECT cumulative_rating, total_ratings FROM Reviews WHERE product_id = ?";
    const numberResult = await db.get(numberQuery, [product_id]);

    const newCumulativeRating = numberResult.cumulative_rating + rating;
    const newTotalRatings = numberResult.total_ratings;
    const averageRating = newCumulativeRating / newTotalRatings;

    const finalQuery = "UPDATE Reviews SET cumulative_rating = ? WHERE product_id = ?";
    await db.run(finalQuery, [newCumulativeRating, product_id]);

    await db.run("COMMIT");
    await db.close();

    res.json({ message: "Review added successfully" });
  } catch (err) {
    await db.run("ROLLBACK");
    res.status(SERVERERROR).type("text").send(serverError);
  }
});

app.use(express.static('public'));
const PORT_NUMBER = 8000;
const PORT = process.env.PORT || PORT_NUMBER;
app.listen(PORT);