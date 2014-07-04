var router = require("express").Router()
  , app = require("../lib/app").getInstance()
  , passportLocal  = require('passport-local')
  , tools = require("../lib/tools")
  ;

var auth = app.locals.authentication;
var passport = app.locals.passport;

router.get("/login", _getLogin);
router.get("/logout", _getLogout);
router.post("/login", passport.authenticate('local', { successRedirect: '/auth/done', failureRedirect: '/login', failureFlash: true }));
router.get("/auth/done", _getAuthDone);

if (auth.alone.enabled) {

  passport.use(new passportLocal.Strategy(

    function(username, password, done) {

      var user = {
        displayName: auth.alone.username,
        email: auth.alone.email || ""
      };

      if (username.toLowerCase() != auth.alone.username.toLowerCase() || tools.hashify(password) != auth.alone.passwordHash) {
        return done(null, false, { message: 'Incorrect username or password' });
      }

      usedAuthentication("alone");

      return done(null, user);
    }
  ));
}

function usedAuthentication(name) {
  for (var a in app.locals.authentication) {
    app.locals.authentication[a].used = (a == name);
  }
}

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  if (user.emails && user.emails.length > 0) { // Google
    user.email = user.emails[0].value;
    delete user.emails;
  }
  user.asGitAuthor = user.displayName + " <" + user.email + ">";
  done(undefined, user);
});

function _getLogout(req, res) {
  req.logout();
  req.session = null;
  res.redirect('/');
}

function _getAuthDone(req, res) {

  if (!res.locals.user) {
    res.redirect("/");
    return;
  }

  if (!auth.alone.used && !tools.isAuthorized(res.locals.user.email, auth.validMatches)) {
    req.logout();
    req.session = null;
    res.statusCode = 403;
    res.end('<h1>Forbidden</h1>');
  } else {
    var dst = req.session.destination || "/";
    delete req.session.destination;
    res.redirect(dst);
  }
}

function _getLogin(req, res) {

  req.session.destination = req.query.destination;

  if (req.session.destination == '/login') {
    req.session.destination = '/';
  }

  res.locals.errors = req.flash();

  res.render('login', {
    title: res.locals.appTitle,
    auth: res.locals.authentication
  });
}


/*
app.get    ("/auth/google",    passport.authenticate('google', {
  scope: ['https://www.googleapis.com/auth/userinfo.email'] }
));
app.get    ("/oauth2callback",    passport.authenticate('google', { successRedirect: '/auth/done', failureRedirect: '/login' }));
*/

module.exports = router;
