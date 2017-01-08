/* global Git */

var router = require('express').Router()
var path = require('path')
var corsEnabler = require('../lib/cors-enabler')
var models = require('../lib/models')

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
    })
  }

  function renderResults () {
    res.render('search', {
      title: 'Search results'
    })
  }
}

module.exports = router
