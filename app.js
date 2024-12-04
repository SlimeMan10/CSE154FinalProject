'use strict';

const express = require('express');
const app = express();
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const crypto = require('crypto');
const multer = require('multer');

app.use(express.urlencoded({extended: true}));
app.use(express.json());

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

//use JSON to post as FORM does not work here
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
    } catch {
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

app.use(express.static('public'));
const PORT_NUMBER = 8000;
const PORT = process.env.PORT || PORT_NUMBER;
app.listen(PORT);