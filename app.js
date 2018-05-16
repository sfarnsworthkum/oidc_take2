var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const session = require("express-session");
const { ExpressOIDC } = require("@okta/oidc-middleware");

const indexRouter = require("./routes/index");
const dashboardRouter = require("./routes/dashboard");
const registerRouter = require("./routes/register");
const resetPassword = require("./routes/reset-password");
var bodyParser = require('body-parser');

var app = express();

const oidc = new ExpressOIDC({
  issuer: `${process.env.ORG_URL}/oauth2/default`,
  client_id: process.env.CLIENT_ID,
  client_secret: process.env.CLIENT_SECRET,
  redirect_uri: `${process.env.HOST_URL}/authorization-code/callback`,
  scope: "openid profile"
});

// Put these statements before you define any routes.
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(logger("dev"));
app.use(express.json());
//app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.APP_SECRET,
    resave: true,
    saveUninitialized: false
  })
);

app.use(oidc.router);
app.use("/", indexRouter);
app.use("/register", registerRouter);
app.use("/reset-password", resetPassword);
app.use("/dashboard", oidc.ensureAuthenticated(), dashboardRouter);
app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = { app, oidc };
