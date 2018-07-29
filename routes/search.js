/* global Git */

var router = require('express').Router()
var path = require('path')
var corsEnabler = require('../lib/cors-enabler')
var models = require('../lib/models')
var renderer = require('../lib/renderer') // MOD import renderer module
var app = require('../lib/app').getInstance() // MOD import app instance for config

models.use(Git)

router.options('/search', corsEnabler)
router.get('/search', corsEnabler, _getSearch)

function _getSearch (req, res) {
  var record

  res.locals.matches = []

  if (req.query.term) {
    res.locals.term = req.query.term.trim()
  } else {
    res.locals.term = ''
  }

  if (res.locals.term.length === 0) {
    renderResults()
    return
  }

  if (res.locals.term.length < 2) {
    res.locals.warning = 'Search string is too short.'
    renderResults()
  } else {
    try {
      new RegExp(res.locals.term) // eslint-disable-line no-new
    } catch (e) {
      res.locals.warning = 'The format of the search string is invalid.'
      renderResults()
      return
    }

    models.pages.findStringAsync(res.locals.term).then(function (items) {
    
      // MOD run search results through redaction if enabled (slows response)
      if (app.locals.config.get('redaction').enabled){
      
          var promise_list = []
          var term_regex
          
          items.forEach(function (item) {
            if (item.trim() !== '') {
              // MOD retrieve page content and retest for search term after redaction
              const record = item.split(':')
              const page_name = path.basename(record[0].replace(/\.md$/, ''))
              const search_page = new models.Page(page_name)
              promise_list.push(search_page.fetch().then(function () {
                  const redacted_content = renderer.redact(search_page.content, res, app.locals.config)
                  if (app.locals.config.get('features').caseSensitive){
                    term_regex = new RegExp(res.locals.term)                
                  } else {
                    term_regex = new RegExp(res.locals.term, 'i')
                  }
                  if (term_regex && term_regex.exec(redacted_content)){
                    res.locals.matches.push({
                        pageName: page_name,
                        line: record[1] ? ', L' + record[1] : '',
                        text: record.slice(2).join('')
                    })
                  }
              }))
            }
          })
    
          // MOD wait for all page fetches to return
          Promise.all(promise_list).then(function(){
            renderResults()
          })
          
      } else {
      
          items.forEach(function (item) {
            if (item.trim() !== '') {
              record = item.split(':')
              res.locals.matches.push({
                pageName: path.basename(record[0].replace(/\.md$/, '')),
                line: record[1] ? ', L' + record[1] : '',
                text: record.slice(2).join('')
              })
            }
          })
    
          renderResults()
  
      }
      
    })
  }

  function renderResults () {
    res.render('search', {
      title: 'Search results'
    })
  }
}

module.exports = router
