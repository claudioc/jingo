/*
 * Jingo, wiki engine
 * http://github.com/claudioc/jingo
 *
 * Copyright 2013 Claudio Cicali <claudio.cicali@gmail.com>
 * Released under the MIT license
 */

var express        = require('express')
  , http           = require('http')
  , path           = require('path')
  , passport       = require('passport')
  , Fs             = require('fs')
  , expValidator   = require('express-validator')
  , GoogleStrategy = require('passport-google').Strategy
  , LocalStrategy  = require('passport-local').Strategy
  , Flash          = require('connect-flash')
  , program        = require('commander')
  , jingo          = require('./lib/app');

program.version('0.5.1');

Fs.readFile('config.json', function (err, data) {
  var conf = {};
  try {
    conf = JSON.parse(data);
  } catch(e) {
    console.warn(e.message);
  }
  setupApp(conf);
});

function setupApp(config) {

// Global variables to be accessed from the routes module
var app = global.app = express();

var auth = app.locals.authentication = config.authentication ||
    { google: { enabled: true }, alone: { enabled: false } };

  app.locals.port = config.server_port || process.env.PORT || 6067;
  app.locals.hostname = config.server_hostname || process.env.HOSTNAME || "localhost";
  // baseUrl is used as the public url
  app.locals.baseUrl = config.server_baseurl || ("http://" + app.locals.hostname + ":" + app.locals.port);
  app.locals.authorization = config.jingo_authorization || { anonRead: false, validMatches: ".+" };
  app.locals.secret = config.jingo_secret || "jingo-secret-67";

  app.configure(function() {
    app.use(express.errorHandler());
    app.set('port', app.locals.port);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.locals.pretty = true; // Pretty HTML output from Jade
    app.use(express.favicon());
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(express.logger('default'));
    app.use(express.cookieParser(app.locals.secret));
    app.use(express.cookieSession({ secret: "jingo-" + app.locals.secret, cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }})); // a Month
    app.use(express.bodyParser());
    app.use(expValidator());
    app.use(express.methodOverride());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(Flash());

    jingo.setup(app, config);

    app.use(app.router);
});

  /*
   * Passport configuration
   */
  passport.use(new GoogleStrategy({
      returnURL: app.locals.baseUrl + '/auth/google/return',
      realm: app.locals.baseUrl
    },

    function(identifier, profile, done) {
      usedAuthentication("google");
      done(undefined, profile);
    }
  ));

	passport.use(new LocalStrategy(

    function(username, password, done) {

      var user = {
        displayName: auth.alone.username,
        email: auth.alone.email || ""
      };

      var Crypto = require('crypto');

      function hashify(str) {
        var shasum = Crypto.createHash('sha1');
        shasum.update(str);
        return shasum.digest('hex');
      }

      if (username.toLowerCase() != auth.alone.username.toLowerCase() ||
          hashify(password) != auth.alone.passwordHash) {
        return done(null, false, { message: 'Incorrect username or password' });
      }

      usedAuthentication("alone");

      return done(null, user);
    }
  ));

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

  function usedAuthentication(name) {
    for (var a in app.locals.authentication) {
      app.locals.authentication[a].used = (a == name);
    }
  }

  app.get("/", function(req, res) { res.redirect('/wiki/home'); });

  var routes = require("./misc_routes");

  app.post   ("/login",                 passport.authenticate('local', { successRedirect: '/auth/done', failureRedirect: '/login', failureFlash: true }));
  app.get    ("/login",                 routes.login);
  app.get    ("/logout",                routes.logout);

  app.get    ("/auth/google",           passport.authenticate('google'));
  app.get    ("/auth/google/return",    passport.authenticate('google', { successRedirect: '/auth/done', failureRedirect: '/login' }));
  app.get    ("/auth/done",             routes.authDone);

  app.all('*', routes.error404);

  var addr = config.listenaddr || process.env.NW_ADDR || "";

  http.createServer(app).listen(app.get('port'), addr, function(){
    console.log((new Date()) + " - Jingo server v%s listening on %s:%s", program.version(), addr, app.get('port'));
  });
}
