/* global Git */
var router = require('express').Router()
var renderer = require('../lib/renderer')
var fs = require('fs')
var models = require('../lib/models')
var app = require('../lib/app').getInstance() // MOD required to retrieve app configuration

models.use(Git)

router.get('/misc/syntax-reference', _getSyntaxReference)
router.post('/misc/preview', _postPreview)
router.get('/misc/existence', _getExistence)

function _getSyntaxReference (req, res) {
  res.render('syntax')
}

function _postPreview (req, res) {
  
  // MOD redact content prior to rendering
  var page_content = req.body.data
  page_content = renderer.redact(page_content, res, app.locals.config) 
  res.render('preview', {
    content: renderer.render(page_content)
  })
  
}

function _getExistence (req, res) {
  if (!req.query.data) {
    res.send(JSON.stringify({data: []}))
    return
  }

  var result = []
  var page
  var n = req.query.data.length
  const alias_map = app.locals.config.get('aliases') // MOD import aliases
  var page_name
  
  req.query.data.forEach(function (pageName, idx) {
    (function (name, index) {
      // MOD remap alias key to its associated page before retrieving page model
      page_name = name
      if (alias_map){
        var alias_name = page_name.toLowerCase()
        if (app.locals.config.get('features').caseSensitiveAliases){
          alias_name = page_name
        }
        if (alias_map[alias_name]){
          page_name = alias_map[alias_name]
        }
      }
      page = new models.Page(page_name)
      if (!fs.existsSync(page.pathname)) {
        result.push(name)
      }
      if (index === (n - 1)) {
        res.send(JSON.stringify({data: result}))
      }
    }(pageName, idx))
  })
}

router.all('*', function (req, res) {
  res.locals.title = '404 - Not found'
  res.statusCode = 404
  res.render('404.pug')
})

module.exports = router
