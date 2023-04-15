require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");



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
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id); 
});
passport.deserializeUser(async(id, done)=>{
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, false);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// ------------------------------------------------HOME ROUTE--------------------------------------------
app.get("/", function(req,res){
    res.render("home");
});


// -----------------------------------------AUTH/GOOGLE ROUTE--------------------------------------------
app.get("/auth/google",
    passport.authenticate("google", {scope: ["profile"]})
);


// ---------------------------------AUTH/GOOGLE/CALLBACK ROUTE--------------------------------------------
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect Secrets.
    res.redirect('/secrets');
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
.get(async function(req,res){
    if(req.isAuthenticated()){
            await User.find({"secret": {$ne:null}})
            .then(foundUsers =>{
                res.render("secrets", {usersWithSecrets: foundUsers});
            }).catch(err=> console.log(err));
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


// -------------------------------------------------SUBMIT ROUTE--------------------------------------------
app.route("/submit")
.get((req,res)=>{
    if (req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})
.post(async(req,res)=>{
    const submittedSecret = req.body.secret;
    await User.findById(req.user.id)
    .then((foundUser)=>{
        foundUser.secret = submittedSecret;
        foundUser.save();
        // console.log(foundUser);
        res.redirect("/secrets");
    }).catch(error=> console.log(error));
});


// -------------------------------------------------LOGOUT ROUTE--------------------------------------------
app.get("/logout", (req,res)=>{
    req.logout(function(err){
        if(err){return next(err);}
        res.redirect('/');
    });   
});


app.listen(3000, ()=> console.log("Server started on Port: 3000"));


