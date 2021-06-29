require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const app = express();
//const md5=require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/SecretUsersDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
});


//userSchema.plugin(encrypt,{secret:process.env.ENCRY_KEY,encryptedFields:["password"]});

const User = new mongoose.model("User", userSchema);

//Hash Function
app.get("/", function(req, res) {
  res.render("home");
})
app.get("/login", function(req, res) {
  res.render("login");
})
app.get("/register", function(req, res) {
  res.render("register");
})
app.post("/login", function(req, res) {

  User.findOne({
    email: req.body.username
  }, function(err, foundUser) {

    if (!err) {
      if (foundUser) {
        bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
          if (result === true) {
            res.render("secrets");
          }

        })

      }

    } else {
      console.log(err);
    }
  })
})
app.post("/register", function(req, res) {
  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const user = new User({
      email: req.body.username,
      password: hash
    });

    user.save(function(err) {
      if (err) {
        console.log("User could not be registerd");
        res.render
      } else {
        //console.log("Registered");
        res.render("secrets");
      }
    })
  })

})
app.listen(3000, function() {
  console.log("Server started at 3000 port");
})
