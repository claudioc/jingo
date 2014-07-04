#!/usr/bin/env node

/*
 * Jingo, wiki engine
 * http://github.com/claudioc/jingo
 *
 * Copyright 2014 Claudio Cicali <claudio.cicali@gmail.com>
 * Released under the MIT license
 */

var express        = require('express')
  , path           = require('path')
  , components     = require('./components')
  , favicon        = require('serve-favicon')
  , compress       = require("compression")
  , session        = require("express-session")
  , bodyParser     = require('body-parser')
  , expValidator   = require('express-validator')
  , cookieParser   = require('cookie-parser')
  , logger         = require("morgan")
  , cookieSession  = require('cookie-session')
  , gravatar       = require('gravatar')
  , passport       = require('passport')
  , methodOverride = require('method-override')
  , flash          = require('express-flash')
;

var app;

module.exports.getInstance = function() {
  return app;
};

module.exports.initialize = function(config, auth) {

  app = express();

  app.locals.features = config.get("features", {});
  app.locals.port = config.get("server.port", process.env.PORT || 6067);
  app.locals.hostname = config.get("server.hostname", "localhost");
  app.locals.authorization = config.get("authorization", { anonRead: false, validMatches: ".+" });
  app.locals.appTitle = config.get("application.title", "Jingo");
  app.locals.secret = config.get("application.secret", "jingo-secret-67");
  app.locals.authentication = auth;

  // For backward compatibility with version < 0.5, we set markitup as the
  // default rich editor. For new installations, the default is codemirror
  if (typeof app.locals.features.codemirror == 'undefined' &&
      typeof app.locals.features.markitup == 'undefined') {
    app.locals.features.markitup = true;
  }

  // This should never happen, of course
  if (app.locals.features.markitup &&
      app.locals.features.codemirror) {
    app.locals.features.markitup = false;
  }

  // View helpers
  app.use(function (req, res, next) {
    res.locals = {
      get user() {
        return req.user;
      },
      get appTitle() {
        return app.locals.appTitle;
      },
      get authentication() {
        return app.locals.authentication;
      },
      isAnonymous: function () {
        return !req.user;
      },
      canSearch: function () {
        return !!req.user || app.locals.authorization.anonRead;
      },
      gravatar: function(email) {
        return gravatar;
      }
    };
    next();
  });

  var refspec = config.get("application.remote") ? config.get("application.remote").split(/\s+/) : "";
  if (!refspec) {
    app.locals.remote = "";
    app.locals.branch = "";
  } else {
    app.locals.remote = refspec[0].trim();
    app.locals.branch = refspec[1] ? refspec[1].trim() : "master";
  }

  app.locals.pushInterval = config.get("application.pushInterval") ? parseInt(config.get("application.pushInterval"), 10) * 1000 : 30000;
  app.locals.coalesce = function(value, def) {
    return typeof value === 'undefined' ? def : value;
  };

  app.locals.pretty = true; // Pretty HTML output from Jade

  app.locals.hasSidebar = components.hasSidebar;
  app.locals.hasFooter = components.hasFooter;
  app.locals.hasCustomStyle = components.hasCustomStyle;
  app.locals.hasCustomScript = components.hasCustomScript;
  app.locals.hasFeature = function(feature) {
    return !!app.locals.features[feature];
  };

  app.enable('trust proxy');
  app.use(logger({format: "dev", skip: function() { }}));
  app.use(favicon("public/favicon.ico"));
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(methodOverride(function(req, res){
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  }));

  app.use(express.static(path.join(__dirname + "/../", 'public')));
  app.use(cookieParser());
  app.use(cookieSession({ keys: ["boxedo"], cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }}));
  app.use(session({ name: "jingosid", 
                    secret: app.locals.secret, 
                    cookie: { httpOnly: true },
                    saveUninitialized: true,
                    resave: true
                  }));
  app.use(flash());
  app.use(expValidator());

  app.set('views', __dirname + '/../views');
  app.set('view engine', 'jade');

  app.use(function (req, res, next) {

    if (null === req.url.match(/^\/auth\//) &&
        null === req.url.match(/^\/misc\//) &&
        null === req.url.match(/^\/login/)) {
      components.sidebar(function(content) { res.locals._sidebar = content; });
      components.footer(function(content) { res.locals._footer = content; });
    }

    res.locals._style  = components.customStyle();
    res.locals._script = components.customScript();

    next();
  });

  app.use(passport.initialize());
  app.use(passport.session());

  app.locals.passport = passport;

  function requireAuthentication(req, res, next) {
    if (!res.locals.user) {
      res.redirect("/login");
    } else {
      next();
    }
  }

  app.all("/pages/*", requireAuthentication);

  if (!app.locals.authorization.anonRead) {
    app.all("/wiki/*", requireAuthentication);
    app.all("/search", requireAuthentication);
  }

  app.use(require("../routes/wiki"))
     .use(require("../routes/pages"))
     .use(require("../routes/search"))
     .use(require("../routes/auth"))
     .use(require("../routes/misc"));

  return app;
}
