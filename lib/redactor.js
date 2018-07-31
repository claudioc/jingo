#!/usr/bin/env node

/*
 * Jingo redactor module
 *
 * Copyright 2018 rcj1492 <support@collectiveacuity.com>
 * Released under the MIT license
 */

// function to redact non-public content
function redactContent (text, res, config) {
  var redactConfig = config.get('redaction')

  if (redactConfig.enabled) {
    var result, match, count, replacement, anonymous

    // test for hidden page pattern
    if (redactConfig.hiddenPage) {
      result = text.match(new RegExp(redactConfig.hiddenPage), 'm')
      if (result) {
        if (!res || !res.locals.user) {
          return ''
        } else {
          if (result.length > 1) {
            return text.replace(result[0], result[1])
          } else {
            return text
          }
        }
      }
    }

    // test for private comment patterns
    if (redactConfig.privateContent) {
      count = 0
      const privateRegex = new RegExp(redactConfig.privateContent, 'mg')
      const privateResults = text.match(privateRegex)
      if (privateResults) {
        privateResults.forEach(function (result) {
          if (privateResults.index !== undefined && count) {
            return
          }
          count += 1
          if (!res || !res.locals.user) {
            text = text.replace(result, '')
          } else {
            match = result.match(new RegExp(redactConfig.privateContent, 'm'))
            if (match.length > 1) {
              replacement = ''
              for (var j = 1; j < match.length; j++) {
                replacement += match[j]
              }
              text = text.replace(match[0], replacement)
            }
          }
        })
      }
    }

    // test for date release patterns
    if (redactConfig.futureContent) {
      count = 0
      const dateRegex = new RegExp(redactConfig.futureContent, 'mg')
      const dateResults = text.match(dateRegex)
      var dateString, yearString, monthString, dayString, hourString, contentDate
      var currentDate = new Date()
      if (dateResults) {
        dateResults.forEach(function (result) {
          if (dateResults.index !== undefined && count) {
            return
          }
          count += 1
          // construct replacement string
          anonymous = ''
          replacement = ''
          match = result.match(new RegExp(redactConfig.futureContent, 'm'))
          if (match.length < 2) {
            return
          } else if (match.length === 2) {
            anonymous = match[1]
            replacement = match[1]
          } else {
            anonymous = match[2]
            for (var j = 1; j < match.length; j++) {
              replacement += match[j]
            }
          }
          // test date of excerpt against current date and replace text
          if (!res || !res.locals.user) {
            dateString = match[0].replace(/[^\d]/g, '')
            if (dateString) {
              if (dateString.length > 3) {
                yearString = dateString.slice(0, 4)
                contentDate = new Date(yearString)
              }
              if (dateString.length > 5) {
                monthString = dateString.slice(4, 6)
                contentDate = new Date(yearString, parseInt(monthString, 10) - 1)
              }
              if (dateString.length > 7) {
                dayString = dateString.slice(6, 8)
                contentDate = new Date(yearString, parseInt(monthString, 10) - 1, dayString)
              }
              if (dateString.length > 9) {
                hourString = dateString.slice(8, 10)
                contentDate = new Date(yearString, parseInt(monthString, 10) - 1, dayString, hourString)
              }
            }
            if (dateString.length > 3 && contentDate.getTime() > currentDate.getTime()) {
              text = text.replace(result, '')
            } else {
              text = text.replace(result, anonymous)
            }
          } else {
            text = text.replace(result, replacement)
          }
        })
      }
    }

    // test for sequential section patterns
    if (redactConfig.sectionContent) {
      for (var i = 0; i < redactConfig.sectionContent.length; i++) {
        count = 0
        var sectionNumber
        var latestSection = redactConfig.sectionContent[i]
        var sectionRegex = new RegExp(latestSection.expression, 'mg')
        var sectionResults = text.match(sectionRegex)
        if (sectionResults) {
          sectionResults.forEach(function (result) {
            if (sectionResults.index !== undefined && count) {
              return
            }
            count += 1
            // construct replacement string
            anonymous = ''
            replacement = ''
            match = result.match(new RegExp(latestSection.expression, 'm'))
            if (match.length < 2) {
              return
            } else if (match.length === 2) {
              anonymous = match[1]
              replacement = match[1]
            } else {
              anonymous = match[2]
              for (var j = 1; j < match.length; j++) {
                replacement += match[j]
              }
            }
            // test numerical value of excerpt against latest value and replace text
            if (!res || !res.locals.user) {
              sectionNumber = /\d+/.exec(match[0])
              if (sectionNumber > latestSection.current) {
                text = text.replace(result, '')
              } else {
                text = text.replace(result, anonymous)
              }
            } else {
              text = text.replace(result, replacement)
            }
          })
        }
      }
    }

    return text.trim()
  } else {
    return text
  }
}

// function to add a page redirect notice to the content
function redirectContent (html, requested, redirected) {
  var redirectHtml = '<p class="redirect-info" data-redirect="' + redirected.replace(/\.md/, '') + '">"' + requested.replace(/-/g, ' ') + '" redirects here.</p>'
  var headerMatch = /(^<h1[\s\S]*?<\/h1>)/m.exec(html)
  if (headerMatch) {
    html = html.replace(headerMatch[0], headerMatch[0] + redirectHtml)
  }
  return html
}

var Redactor = {
  redact: redactContent,
  redirect: redirectContent
}

module.exports = Redactor
