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
      if (app.locals.config.get('redaction').enabled) {
        var promiseArray = []
        var termRegex

        items.forEach(function (item) {
          if (item.trim() !== '') {
            // MOD retrieve page content and retest for search term after redaction
            const record = item.split(':')
            const nameOfPage = path.basename(record[0].replace(/\.md$/, ''))
            const searchPage = new models.Page(nameOfPage)
            promiseArray.push(searchPage.fetch().then(function () {
              const redactedContent = renderer.redact(searchPage.content, res, app.locals.config)
              termRegex = new RegExp(res.locals.term, 'i')
              if (termRegex && termRegex.exec(redactedContent) && redactedContent.includes(record.slice(2).join(''))) {
                res.locals.matches.push({
                  pageName: nameOfPage,
                  line: record[1] ? ', L' + record[1] : '',
                  text: record.slice(2).join('')
                })
              }
            }))
          }
        })

        // MOD wait for all page fetches to return
        Promise.all(promiseArray).then(function () {
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
