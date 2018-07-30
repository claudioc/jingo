#!/usr/bin/env node

/*
 * Jingo redactor module
 *
 * Copyright 2018 rcj1492 <support@collectiveacuity.com>
 * Released under the MIT license
 */

var isNumber = require('is-number')

// MOD function to redact non-public content
function redactContent (text, res, config) {
    
    var redact_config = config.get('redaction')
    
    if (redact_config.enabled){
        
        var result, results, match, count, replacement, anonymous
        
        // test for hidden page pattern
        if (redact_config.hiddenPage){
            result = text.match(new RegExp(redact_config.hiddenPage), 'm')
            if (result){
                if (!res || !res.locals.user){
                    return ''
                } else {
                    if (result.length > 1){
                        return text.replace(result[0], result[1])
                    } else {
                        return text
                    }
                }
            }
        }
        
        // test for private comment patterns
        if (redact_config.privateComment){
            count = 0
            const private_regex = new RegExp(redact_config.privateComment, 'mg')
            const private_results = text.match(private_regex)
            if (private_results){
                private_results.forEach(function(result){
                    if (private_results.index !== undefined && count){
                       return
                    }
                    count += 1
                    if (!res || !res.locals.user){
                      text = text.replace(result, '')
                    } else {
                        match = result.match(new RegExp(redact_config.privateComment, 'm'))
                        if (match.length > 1) {
                            replacement = ''
                            for (var j = 1; j < match.length; j++){
                                replacement += match[j]
                            }
                            text = text.replace(match[0], replacement)
                        }
                    }
                })   
            }
        }
        
        // test for date release patterns
        if (redact_config.earliestDate){
            count = 0
            const date_regex = new RegExp(redact_config.earliestDate, 'mg')
            const date_results = text.match(date_regex)
            var date_string, year_string, month_string, day_string, hour_string, content_date
            var current_date = new Date()
            if (date_results){
                date_results.forEach(function(result){
                  if (date_results.index !== undefined && count){
                    return
                  }
                  count += 1
                  // construct replacement string
                  anonymous = ''
                  replacement = ''
                  match = result.match(new RegExp(redact_config.earliestDate, 'm'))
                  if (match.length < 2){
                    return
                  } else if (match.length == 2){
                    anonymous = match[1]
                    replacement = match[1]
                  } else {
                    anonymous = match[2]
                    for (var j = 1; j < match.length; j++){
                        replacement += match[j]
                    }
                  }
                  // test date of excerpt against current date and replace text
                  if (!res || !res.locals.user){
                      date_string = match[0].replace(/[^\d]/g, '')
                      if (date_string){
                        if (date_string.length > 3){
                            year_string = date_string.slice(0,4)
                            content_date = new Date(year_string)
                        }
                        if (date_string.length > 5){
                            month_string = date_string.slice(4,6)
                            content_date = new Date(year_string, parseInt(month_string,10) - 1)
                        }
                        if (date_string.length > 7){
                            day_string = date_string.slice(6,8)
                            content_date = new Date(year_string, parseInt(month_string,10) - 1, day_string)
                        }
                        if (date_string.length > 9){
                            hour_string = date_string.slice(8,10)
                            content_date = new Date(year_string, parseInt(month_string,10) - 1, day_string, hour_string)
                        }
                      }
                      if (date_string.length > 3 && content_date.getTime() > current_date.getTime()){
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
        if (redact_config.sequentialSections){
            for (var i = 0; i < redact_config.sequentialSections.length; i++){
                count = 0
                var section_excerpt, section_number
                var latest_section = redact_config.sequentialSections[i]
                var section_regex = new RegExp(latest_section.expression, 'mg')
                var section_results = text.match(section_regex)
                if (section_results){
                    section_results.forEach(function(result){
                      if (section_results.index !== undefined && count){
                        return
                      }
                      count += 1
                      // construct replacement string
                      anonymous = ''
                      replacement = ''
                      match = result.match(new RegExp(latest_section.expression, 'm'))
                      if (match.length < 2){
                        return
                      } else if (match.length == 2){
                        anonymous = match[1]
                        replacement = match[1]
                      } else {
                        anonymous = match[2]
                        for (var j = 1; j < match.length; j++){
                            replacement += match[j]
                        }
                      }
                      // test numerical value of excerpt against latest value and replace text
                      if (!res || !res.locals.user){
                        section_number = /\d+/.exec(match[0])
                        if (section_number > latest_section.latestValue){
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

// MOD function to add a page redirect notice to the content
function redirectContent(html, requested_page, redirected_page) {

    var redirect_html = '<p class="redirect-info" data-redirect="' + redirected_page.replace(/\.md/,'') + '">"' + requested_page.replace(/-/g, ' ') + '" redirects here.</p>'
    var header_match = /(^<h1[\s\S]*?<\/h1>)/m.exec(html)
    if (header_match){
        html = html.replace(header_match[0], header_match[0] + redirect_html)
    }
    return html

}

var Redactor = {
    redact: redactContent,
    redirect: redirectContent
}

module.exports = Redactor