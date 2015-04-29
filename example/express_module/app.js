var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

/* Jingo setup, repository mandatory
 * If you use Jingo as a module, you will handle by yourself errors, sessions,
 *   authentication and access control (so many parameters will be set here 
 *   instead of the usual config.yaml file )
 * Optionnaly you could set a layout; it will use the parent.app render 
 *   engine (and res.locals).
 */
var jingo = require('../../jingo').init({
  application: { //note: if you don't use default parameters
    title: "Jingo As A Module",
    repository: "/home/vagrant/main/node_modules/jingo_repo"//Mandatory - to replace by the one you set
  },
  customizations:{
    layout: path.join(__dirname, 'views/layout_ext.ejs')
  }
});

var app = express();

/* view engine can be different of Jingo's one
 * Note: your layout cannot use exclusive data - like in res.render('layout', data);
 *   the data you need in this layout must be specified in res.locals (thus shared with others 
 *   views). You can nevertheless access Jingo's res.locals in your views with the 
 *   jingoLocals object.
 */
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//authentication
//to make Jingo function proper, you must fill req.user with a displayName and an email.
var isauth = true;
app.use(function(req, res, next) {
  req.user = isauth ? {
    displayName:"Gami",
    email: "gami@email.com"
  } : false;
  next();
});

app.get('/toggleauth', function(req, res){
  isauth = !isauth;
  res.redirect("/");
});

//access control
function requireAuthentication(req, res, next) {
  if (!req.user) res.redirect("/login");
  else next();
}
app.all("/pages/*", requireAuthentication);

app.get('/', function(req, res){
  res.redirect("/jingo");
});
//Jingo wiki
app.use("/jingo", jingo(app));

//any road on the parent app takes predecence on Jingo's routes, 
//here we redefine /login
app.get('/login', function(req, res){
  res.render("layout_ext", {
    title: "login",
    body: "<p>To toggle authentication, click <a href='/toggleauth'>this link</a>.</p>"
  })
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}


module.exports = app;
