#!/usr/bin/env node

/*
 * Jingo, wiki engine
 * http://github.com/claudioc/jingo
 *
 * Copyright 2014 Claudio Cicali <claudio.cicali@gmail.com>
 * Released under the MIT license
 */

var express        = require("express"),
    path           = require("path"),
    components     = require("./components"),
    wikiStatic     = require("./wikistatic"),
    favicon        = require("serve-favicon"),
    compress       = require("compression"),
    session        = require("express-session"),
    bodyParser     = require("body-parser"),
    expValidator   = require("express-validator"),
    cookieParser   = require("cookie-parser"),
    logger         = require("morgan"),
    program = require('commander'),
    cookieSession  = require("cookie-session"),
    gravatar       = require("gravatar"),
    passport       = require("passport"),
    methodOverride = require("method-override"),
    flash          = require("express-flash")
;

var app;

module.exports.getInstance = function() {
  if (!app) {
    throw new Error("Cannot get an instance of an unitialized App");
  }
  return app;
};

module.exports.initialize = function(config) {

  app = express();

  app.locals.config = config;

  app.locals.baseUrl = "//" + config.get("server").hostname + ":" + config.get("server").port;

  if (config.get("server").baseUrl == "") {
    app.locals.baseUrl = "//" + config.get("server").hostname + ":" + config.get("server").port;
  } else {
    app.locals.baseUrl = config.get("server").baseUrl;
  }

  // View helpers
  app.use(function (req, res, next) {
    res.locals = {
      get user() {
        return req.user;
      },
      get appTitle() {
        return config.get("application").title;
      },
      get jingoVersion() {
        return program.version();
      },
      get authentication() {
        return config.get("authentication");
      },
      isAnonymous: function () {
        return !req.user;
      },
      canSearch: function () {
        return !!req.user || app.locals.config.get("authorization").anonRead;
      },
      gravatar: function(email) {
        return gravatar;
      }
    };
    next();
  });

  app.locals.coalesce = function(value, def) {
    return typeof value === 'undefined' ? def : value;
  };

  app.locals.pretty = true; // Pretty HTML output from Jade

  app.locals.hasSidebar = components.hasSidebar;
  app.locals.hasFooter = components.hasFooter;
  app.locals.hasCustomStyle = components.hasCustomStyle;
  app.locals.hasCustomScript = components.hasCustomScript;
  app.locals.hasFeature = function(feature) {
    return !!app.locals.config.get("features")[feature];
  };

  if (components.hasCustomStyle()) {
    console.log("Using custom style " + config.get('customizations')['style']);
  }

  if (components.hasCustomScript()) {
    console.log("Using custom script "  + config.get('customizations')['script']);
  }

  app.enable('trust proxy');
  if (config.get("application").loggingMode) {
    app.use(logger(config.get("application").loggingMode == 1 ? "combined" : "dev", {skip: function() { }}));
  }
  app.use(favicon(path.join(__dirname + "/../", 'public', 'favicon.ico')))
  app.use(bodyParser.urlencoded({extended: true, limit: "500kb"}));
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
  app.use(cookieSession({ keys: ["jingo"], cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }}));
  app.use(session({ name: "jingosid",
                    secret: config.get("application").secret,
                    cookie: { httpOnly: true },
                    saveUninitialized: true,
                    resave: true
                  }));
  app.use(flash());
  app.use(expValidator());

  app.set('views', __dirname + '/../views');
  app.set('view engine', 'jade');

  app.use(function (req, res, next) {

    res.locals._style  = components.customStyle();
    res.locals._script = components.customScript();

    if ( /^\/auth\//.test(req.url) ||
         /^\/misc\//.test(req.url) ||
         (/^\/login/.test(req.url) && !config.get('authorization').anonRead)
       ) {
      return next();
    }

    components.sidebarAsync().then(function(content) {
      res.locals._sidebar = content;
      return components.footerAsync();
    }).then(function(content) {
      res.locals._footer = content;
      return next();
    }).catch(function(e) {
      console.log(e);
    });
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

  if (!app.locals.config.get("authorization").anonRead) {
    app.all("/wiki/*", requireAuthentication);
    app.all("/search", requireAuthentication);
  }

  app.use("/wiki", wikiStatic.configure());

  app.use(require("../routes/wiki"))
     .use(require("../routes/pages"))
     .use(require("../routes/search"))
     .use(require("../routes/auth"))
     .use(require("../routes/misc"));

  // Server error
  app.use(function(err, req, res, next) {
    res.locals.title = "500 - Internal server error";
    res.statusCode = 500;
    console.log(err);
    res.render('500.jade', {
      message: "Sorry, something went wrong and I cannot recover. If you think this might be a bug in Jingo, please file a detailed report about what you were doing here: https://github.com/claudioc/jingo/issues . Thank you!",
      error: err
    });
  });

  return app;
};
