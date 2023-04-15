require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');



const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/UserDB", {useNewUrlParser: true});
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// -------------------------------------------------HOME ROUTE--------------------------------------------
app.get("/", function(req,res){
    res.render("home");
});


// -------------------------------------------------LOGIN ROUTE--------------------------------------------
app.route("/login")
.get(function(req,res){
    res.render("login");
})
.post(function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(next(err));
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });  
});


// -------------------------------------------------SECRETS ROUTE--------------------------------------------
app.route("/secrets")
.get(function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});



// -------------------------------------------------REGISTER ROUTE--------------------------------------------
app.route("/register")
.get(function(req,res){
    res.render("register");
})
.post(function(req,res){

    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/login");
            });
        }
    });

});

// -------------------------------------------------LOGOUT ROUTE--------------------------------------------
app.get("/logout", (req,res)=>{
    req.logout(function(err){
        if(err){return next(err);}
        res.redirect('/');
    });
    
});





app.listen(3000, ()=> console.log("Server started on Port: 3000"));


