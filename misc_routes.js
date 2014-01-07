/*
 * GET Login page.
 */
exports.login = function(req, res) {

  req.session.destination = req.query.destination; // (req.headers.referer ? Url.parse(req.headers.referer).path : null);

  if (req.session.destination == '/login') {
    req.session.destination = '/';
  }

  res.locals.errors = req.flash();

  res.render('login', {
    title: app.locals.appTitle,
    auth: app.locals.authentication
  });
};

exports.authDone = function(req, res) {

  if (!res.locals.user) {
    res.redirect("/");
    return;
  }

console.log(req.session.destination);
  if (!app.locals.authentication.alone.used && !Tools.isAuthorized(res.locals.user.email, app.locals.authorization.validMatches)) {
    req.logout();
    req.session = null;
    res.statusCode = 403;
    res.end('<h1>Forbidden</h1>');
  } else {
    var dst = req.session.destination || "/";
    delete req.session.destination;
    res.redirect(dst);
  }
};

exports.logout = function(req, res) {
  req.logout();
  req.session = null;
  res.redirect('/');
};

error404 = exports.error404 = function(req, res) {
  res.locals.title = "404 - Not found";
  res.statusCode = 404;
  res.render('404.jade');
};

error500 = exports.error500 = function(req, res, message) {
  res.locals.title = "500 - Internal server error";
  res.statusCode = 500;
  res.render('500.jade', {
    error: message
  });
};
