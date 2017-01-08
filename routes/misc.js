/* global Git */
var router = require('express').Router()
var renderer = require('../lib/renderer')
var models = require('../lib/models')
var Promiser = require('bluebird')
var fileExists = require('../lib/file_exists')

models.use(Git)

router.get('/misc/syntax-reference', _getSyntaxReference)
router.post('/misc/preview', _postPreview)
router.get('/misc/existence', _getExistence)

function _getSyntaxReference (req, res) {
  res.render('syntax')
}

function _postPreview (req, res) {
  res.render('preview', {
    content: renderer.render(req.body.data)
  })
}

function _getExistence (req, res) {
  if (!req.query.data) {
    res.json({data: []})
    return
  }

  var result = []

  Promiser.all(req.query.data.map(function (pageName) {
    var page = new models.Page(pageName)
    return fileExists.async(page.pathname)
    .then(function (exists) {
      if (!exists) {
        result.push(pageName)
      }
    })
  }))
  .then(function () {
    res.json({data: result})
  })
}

router.all('*', function (req, res) {
  res.locals.title = '404 - Not found'
  res.statusCode = 404
  res.render('404.jade')
})

module.exports = router
