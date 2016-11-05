/* eslint-env mocha */
/* global expect */

var fs = require('fs')
var models = require('../../lib/models')

var m

models.use(Git)

describe('Models', function () {
  afterEach(function () {
    m.configOverride()
    Git._content = ''
  })

  function getModel (name, revision) {
    return new models.Page(name, revision)
  }

  describe('Page model', function () {
    it('should initialize the model', function () {
      m = getModel('grazie cara')

      expect(m.name).to.equal('grazie cara')
      expect(m.wikiname).to.equal('grazie-cara')
      expect(m.filename).to.equal('grazie-cara.md')
      expect(m.pathname).to.equal('grazie-cara.md')
      expect(m.revision).to.equal('HEAD')
    })

    describe('Remove method', function () {
      it('should delete a file', function (done) {
        m = getModel('verguenza')
        m.remove().then(function () {
          expect(Git.rm.called).to.be.true
          done()
        })
      })
    })

    describe('Rename method', function () {
      it('should not rename if the destination exists', function (done) {
        var stub0 = sinon.stub(fs, 'existsSync').returns(true)
        m = getModel('verguenza')
        m.renameTo('vergogna').catch(function () {
          stub0.restore()
          done()
        })
      })

      it('should rename if the destination does not exist', function (done) {
        m = getModel('verguenza')
        m.renameTo('vergogna').then(function () {
          expect(m.name).to.equal('vergogna')
          expect(m.wikiname).to.equal('vergogna')
          expect(m.filename).to.equal('vergogna.md')
          expect(m.pathname).to.equal('vergogna.md')
          done()
        })
      })
    })

    describe('Save method', function () {
      it('should save the right content with the default config', function (done) {
        m = getModel('verguenza')
        m.title = 'The huge'
        m.content = 'The verge'
        var stub0 = sinon.stub(fs, 'writeFile').callsArgOn(2, m)
        m.save().then(function (content) {
          expect(content).to.equal('The verge')
          stub0.restore()
          done()
        })
      })

      it('should save the right content with the title in the content', function (done) {
        m = getModel('verguenza')

        m.configOverride({
          pages: {
            title: {
              fromFilename: false,
              fromContent: true
            }
          }
        })

        m.title = 'The huge'
        m.content = 'The verge'
        var stub0 = sinon.stub(fs, 'writeFile').callsArgOn(2, m)
        m.save().then(function (content) {
          expect(content).to.equal('# The huge\nThe verge')
          stub0.restore()
          done()
        })
      })
    })

    describe('UrlFor method', function () {
      it('should generate the correct url for page actions when a proxypath is not set', function () {
        var Page = models.Page
        var pname = 'verguenza'

        expect(Page.urlFor(pname, 'show')).to.equal('/wiki/verguenza')
        expect(Page.urlFor(pname, 'edit')).to.equal('/pages/verguenza/edit')
        expect(Page.urlFor(pname, 'edit error')).to.equal('/pages/verguenza/edit?e=1')
        expect(Page.urlFor(pname, 'edit put')).to.equal('/pages/verguenza')
        expect(Page.urlFor(pname, 'history')).to.equal('/wiki/verguenza/history')
        expect(Page.urlFor(pname, 'compare')).to.equal('/wiki/verguenza/compare')
        expect(Page.urlFor(pname, 'new')).to.equal('/pages/new/verguenza')
        expect(Page.urlFor(pname, 'new error')).to.equal('/pages/new/verguenza?e=1')
      })

      it('should generate the correct url for page actions when a proxypath is set', function () {
        var Page = models.Page
        var pname = 'verguenza'

        expect(Page.urlFor(pname, 'show', '/bazinga')).to.equal('/bazinga/wiki/verguenza')
        expect(Page.urlFor(pname, 'edit', '/bazinga')).to.equal('/bazinga/pages/verguenza/edit')
        expect(Page.urlFor(pname, 'edit error', '/bazinga')).to.equal('/bazinga/pages/verguenza/edit?e=1')
        expect(Page.urlFor(pname, 'edit put', '/bazinga')).to.equal('/bazinga/pages/verguenza')
        expect(Page.urlFor(pname, 'history', '/bazinga')).to.equal('/bazinga/wiki/verguenza/history')
        expect(Page.urlFor(pname, 'compare', '/bazinga')).to.equal('/bazinga/wiki/verguenza/compare')
        expect(Page.urlFor(pname, 'new', '/bazinga')).to.equal('/bazinga/pages/new/verguenza')
        expect(Page.urlFor(pname, 'new error', '/bazinga')).to.equal('/bazinga/pages/new/verguenza?e=1')
      })

      it('should generate the correct url for page actions', function () {
        m = getModel('chupito')

        expect(m.urlFor('show')).to.equal('/wiki/chupito')
        expect(m.urlFor('edit')).to.equal('/pages/chupito/edit')
        expect(m.urlFor('edit error')).to.equal('/pages/chupito/edit?e=1')
        expect(m.urlFor('edit put')).to.equal('/pages/chupito')
        expect(m.urlFor('history')).to.equal('/wiki/chupito/history')
        expect(m.urlFor('compare')).to.equal('/wiki/chupito/compare')
        expect(m.urlFor('new')).to.equal('/pages/new/chupito')
        expect(m.urlFor('new error')).to.equal('/pages/new/chupito?e=1')
      })

      it('should generate the correct url for page actions with a set proxypath', function () {
        m = getModel('chupito')

        m.configOverride({
          application: {
            proxyPath: 'lovely'
          }
        })

        expect(m.urlFor('show')).to.equal('/lovely/wiki/chupito')
        expect(m.urlFor('edit')).to.equal('/lovely/pages/chupito/edit')
        expect(m.urlFor('edit error')).to.equal('/lovely/pages/chupito/edit?e=1')
        expect(m.urlFor('edit put')).to.equal('/lovely/pages/chupito')
        expect(m.urlFor('history')).to.equal('/lovely/wiki/chupito/history')
        expect(m.urlFor('compare')).to.equal('/lovely/wiki/chupito/compare')
        expect(m.urlFor('new')).to.equal('/lovely/pages/new/chupito')
        expect(m.urlFor('new error')).to.equal('/lovely/pages/new/chupito?e=1')
      })
    })

    describe('isIndex method', function () {
      it('should test the correct value for the index', function () {
        m = getModel('pisquanio')

        m.configOverride({
          pages: {
            index: 'pisquanio'
          }
        })

        expect(m.isIndex()).to.be.true
      })
    })

    describe('isFooter method', function () {
      it('should test the correct value for the footer', function () {
        m = getModel('_footer')

        expect(m.isFooter()).to.be.true
      })
    })

    describe('isSidebar method', function () {
      it('should test the correct value for the sidebar', function () {
        m = getModel('_sidebar')

        expect(m.isSidebar()).to.be.true
      })
    })

    describe('lock method', function () {
      it('should lock a page', function () {
        m = getModel('panchovilla')

        var l = m.lock({
          asGitAuthor: 'geronimo@somewhere.com'
        })

        expect(l).to.be.true
        expect(m.lockedBy.asGitAuthor).to.equal('geronimo@somewhere.com')

        l = m.lock({
          asGitAuthor: 'someoneelse@somewhere.com'
        })

        expect(l).to.be.false
        expect(m.lockedBy.asGitAuthor).to.equal('geronimo@somewhere.com')
      })
    })

    describe('unlock method', function () {
      it('should unlock a page', function () {
        m = getModel('panchovilla')

        m.lock({
          asGitAuthor: 'geronimo@somewhere.com'
        })

        m.unlock()

        expect(m.lockedBy).to.equal(null)
      })
    })

    describe('fetchContent method', function () {
      it('should fetch the content for a page with no content retrieved', function (done) {
        m = getModel('panchovilla')

        m.fetchContent().then(function () {
          expect(m.content).to.equal('')
          expect(m.rawContent).to.equal('')
          expect(m.title).to.equal(m.name)
          done()
        })
      })

      it('should fetch the content for a page with content retrieved 1', function (done) {
        Git._content = 'Bella giornata!'

        m = getModel('panchovilla')

        m.fetchContent().then(function () {
          expect(m.content).to.equal('Bella giornata!')
          expect(m.rawContent).to.equal('Bella giornata!')
          expect(m.title).to.equal(m.name)
          done()
        })
      })

      it('should fetch the content for a page with content retrieved 2', function (done) {
        // Not the Jingo convention for title in the content
        Git._content = 'Bella serata!'

        m = getModel('panchovilla')

        m.configOverride({
          pages: {
            title: {
              fromFilename: false,
              fromContent: true
            }
          }
        })

        m.fetchContent().then(function () {
          expect(m.content).to.equal('Bella serata!')
          expect(m.rawContent).to.equal('Bella serata!')
          expect(m.title).to.equal(m.name)
          done()
        })
      })

      it('should fetch the content for a page with content retrieved 3', function (done) {
        // Jingo convention for title in the content
        Git._content = '# A nice title\nand some content!'

        m = getModel('panchovilla')

        m.configOverride({
          pages: {
            title: {
              fromFilename: false,
              fromContent: true
            }
          }
        })

        m.fetchContent().then(function () {
          expect(m.content).to.equal('and some content!')
          expect(m.rawContent).to.equal('# A nice title\nand some content!')
          expect(m.title).to.equal('A nice title')
          done()
        })
      })
    })
  })
})
