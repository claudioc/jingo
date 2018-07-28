var isNumber = require('is-number')

// MOD function to redact non-public content
function redactContent (text, res, config) {
    
    var wiki_configuration = config.getConfig()
    var redact_config = wiki_config.redaction
    if (redact_config.enabled){
        
        
//        var private_map = {}
//        var current_date = new Date()
//        var replacement, content_date, public_info
//        var rollout_list = configuration.getConfig().rolloutSection
//        
//        // look for hidden page pattern
//        if (redact_config.)
//        var hidden_regex = new RegExp()
//        var hidden = /^(<!-- Private)(.*?)( -->)/m.exec(text)
//        if (private){
//            if (!res || !res.locals.user){
//                return ''
//            } else {
//                text = text.replace(private[0], '-- Private' + private[2] + '--')
//            }
//        }
//        
//        // look for design notes
//        var matches = text.match(/<!-- Design Notes.*? -->[\s\S]*?<!-- End -->/gm)
//        if (matches) {
//            matches.forEach(function (match){
//                note = /(<!-- Design Notes)(.*?)( -->)([\s\S]*?)(<!-- End -->)/m.exec(match)
//                replacement = '-- Design Notes' + note[2] + ' --' + note[4] + '-- End --'
//                if (!res || !res.locals.user){
//                    text = text.replace(note[0], '')
//                } else {
//                    text = text.replace(note[0], replacement)
//                }
//            })
//        }
//        
//        // look for future material
//        var matches = text.match(/<!-- \d{4}\.?\d{2}\.?\d{2}.*? -->[\s\S]*?<!-- End -->/gm)
//        if (matches){
//            matches.forEach(function (match){
//                future = /(<!-- )(\d{4})\.?(\d{2})\.?(\d{2})(.*?)( -->)([\s\S]*?)(<!-- End -->)/m.exec(match)
//                replacement = '-- ' + future[2] + '.' + future[3] + '.' + future[4] + future[5] + ' --' + future[7] + '-- End --'
//                if (!res || !res.locals.user){
//                    content_date = new Date(future[2], future[3], future[4])
//                    if (content_date.getTime() > current_date.getTime()){
//                        text = text.replace(future[0], '')
//                    } else {
//                        text = text.replace(future[0], future[7])
//                    }
//                } else {
//                    text = text.replace(future[0], replacement)
//                }
//            })
//        }
//    
//        // look for story-chapter-number content
//        var matches = text.match(/<!-- .*?-chapter-\d+.*? -->[\s\S]*?<!-- End -->/gm)
//        if (matches){
//            matches.forEach(function (match){
//                chapter = /(<!-- )(.*?)(-chapter-)(\d+)(.*?)( -->)([\s\S]*?)(<!-- End -->)/m.exec(match)
//                replacement = '-- ' + chapter[2] + '-chapter-' + chapter[4] + chapter[5] + ' --' + chapter[7] + '-- End --'
//                public_info = false
//                if (!res || !res.locals.user){
//                    if (chapter[2] in public_map && isNumber(public_map[chapter[2]])){
//                        if (parseInt(chapter[4]) <= public_map[chapter[2]]){
//                            text = text.replace(chapter[0], chapter[7])
//                            public_info = true
//                        }
//                    }
//                    if (!public_info){
//                        text = text.replace(chapter[0], '')
//                    }
//                } else {
//                    text = text.replace(chapter[0], replacement)
//                }
//            })
//        }
    }
    
    return text.trim()
    
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