//jshint esversion:6
require('dotenv').config();
const md5 = require("md5");
const express = require("express"),
bodyParser = require("body-parser"),
ejs =  require("ejs"),
mongoose = require("mongoose"),
encrypt = require("mongoose-encryption"),


User = require("./models/user");
const passportLocalMongoose = require("passport-local-mongoose"); // Creates Salts and Hash strings
const findOrCreate = require("mongoose-findorcreate");


const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth20').Strategy,
FacebookStrategy = require('passport-facebook').Strategy;

const app = express();

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

//Cookie session setup
//*                    */
app.use(session({
    secret: "my little secret!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/secrets", 
    passReqToCallback   : true,
    userProfileURL: ""
  },
  (request, accessToken, refreshToken, profile, done)=> {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, (err, user)=> {
      return done(err, user);
    });
  }
));



//*** SOCKET CONNECTIONS ***/
mongoose.connect(`${process.env.REMOTE_URI}`,{useNewUrlParser:true, useUnifiedTopology:true}).catch((err)=>{console.log(err)});
const port = process.env.PORT_LOCAL || process.env.PORT; // Obtain port from .env file note PORT defaults with Heroku environment
app.listen(port,console.log(`Server Started: ${port}`));
mongoose.set("useCreateIndex",true); // fixes issues with depreciation in console/debug


// //userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields: ['password']});


passport.use(User.createStrategy());

passport.serializeUser((user, done)=> {
    done(null, user.id);
  });
  
  passport.deserializeUser((id, done)=> {
    User.findById(id, (err, user)=> {
      done(err, user);
    });
  });



//*** ROUTES ***



//** GOOGLE ROUTES  */

app.get("/auth/google",passport.authenticate("google",{scope:['profile']}));

app.get("/auth/google/secrets",passport.authenticate("google",{failureRedirect: "/login"}),(req,res)=>{
    res.redirect("/secrets");
});

//** FACEBOOK ROUTES */



app.get("/",(req,res)=>{
    res.render("home");
});


app.route("/login")

.get((req,res)=>{
    res.render("login");
})

.post((req,res)=>{
    
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user,(err)=>{
        if(err) { console.err(err);
        } else {
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            });
        }
    });
});


app.route("/secrets")

    .get((req,res)=>{
        if(req.isAuthenticated()) { res.render("secrets"); 
        } else {
            res.redirect("/login");
        }
    });

app.route("/submit")
    .get((req,res)=>{
        if(req.isAuthenticated()) { 
            res.render("submit");
        } else {
            res.redirect("/login");
        }
    })
    .post((req,res)=>{
        const secret = req.body.secret;
        console.log(req.user.id); // req.user obtains a default user session (Via passport) info built into the browser cache/session

        User.findById(req.user.id,(err,foundUser)=>{
            if(err) {
                console.log(err);
            } else {
                if(foundUser) {
                    foundUser.secret = secret;
                    foundUser.save((err)=>{
                        res.redirect("/secrets");
                    });
                }
            }
        });
        
    });


app.route("/register")
    .get((req,res)=>{
        res.render("register");
    })
    .post((req,res)=>{

        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        

        User.register({username:user.username},user.password,(err,user)=>{
            if(err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req,res,()=>{
                    //res.redirect("/secrets");
                    res.json(user);
                });
            }
        });
        
    });

    //*** LOGOUT ***/
    app.route("/logout")
        .get((req,res)=>{
            req.logout();
            res.redirect("/");
        });
