var cors = require('cors')
var app = require('./app').getInstance()

var corsConfig = {
  origin: function (origin, cb) {
    var cfg = app.locals.config.get('server').CORS
    var allowed = !!(cfg && cfg.enabled && (origin === cfg.allowedOrigin || cfg.allowedOrigin === '*'))
    cb(null, allowed)
  },
  methods: ['GET']
}

module.exports = cors(corsConfig)
