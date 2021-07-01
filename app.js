require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const findOrCreate=require("mongoose-findorcreate");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy=require("passport-facebook").Strategy;
const app = express();


//Authentication through passport,
// Important: Follow the order of below line of code
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");

//const md5=require("md5");
//const bcrypt = require("bcrypt");
//const saltRounds = 10;


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.set("view engine", "ejs");

// Important: Follow the order of below line of code.It should be below alll the app.use()

app.use(session({
  secret:"our litte secret",
  resave:false,
  saveUninitialized:false,

}))

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/SecretUsersDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true

});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  googleId:String,
  facebookId:String
});


//userSchema.plugin(encrypt,{secret:process.env.ENCRY_KEY,encryptedFields:["password"]});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

// use static serialize and deserialize of model for passport session support
passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

//AUTHENTICATION THROUGH Google OAUTH
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://localhost:3000/auth/facebook/secret"
  },
  function(accessToken, refreshToken, profile, done) {
    User.findOrCreate({ facebookId: profile.id }, function(err, user) {
      if (err) { return done(err); }
      done(null, user);
    });
  }
));
//Hash Function
app.get("/", function(req, res) {
  res.render("home");
});
  app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));

    app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect('/secrets');
    });

app.get("/auth/facebook",
passport.authenticate("facebook"));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { successRedirect: '/secrets',
                                      failureRedirect: '/login' }));


app.get("/login", function(req, res) {
  res.render("login");
})
app.get("/register", function(req, res) {
  res.render("register");
})
//Below is the code for hashing and salting bcrypt
// app.post("/login", function(req, res) {
//
//   User.findOne({
//     email: req.body.username
//   }, function(err, foundUser) {
//
//     if (!err) {
//       if (foundUser) {
//         bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
//           if (result === true) {
//             res.render("secrets");
//           }
//
//         })
//
//       }
//
//     } else {
//       console.log(err);
//     }
//   })
// })
// app.post("/register", function(req, res) {
//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     const user = new User({
//       email: req.body.username,
//       password: hash
//     });
//
//     user.save(function(err) {
//       if (err) {
//         console.log("User could not be registerd");
//         res.render
//       } else {
//         //console.log("Registered");
//         res.render("secrets");
//       }
//     })
//   })
//
// })
//Below is the code for authentication using passport
app.get("/logout",function(req,res){
  req.logout();
  res.render("home");
});

app.get("/secrets",function(req,res){
  //console.log(req)
  if(req.isAuthenticated()){
  res.render("secrets");
  }else{
    res.redirect("/login")
  }
});

app.post("/register",function(req,res){
registerUser=new User({username: req.body.username});
  User.register(registerUser,req.body.password,function(err,user){

    if(!err){
        passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
        })

    }
    else{
      console.log(err)
      res.redirect("/register");
    }
  })
})
app.post("/login",function(req,res){
const user= new User({
  username:req.body.username,
password: req.body.password
});
req.login(user,function(err){
  if(err){
    console.log(err);
    res.redirect("/login");
  }
  else{
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    })
  }
})
})

app.listen(3000, function() {
  console.log("Server started at 3000 port");
})
