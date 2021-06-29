require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const ejs=require("ejs");
const mongoose=require("mongoose");
const encrypt=require("mongoose-encryption");
const app=express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine","ejs");

mongoose.connect("mongodb://localhost:27017/SecretUsersDB",{useNewUrlParser: true,useUnifiedTopology:true});

const userSchema=new mongoose.Schema({
  email:{type:String,
  required:true},
  password:{type:String,
  required:true}
});


userSchema.plugin(encrypt,{secret:process.env.ENCRY_KEY,encryptedFields:["password"]});

const User=new mongoose.model("User",userSchema);


app.get("/",function(req,res){
  res.render("home");
})
app.get("/login",function(req,res){
  res.render("login");
})
app.get("/register",function(req,res){
  res.render("register");
})
app.post("/login",function(req,res){

  User.findOne({email:req.body.username},function(err,foundUser){

    if(!err){
      if(foundUser){

        if(foundUser.password === req.body.password){
                res.render("secrets");
        }
      }

    }
    else{
      console.log(err);
    }
  })
})
app.post("/register",function(req,res){
  const user=new User({
    email:req.body.username,
    password:req.body.password
  });
  user.save(function(err){
    if(err)
{console.log("User could not be registerd");
res.render}
else{
  //console.log("Registered");
  res.render("secrets");
} })
})
app.listen(3000,function(){
  console.log("Server started at 3000 port");
})
