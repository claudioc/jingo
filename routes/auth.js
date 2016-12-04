var router = require('express').Router()
var app = require('../lib/app').getInstance()
var _ = require('lodash')
var passportLocal = require('passport-local')
var passportGoogle = require('passport-google-oauth')
var passportGithub = require('passport-github').Strategy
var tools = require('../lib/tools')

var auth = app.locals.config.get('authentication')

// Additional LDAP support only if needed
var passportLDAP
if (auth.ldap.enabled) {
  passportLDAP = require('passport-ldapauth')
}

var passport = app.locals.passport
var proxyPath = app.locals.config.getProxyPath()
var redirectURL

router.get('/login', _getLogin)
router.get('/logout', _getLogout)
router.post('/login', passport.authenticate('local', {
  successRedirect: proxyPath + '/auth/done',
  failureRedirect: proxyPath + '/login',
  failureFlash: true
}))
router.get('/auth/done', _getAuthDone)

router.get('/auth/google', passport.authenticate('google', {
  scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']
}))

router.get('/oauth2callback', passport.authenticate('google', {
  successRedirect: proxyPath + '/auth/done',
  failureRedirect: proxyPath + '/login'
}))

router.get('/auth/github', passport.authenticate('github'))
router.get('/auth/github/callback', passport.authenticate('github', {
  successRedirect: proxyPath + '/auth/done',
  failureRedirect: proxyPath + '/login'
}))

if (auth.ldap.enabled) {
  router.post('/auth/ldap', passport.authenticate('ldapauth', {
    successRedirect: proxyPath + '/auth/done',
    failureRedirect: proxyPath + '/login',
    failureFlash: true
  }))
}

if (auth.google.enabled) {
  redirectURL = auth.google.redirectURL || app.locals.baseUrl + '/oauth2callback'
  passport.use(new passportGoogle.OAuth2Strategy({
    clientID: auth.google.clientId,
    clientSecret: auth.google.clientSecret,
    // I will leave the horrible name as the default to make the painful creation
    // of the client id/secret simpler
    callbackURL: redirectURL
  },

    function (accessToken, refreshToken, profile, done) {
      usedAuthentication('google')
      done(null, profile)
    }
  ))
}

if (auth.github.enabled) {
  redirectURL = auth.github.redirectURL || app.locals.baseUrl + '/auth/github/callback'

  // Register a new Application with Github https://github.com/settings/applications/new
  // Authorization callback URL /auth/github/callback
  passport.use(new passportGithub({ // eslint-disable-line new-cap
    clientID: auth.github.clientId,
    clientSecret: auth.github.clientSecret,
    callbackURL: redirectURL
  },
    function (accessToken, refreshToken, profile, done) {
      usedAuthentication('github')
      done(null, profile)
    }
  ))
}

if (auth.ldap.enabled) {
  passport.use(new passportLDAP({ // eslint-disable-line new-cap
    server: {
      url: auth.ldap.url,
      bindDn: auth.ldap.bindDn,
      bindCredentials: auth.ldap.bindCredentials,
      searchBase: auth.ldap.searchBase,
      searchFilter: auth.ldap.searchFilter,
      searchAttributes: auth.ldap.searchAttributes
    }
  },
    function (profile, done) {
      usedAuthentication('ldap')
      done(null, profile)
    }
  ))
}

if (auth.alone.enabled) {
  passport.use(new passportLocal.Strategy(

    function (username, password, done) {
      var user = {
        displayName: auth.alone.username,
        email: auth.alone.email || ''
      }

      if (username.toLowerCase() !== auth.alone.username.toLowerCase() || tools.hashify(password) !== auth.alone.passwordHash) {
        return done(null, false, { message: 'Incorrect username or password' })
      }

      usedAuthentication('alone')

      return done(null, user)
    }
  ))
}

if (auth.local.enabled) {
  passport.use(new passportLocal.Strategy(

    function (username, password, done) {
      var wantedUsername = username.toLowerCase()
      var wantedPasswordHash = tools.hashify(password)

      var foundUser = _.find(auth.local.accounts, function (account) {
        return account.username.toLowerCase() === wantedUsername &&
            account.passwordHash.toLowerCase() === wantedPasswordHash.toLowerCase()
      })

      if (!foundUser) {
        return done(null, false, { message: 'Incorrect username or password' })
      }

      usedAuthentication('local')

      return done(null, {
        displayName: foundUser.username,
        email: foundUser.email || ''
      })
    }
  ))
}

function usedAuthentication (name) {
  for (var a in auth) {
    if (auth.hasOwnProperty(a)) {
      auth[a].used = (a === name)
    }
  }
}

passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (user, done) {
  if (user.emails && user.emails.length > 0) { // Google
    user.email = user.emails[0].value
    delete user.emails
  }

  if (!user.displayName && user.username) {
    user.displayName = user.username
  }

  // for ldap auth
  if (auth.ldap.enabled) {
    if (!user.displayName && user.uid) {
      user.displayName = user.uid
    }
    if (!user.email && user.mail) {
      user.email = user.mail
    }
  }

  if (!user.email) {
    user.email = 'jingouser'
  }

  user.asGitAuthor = user.displayName + ' <' + user.email + '>'
  done(undefined, user)
})

function _getLogout (req, res) {
  req.logout()
  req.session = null
  res.redirect(proxyPath + '/')
}

function _getAuthDone (req, res) {
  if (!res.locals.user) {
    res.redirect(proxyPath + '/')
    return
  }

  if (!auth.alone.used &&
      !auth.local.used &&
      !tools.isAuthorized(res.locals.user.email,
                          app.locals.config.get('authorization').validMatches,
                          app.locals.config.get('authorization').emptyEmailMatches)) {
    req.logout()
    req.session = null
    res.statusCode = 403
    res.end('<h1>Forbidden</h1>')
  } else {
    var dst = req.session.destination || proxyPath + '/'
    delete req.session.destination
    res.redirect(dst)
  }
}

function _getLogin (req, res) {
  req.session.destination = req.query.destination

  if (req.session.destination === '/login') {
    req.session.destination = '/'
  }

  res.locals.errors = req.flash()

  res.render('login', {
    title: app.locals.config.get('application').title,
    auth: auth
  })
}

module.exports = router
