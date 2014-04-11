var misc = require('./misc')
  , pagecomp = require('./pagecompare')
  , pageShow = require('./pageshow')
  , pageNew = require('./pagenew');


module.exports.setup = function(app) {
  app.get    ("/wiki",                  require('./pagelist').route);
  app.get    ("/wiki/:page",            pageShow.route);
  app.get    ("/wiki/:page/history",    misc.pageHistory);
  app.get    ("/wiki/:page/:version",   pageShow.route);
  app.get    ("/wiki/:page/compare/:revisions", pagecomp.route);
  
  app.get    ("/search",                require('./search').route);
  
  app.get    ("/pages/new",             pageNew.route);
  app.get    ("/pages/new/:page",       pageNew.route);
  app.post   ("/pages",                 require('./pagecreate').route);
  
  app.get    ("/pages/:page/edit",      require('./pageedit').route);
  app.put    ("/pages/:page",           require('./pageupdate').route);
  app.del    ("/pages/:page",           misc.pageDestroy);
  
  app.post   ("/misc/preview",          misc.miscPreview);
  app.get    ("/misc/syntax-reference", misc.miscSyntaxReference);
  app.get    ("/misc/existence",        misc.miscExistence);
};
