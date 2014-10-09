var router = require("express").Router(),
    app = require("../lib/app").getInstance(),
    passportLocal = require('passport-local'),
    passportGoogle = require('passport-google-oauth'),
    passportGithub = require('passport-github').Strategy,
    tools = require("../lib/tools");

var auth = app.locals.config.get("authentication");
var passport = app.locals.passport;

router.get("/login", _getLogin);
router.get("/logout", _getLogout);
router.post("/login", passport.authenticate('local', { successRedirect: '/auth/done', failureRedirect: '/login', failureFlash: true }));
router.get("/auth/done", _getAuthDone);

router.get("/auth/google", passport.authenticate('google', {
  scope: ['https://www.googleapis.com/auth/userinfo.email'] }
));
router.get("/oauth2callback", passport.authenticate('google', {
  successRedirect: '/auth/done',
  failureRedirect: '/login'
}));

router.get("/auth/github", passport.authenticate('github'));
router.get("/auth/github/callback", passport.authenticate('github', {
  successRedirect: '/auth/done',
  failureRedirect: '/login'
}));

if (auth.google.enabled) {
  passport.use(new passportGoogle.OAuth2Strategy({
      clientID: auth.google.clientId,
      clientSecret: auth.google.clientSecret,
      // I will leave the horrible name as the default to make the painful creation
      // of the client id/secret simpler
      callbackURL: app.locals.baseUrl + '/oauth2callback'
    },

    function(accessToken, refreshToken, profile, done) {
      usedAuthentication("google");
      done(null, profile);
    }
  ));
}

if (auth.github.enabled) {

  // Register a new Application with Github https://github.com/settings/applications/new
  // Authorization callback URL /auth/github/callback
  passport.use(new passportGithub({
      clientID: auth.github.clientId,
      clientSecret: auth.github.clientSecret,
      callbackURL: app.locals.baseUrl + '/auth/github/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      usedAuthentication("github");
      done(null, profile);
    }
  ));
}

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
  for (var a in auth) {
    auth[a].used = (a == name);
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

  if (!auth.alone.used && !tools.isAuthorized(res.locals.user.email, app.locals.config.get("authorization").validMatches)) {
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
    title: app.locals.config.get("application").title,
    auth: auth
  });
}

module.exports = router;
