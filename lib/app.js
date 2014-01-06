var Git            = require('./gitmech')
  , Tools          = require('./tools')
  , Components     = require('./components');


function requireAuthentication(req, res, next) {
  if (!res.locals.user) {
    res.redirect("/login");
  } else {
    next();
  }
}

function setupRemotePush(app) {
  if (app.locals.remote != "") {
    setInterval(function() {
      Git.pull(app.locals.remote, app.locals.branch, function(err) {
        if (err) {
          console.log("Error: " + err);
        } else {
          Git.push(app.locals.remote, app.locals.branch, function(err) {
            if (err) {
              console.log("Error: " + err);
            }
          });
        }
      });
    }, app.locals.pushInterval);
  }
}


//Logic to include custom _footer, _sidebar, _script and _style.css
function customStuff(req, res, next) {

  if (null === req.url.match(/^\/auth\//) &&
      null === req.url.match(/^\/misc\//) &&
      null === req.url.match(/^\/login/)) {
    Components.sidebar(function(content) { res.locals._sidebar = content; });
    Components.footer(function(content) { res.locals._footer = content; });
  }

  res.locals._style  = Components.customStyle();
  res.locals._script = Components.customScript();

  next();
}

  
module.exports.setup = function(app, config) {
  var gitrepopath = config.jingo_gitrepo_path || process.cwd() + '/data';
  var giktsubdir = config.jingo_gitrepo_subdir || '';
  
  try {
    Git.setup(gitrepopath, giktsubdir);
  } catch(e) {
    console.log(e.message);
    process.exit(-1);
  }
  
  app.locals.Git = Git;
  app.locals.Components = Components;
  app.locals.appTitle = config.jingo_app_title || "Jingo";
  app.locals.features = config.jingo_features || {};
  
  // For backward compatibility with version < 0.5, we set markitup as the
  // default rich editor. For new installations, the default is codemirror
  if ("codemirror" in app.locals.features &&
      "markitup" in app.locals.features) {
    app.locals.features.markitup = true;
  }
  
  var refspec = config.jingo_appremote ? config.jingo_appremote.split(/\s+/) : "";
  if (!refspec) {
    app.locals.remote = "";
    app.locals.branch = "";
  } else {
    app.locals.remote = refspec[0].trim();
    app.locals.branch = refspec[1] ? refspec[1].trim() : "master";
  }
  
  app.locals.pushInterval = config.jingo_push_interval ? parseInt(config.jingo_push_interval, 10) * 1000 : 30000;
  app.locals.coalesce = function(value, def) {
    return typeof value === 'undefined' ? def : value;
  };
  
  Components.init(Git);
  
  app.use(customStuff);
  
  app.all("/pages/*", requireAuthentication);
  
  var anonread = typeof config.anonRead === 'undefined' ? true : config.anonRead;
  if (!anonread) {
    app.all("/wiki/*", requireAuthentication);
    app.all("/search", requireAuthentication);
  }
  
  var routes = require("./routes");
  app.get    ("/",                      routes.index);
  app.get    ("/wiki",                  routes.pageList);
  app.get    ("/wiki/:page",            routes.pageShow);
  app.get    ("/wiki/:page/history",    routes.pageHistory);
  app.get    ("/wiki/:page/:version",   routes.pageShow);
  app.get    ("/wiki/:page/compare/:revisions", routes.pageCompare);
  
  app.get    ("/search",                routes.search);
  
  app.get    ("/pages/new",             routes.pageNew);
  app.get    ("/pages/new/:page",       routes.pageNew);
  app.post   ("/pages",                 routes.pageCreate);
  
  app.get    ("/pages/:page/edit",      routes.pageEdit);
  app.put    ("/pages/:page",           routes.pageUpdate);
  app.del    ("/pages/:page",           routes.pageDestroy);
  
  app.post   ("/misc/preview",          routes.miscPreview);
  app.get    ("/misc/syntax-reference", routes.miscSyntaxReference);
  app.get    ("/misc/existence",        routes.miscExistence);
  
  setupRemotePush(app);
  
};
