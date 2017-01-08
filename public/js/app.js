/* global jQuery */
!(function (window, $, undefined) { // eslint-disable-line
  var cheatsheetShown = false

  var $toolbar

  var proxyPath

  var Jingo = {

    init: function (setProxyPath) {
      proxyPath = setProxyPath

      var navh = $('.navbar').height()
      var $tools = $('.tools')
      var qs
      var hl = null

      if (window.location.search !== '') {
        $('input[name=term]').focus()
        qs = $.map(window.location.search.substr(1).split('&'), function (kv) {
          kv = kv.split('=')
          return { k: kv[0], v: decodeURIComponent(kv[1]) }
        })
        $.each(qs, function (i, t) {
          if (t.k === 'hl') {
            hl = t.v
          }
        })
        if (hl) {
          if (window.find && window.getSelection) {
            document.designMode = 'on'
            var sel = window.getSelection()
            sel.collapse(document.body, 0)
            while (window.find(hl)) {
              document.execCommand('HiliteColor', false, 'yellow')
              sel.collapseToEnd()
            }
            sel.collapse(document.body, 0)
            window.find(hl)
            sel.collapseToEnd()
            document.designMode = 'off'
          } else {
            if (document.body.createTextRange) {
              var textRange = document.body.createTextRange()
              while (textRange.findText(hl)) {
                textRange.execCommand('BackColor', false, 'yellow')
                textRange.collapse(false)
              }
            }
          }
        }
      }

      $('#login').attr('href', function () {
        return $(this).attr('href').replace('destination', 'destination=' + encodeURIComponent(window.location.pathname))
      })

      $('.tools').height(navh)

      if ($('.tools > ul > li').length > 0) {
        var $pah = $('<li class="tools-handle">Tools</li>')
        var pahTo
        var bodyPadding = $('body').css('padding-top')
        $pah.on('mouseover', function () {
          $tools.animate({'margin-top': bodyPadding === '40px' ? '0' : '-20'})
          $pah.slideUp()
        })
        $tools.on('mouseenter', function () {
          clearTimeout(pahTo)
        }).on('mouseleave', function () {
          pahTo = setTimeout(function () {
            $tools.animate({'margin-top': '-62'})
            $pah.slideDown()
          }, 500)
        })
        $('.tools > ul').append($pah)
      }

      $('.confirm-delete-page').on('click', function (evt) {
        return window.confirm('Do you really want to delete this page?')
      })

      $('.confirm-revert').on('click', function (evt) {
        return window.confirm('Do you really want to revert to this revision?')
      })

      var $hCol1 = $('.history td:first-child')

      if ($('#content').hasClass('edit')) {
        $('#editor').focus()
      } else {
        $('#pageTitle').focus()
      }

      $('#rev-compare').attr('disabled', true)

      toggleCompareCheckboxes()
      $hCol1.find('input').on('click', function () {
        toggleCompareCheckboxes()
      })

      $('#rev-compare').on('click', function () {
        if ($hCol1.find(':checked').length < 2) {
          return false
        }
        window.location.href = proxyPath + '/wiki/' + $(this).data('pagename') + '/compare/' + $hCol1.find(':checked').map(function () { return $(this).val() }).toArray().reverse().join('..')
        return false
      })

      if (/^\/pages\/.*\/edit/.test(window.location.pathname) ||
          /^\/pages\/new/.test(window.location.pathname)) {
        $('#editor').closest('form').on('submit', function () {
          if (Jingo.cmInstance) {
            Jingo.cmInstance.save()
          }
          window.sessionStorage.setItem('jingo-page', $('#editor').val())
        })
        if (window.location.search === '?e=1') {
          // Edit page in error: restore the body
          var content = window.sessionStorage.getItem('jingo-page')
          if (content) {
            $('#editor').val(content)
          }
        } else {
          window.sessionStorage.removeItem('jingo-page')
        }
      }

      if (/^\/wiki\//.test(window.location.pathname)) {
        markMissingPagesAsAbsent('#content')
      }

      function toggleCompareCheckboxes () {
        $('#rev-compare').attr('disabled', true)

        if ($hCol1.find(':checkbox').length === 1) {
          $hCol1.find(':checkbox').hide()
          return
        }
        if ($hCol1.find(':checked').length === 2) {
          $('#rev-compare').attr('disabled', false)
          $hCol1.find(':not(:checked)')
                .hide()
          $hCol1.parent('tr')
                .css({'color': 'silver'})
          $hCol1.find(':checked')
                .parents('tr')
                .css({'color': 'black'})
        } else {
          $hCol1.find('input')
                .show()
                .parents('tr')
                .css({'color': 'black'})
        }
      }
    },

    preview: function () {
      $('#preview').modal({keyboard: true, show: true, backdrop: false})
      $.post(proxyPath + '/misc/preview', {data: $('#editor').val()}, function (data) {
        $('#preview .modal-body').html(data).get(0).scrollTop = 0
        markMissingPagesAsAbsent('#preview .modal-body')
      })
    },

    save: function () {
      $('form.edit').submit()
    },

    toggleFullscreen: function () {
      var isFullscreen = Jingo.cmInstance.getOption('fullScreen')

      Jingo.cmInstance.setOption('fullScreen', !Jingo.cmInstance.getOption('fullScreen'))
      Jingo.cmInstance.focus()

      $toolbar.toggleClass('fullscreen', !isFullscreen)
    },

    toolbar: function () {
      $toolbar = $("<ul class='toolbar'>")
      /* eslint-disable */
      $toolbar.append('<li title="Toggle fullscreen (Ctrl/Cmd+Enter)" class="fullscreen"><span></span></li>\
        <li title="Syntax help" class="info"><span></span></li>\
        <li title="Preview" class="preview"><span></span></li></ul>').insertBefore($('form.edit textarea:first').closest('div'))
      /* eslint-enable */

      $('ul.toolbar').on('click', 'span', function () {
        if (this.parentNode.className === 'info') {
          Jingo.markdownSyntax()
        }
        if (this.parentNode.className === 'preview') {
          Jingo.cmInstance.save()
          Jingo.preview()
        }
        if (this.parentNode.className === 'fullscreen') {
          Jingo.toggleFullscreen()
        }
      })
    },

    markdownSyntax: function () {
      $('#syntax-reference').modal({keyboard: true, show: true, backdrop: false})
      if (!cheatsheetShown) {
        $('#syntax-reference .modal-body').load(proxyPath + '/misc/syntax-reference')
        cheatsheetShown = true
      }
    }
  }

  function markMissingPagesAsAbsent (selector) {
    var pages = []
    var match
    var href

    $(selector + ' a.internal').each(function (i, a) {
      href = $(a).attr('href')
      href = href.slice(proxyPath.length)
      match = /\/wiki\/(.+)/.exec(href)
      if (match) {
        pages.push(decodeURIComponent(match[1]))
      }
    })

    $.getJSON(proxyPath + '/misc/existence', {data: pages}, function (result) {
      $.each(result.data, function (href, a) {
        $(selector + " a[href='" + proxyPath.split('/').join('\\/') + '\\/wiki\\/' + encodeURIComponent(a) + "']").addClass('absent')
      })
    })
  }

  window.Jingo = Jingo
}(this, jQuery))
