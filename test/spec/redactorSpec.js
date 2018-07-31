/* eslint-env mocha */
/* global expect */

var Redactor = require('../../lib/redactor')

var config = {
  get: function(key){
    return this[key]
  },
  redaction: {
    enabled: true,
    hiddenPage: '^<!(--\\s?Hidden[\\s\\S]*?--)>',
    privateContent: '<!--\\s?Private([\\s\\S]*?)-->',
    futureContent: '<!(--\\s\\d{4}\\.\\d{2}\\.\\d{2}[\\s\\S]*?--)>([\\s\\S]*?)<!(--\\sEnd\\s--)>',
    sectionContent: [{
      expression: '<!(--\\schapter-\\d+[\\s\\S]*?--)>([\\s\\S]*?)<!(--\\sEnd\\s--)>',
      current: 0
    }]
  }
}

var authRes = {
  get: function(key){
    return this[key]
  },
  locals: { user: true }
}
var anonRes = {
  get: function(key){
    return this[key]
  },
  locals: { user: false }
}


describe('Redactor', function () {
  it('should add redirection paragraph', function () {
    var html = '<h1 id="heading-1">Heading 1</h1><p>This is some text</p>'
    var requested_page = 'foo'
    var redirected_page = 'Bar.md'
    expect(Redactor.redirect(html, requested_page, redirected_page)).to.be.equal('<h1 id="heading-1">Heading 1</h1><p class="redirect-info" data-redirect="Bar">"foo" redirects here.</p><p>This is some text</p>')
  })
  
  it('should redact all hidden content from anonymous', function () {
    var text = '<!-- Hidden -->Some hidden foo.'
    expect(Redactor.redact(text, anonRes, config)).to.be.equal('')
  })
  
  it('should reformat hidden content for authenticated', function () {
    var text = '<!-- Hidden -->Some hidden foo.'
    expect(Redactor.redact(text, authRes, config)).to.be.equal('-- Hidden --Some hidden foo.')
  })
  
  it('should redact private content from anonymous', function () {
    var text = 'Some visible foo<!-- Private Some hidden bar -->'
    expect(Redactor.redact(text, anonRes, config)).to.be.equal('Some visible foo')
  })
  
  it('should reformat private content for authenticated', function () {
    var text = 'Some visible foo<!-- Private Some hidden bar -->'
    expect(Redactor.redact(text, authRes, config)).to.be.equal('Some visible foo Some hidden bar')
  })
  
  it('should redact future content from anonymous', function () {
    var text = 'Some visible foo<!-- 2099.09.09 -->Some hidden bar<!-- End -->'
    expect(Redactor.redact(text, anonRes, config)).to.be.equal('Some visible foo')
  })
  
  it('should reformat future content for authenticated', function () {
    var text = 'Some visible foo<!-- 2099.09.09 -->Some hidden bar<!-- End -->'
    expect(Redactor.redact(text, authRes, config)).to.be.equal('Some visible foo-- 2099.09.09 --Some hidden bar-- End --')
  })
  
  it('should redact section content from anonymous', function () {
    var text = 'Some visible foo<!-- chapter-1 -->Some hidden bar<!-- End -->'
    expect(Redactor.redact(text, anonRes, config)).to.be.equal('Some visible foo')
  })
  
  it('should reformat section content for authenticated', function () {
    var text = 'Some visible foo<!-- chapter-1 -->Some hidden bar<!-- End -->'
    expect(Redactor.redact(text, authRes, config)).to.be.equal('Some visible foo-- chapter-1 --Some hidden bar-- End --')
  })
})