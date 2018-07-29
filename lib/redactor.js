var isNumber = require('is-number')

// MOD function to redact non-public content
function redactContent (text, res, config) {
    
    var redact_config = config.get('redaction')
    
    if (redact_config.enabled){
        
        var result
        var results
        
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
        
        // test for private excerpts pattern
        if (redact_config.privateSection){
            var replacement, start_result, cropped_match, end_result
            var private_pattern = redact_config.privateSection + '([\\s\\S]*?)' + redact_config.endRedaction
            results = text.match(new RegExp(private_pattern, 'mg'))
            if (results){
                results.forEach(function(result){
                  if (!res || !res.locals.user){
                    text = text.replace(result, '')
                  } else {
                    replacement = ''
                    start_result = result.match(new RegExp(redact_config.privateSection, 'm'))
                    if (start_result.length > 1){
                        replacement += start_result[1]
                    } else {
                        replacement += start_result[0]
                    }
                    cropped_match = result.replace(start_result[0],'')
                    end_result = cropped_match.match(new RegExp(redact_config.endRedaction, 'm'))
                    replacement += cropped_match.replace(end_result[0],'')
                    if (end_result.length > 1){
                        replacement += end_result[1]
                    } else {
                        replacement += end_result[0]
                    }
                    text = text.replace(result, replacement)
                  }
                })
            }
        }
        
        // test for date release patterns
        if (redact_config.earliestDate){
        
            var replacement, start_result, cropped_match, end_result, dated_excerpt
            var date_string, year_string, month_string, day_string, hour_string, content_date
            var date_pattern = redact_config.earliestDate + '([\\s\\S]*?)' + redact_config.endRedaction
            var current_date = new Date()
            
            results = text.match(new RegExp(date_pattern, 'mg'))
            if (results){
                results.forEach(function(result){
                  // construct replacement string
                  replacement = ''
                  start_result = result.match(new RegExp(redact_config.earliestDate, 'm'))
                  if (start_result.length > 1){
                      replacement += start_result[1]
                  } else {
                      replacement += start_result[0]
                  }
                  cropped_match = result.replace(start_result[0],'')
                  end_result = cropped_match.match(new RegExp(redact_config.endRedaction, 'm'))
                  dated_excerpt = cropped_match.replace(end_result[0],'')
                  replacement += dated_excerpt
                  if (end_result.length > 1){
                    replacement += end_result[1]
                  } else {
                    replacement += end_result[0]
                  }
                  // test date of excerpt against current date and replace text
                  if (!res || !res.locals.user){
                      date_string = start_result[0].replace(/[^\d]/g, '')
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
                        text = text.replace(result, dated_excerpt)
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
                var latest_section = redact_config.sequentialSections[i]
                var replacement, start_result, cropped_match, end_result, section_excerpt, section_number
                var section_pattern = latest_section.expression + '([\\s\\S]*?)' + redact_config.endRedaction
                results = text.match(new RegExp(section_pattern, 'mg'))
                if (results){
                    results.forEach(function(result){
                      // construct replacement string
                      replacement = ''
                      start_result = result.match(new RegExp(latest_section.expression, 'm'))
                      if (start_result.length > 1){
                          replacement += start_result[1]
                      } else {
                          replacement += start_result[0]
                      }
                      cropped_match = result.replace(start_result[0],'')
                      end_result = cropped_match.match(new RegExp(redact_config.endRedaction, 'm'))
                      section_excerpt = cropped_match.replace(end_result[0],'')
                      replacement += section_excerpt
                      if (end_result.length > 1){
                        replacement += end_result[1]
                      } else {
                        replacement += end_result[0]
                      }
                      // test numerical value of excerpt against latest value and replace text
                      if (!res || !res.locals.user){
                        section_number = /\d+/.exec(start_result[0])
                        if (section_number > latest_section.latestValue){
                            text = text.replace(result, '')
                        } else {
                            text = text.replace(result, section_excerpt)
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