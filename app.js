//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const exp = require("constants");
const mongoose = require("mongoose");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/UserBD", {useNewUrlParser: true});
const userSchema = {
    email: String,
    password: String
}
const User = mongoose.model("User", userSchema);


app.get("/", function(req,res){
    res.render("home");
});

app.route("/login")
.get(function(req,res){
    res.render("login");
})
.post(function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username})
    .then(function(doc){
        if(doc === null){
            console.log("User doesn't exist!");
        }else if( doc.password === password){
            console.log("User Found");
            res.render("secrets");
        }else{
            console.log("Wrong Password");
        }
        
    })
})


app.route("/register")
.get(function(req,res){
    res.render("register");
})
.post(function(req,res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    }).save();
    res.render("login");
})






app.listen(3000, ()=> console.log("Server started on Port: 3000"));
