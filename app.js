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
const IDError = 'Yikes. ID does not exist.';
const userError = 'Yikes. User does not exist.';
const parameterError = 'Missing one or more of the required params.';
const USERERROR = 400;
const SERVERERROR = 500;

async function getDBConnection() {
 const db = await sqlite.open({filename: 'store.db', driver: sqlite3.Database});
 return db;
}

//use Form in post for this
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
   console.log("Received body:", req.body);
   let missing = [];
   if (!product_id) missing.push("product_id");
   if (!name) missing.push("name");
   if (!description) missing.push("description");
   if (!price) missing.push("price");
   if (!stock) missing.push("stock");
   if (!image) missing.push("image");
   if (!type) missing.push("type");
   console.log("Missing fields:", missing);
   res.status(USERERROR).type('text').send("Missing required product information");
 }
});

//
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

app.get("/getProducts", async function (req, res) {
 const name = req.query.name;
 const type = req.query.type;
 const minPrice = req.query.minPrice;
 try {
   const db = await getDBConnection();
   let query = "SELECT name, description, price, stock, image, type FROM Products";
   let params = [];
   if (name || type || minPrice) {
     let conditions = [];
     if (name) {
       conditions.push("LOWER(name) LIKE LOWER(?)");
       params.push(`%${name}%`);
     }
     if (type) {
       conditions.push("type = ?");
       params.push(type);
     }
     if (minPrice) {
       conditions.push("price >= ?");
       params.push(minPrice);
     }
     if (conditions.length > 0) {
       query += " WHERE " + conditions.join(" AND ");
     }
   }
   const data = await db.all(query, params);
   await db.close();
   res.json(data);
 } catch (err) {
   console.error("Error:", err);
   res.status(SERVERERROR).type('text').send("Something went wrong with our server");
 }
});



app.use(express.static('public'));
const PORT_NUMBER = 8000;
const PORT = process.env.PORT || PORT_NUMBER;
app.listen(PORT);