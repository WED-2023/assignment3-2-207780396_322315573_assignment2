// require("dotenv").config();
// //#region express configures
// var express = require("express");
// var path = require("path");
// var logger = require("morgan");
// const session = require("client-sessions");
// const DButils = require("./routes/utils/DButils");
// var cors = require('cors')

// var app = express();
// app.use(logger("dev")); //logger
// app.use(express.json()); // parse application/json

// // תיקון CORS - הגדרה אחת ויחידה שעובדת עם credentials
// const corsConfig = {
//   origin: [
//     "http://localhost:8080", 
//     "http://192.168.56.1:8080",
//     "http://127.0.0.1:8080"
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
//   exposedHeaders: ['Set-Cookie']
// };

// app.use(cors(corsConfig));
// app.options("*", cors(corsConfig));

// app.use(
//   session({
//     cookieName: "session", // the cookie key name
//     //secret: process.env.COOKIE_SECRET, // the encryption key
//     secret: "template", // the encryption key
//     duration: 24 * 60 * 60 * 1000, // expired after 24 hours
//     activeDuration: 1000 * 60 * 5, // if expiresIn < activeDuration,
//     cookie: {
//       httpOnly: false,
//       secure: false, // חשוב! false ל-HTTP development
//       sameSite: 'lax' // מאפשר cross-origin cookies
//     }
//     //the session will be extended by activeDuration milliseconds
//   })
// );

// app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
// app.use(express.static(path.join(__dirname, "public"))); //To serve static files such as images, CSS files, and JavaScript files
// //local:
// app.use(express.static(path.join(__dirname, "dist")));
// //remote:
// // app.use(express.static(path.join(__dirname, '../assignment-3-3-frontend/dist')));

// app.get("/",function(req,res)
// { 
//   //remote: 
//   // res.sendFile(path.join(__dirname, '../assignment-3-3-frontend/dist/index.html'));
//   //local:
//   res.sendFile(__dirname+"/index.html");
// });

// var port = process.env.PORT || "3000"; //local=3000 remote=3000
// //#endregion
// const user = require("./routes/user");
// const recipes = require("./routes/recipes");
// const auth = require("./routes/auth");

// //#region cookie middleware
// app.use(function (req, res, next) {
//   if (req.session && req.session.user_id) {
//     DButils.execQuery("SELECT user_id FROM users")
//       .then((users) => {
//         if (users.find((x) => x.user_id === req.session.user_id)) {
//           req.user_id = req.session.user_id;
//         }
//         next();
//       })
//       .catch((error) => next());
//   } else {
//     next();
//   }
// });
// //#endregion

// // ----> For cheking that our server is alive
// app.get("/alive", (req, res) => res.send("I'm alive"));

// // Routings
// app.use("/users", user);
// app.use("/recipes", recipes);
// app.use("/", auth);

// // Default router
// app.use(function (err, req, res, next) {
//   console.error(err);
//   res.status(err.status || 500).send({ message: err.message, success: false });
// });

// const server = app.listen(port, () => {
//   console.log(`Server listen on port ${port}`);
// });

// process.on("SIGINT", function () {
//   if (server) {
//     server.close(() => console.log("server closed"));
//   }
//   process.exit();
// });


require("dotenv").config();
//#region express configures
var express = require("express");
var path = require("path");
var logger = require("morgan");
const session = require("client-sessions");
const DButils = require("./routes/utils/DButils");
var cors = require('cors')

var app = express();
app.use(logger("dev")); //logger
app.use(express.json()); // parse application/json

// תיקון CORS - הגדרה אחת ויחידה שעובדת עם credentials
const corsConfig = {
  origin: [
    "http://localhost:8080", 
    "http://192.168.56.1:8080",
    "http://127.0.0.1:8080"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

app.use(
  session({
    cookieName: "session", // the cookie key name
    //secret: process.env.COOKIE_SECRET, // the encryption key
    secret: "template", // the encryption key
    duration: 24 * 60 * 60 * 1000, // expired after 24 hours
    activeDuration: 1000 * 60 * 5, // if expiresIn < activeDuration,
    cookie: {
      httpOnly: false,
      secure: false, // חשוב! false ל-HTTP development
      sameSite: 'lax', // שינוי מ-none ל-lax
      domain: undefined, // אל תגדיר domain ספציפי
      path: '/'  // זמין לכל הpaths
    }
  })
);

app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, "public"))); //To serve static files such as images, CSS files, and JavaScript files
//local:
app.use(express.static(path.join(__dirname, "dist")));

app.get("/",function(req,res)
{ 
  res.sendFile(__dirname+"/index.html");
});

// DEBUG: הוסף logging לכל בקשה
app.use((req, res, next) => {
  console.log(`\n=== ${req.method} ${req.url} ===`);
  console.log('Session exists:', !!req.session);
  console.log('Session user_id:', req.session?.user_id);
  console.log('Cookies:', req.headers.cookie);
  
  // Manual cookie parsing
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    
    console.log('Parsed cookies:', cookies);
    
    // Manual session restoration
    if (cookies.session && !req.session.user_id) {
      try {
        const sessionData = JSON.parse(Buffer.from(decodeURIComponent(cookies.session), 'base64').toString());
        console.log('Restored session data:', sessionData);
        if (sessionData.user_id) {
          req.session.user_id = sessionData.user_id;
          console.log('Session manually restored!');
        }
      } catch (err) {
        console.log('Session restore error:', err);
      }
    }
  }
  
  next();
});

var port = process.env.PORT || "3000"; //local=3000 remote=3000
//#endregion
const user = require("./routes/user");
const recipes = require("./routes/recipes");
const auth = require("./routes/auth");

//#region cookie middleware
app.use(function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users")
      .then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
          console.log('User authenticated:', req.user_id);
        }
        next();
      })
      .catch((error) => next());
  } else {
    console.log('No session or user_id found');
    next();
  }
});
//#endregion

// ----> For cheking that our server is alive
app.get("/alive", (req, res) => res.send("I'm alive"));

// Routings
app.use("/users", user);
app.use("/recipes", recipes);
app.use("/", auth);

// Default router
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).send({ message: err.message, success: false });
});

const server = app.listen(port, () => {
  console.log(`Server listen on port ${port}`);
});

process.on("SIGINT", function () {
  if (server) {
    server.close(() => console.log("server closed"));
  }
  process.exit();
});