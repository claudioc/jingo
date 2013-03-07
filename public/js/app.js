
!(function(window, $, undefined) {

  var cheatsheetShown = false;

  var Jingo = {

    init: function() {

      if ($(".page-actions:not(.pull-right)").length > 0) {
        var $pah = $("<li class=\"page-actions-handle\">Tools</li>");
        var pahTo;
        $pah.on("mouseover", function() {
          $("#main").animate({"margin-top": "-1em"})
        });
        $(".page-actions").on("mouseenter", function() {
          clearTimeout(pahTo);
        }).on("mouseleave", function() {
          pahTo = setTimeout(function() {
            $("#main").animate({"margin-top": "-3.5em"})
          }, 2000);
        });
        $(".page-actions:not(.pull-right)").append($pah);
      }

      $('.confirm-delete-page').on("click", function(evt) {
        return confirm("Do you really want to delete this page?");
      });

      var $hCol1 = $('.history td:first-child');

      $("#pageTitle").focus();

      toggleCompareCheckboxes();
      $hCol1.find('input').on('click', function() {
        toggleCompareCheckboxes();
      });

      $("#rev-compare").on("click", function() {
        if ($hCol1.find(":checked").length < 2) {
          return false;
        }
        window.location.href = "/wiki/" + $(this).data('pagename') + "/compare/" + $hCol1.find(":checked").map(function() { return $(this).val(); }).toArray().join("..");
        return false;
      });

      if (/^\/wiki\//.test(window.location.pathname)) {
        var pages = []
          , match
          , href;

        $("#content a.internal").each(function(i, a) {
          href = $(a).attr("href");
          if (match = /\/wiki\/(.+)/.exec(href)) {
            pages.push(match[1]);
          }
        });

        $.getJSON("/misc/existence", {data: pages}, function(result) {
          $.each(result.data, function(href, a) {
            $("#content a[href=\\/wiki\\/" + a + "]").addClass("absent");
          });
        });
      }

      function toggleCompareCheckboxes() {
        if ($hCol1.find(":checkbox").length == 1) {
          $hCol1.find(":checkbox").hide();
          $('#rev-compare').hide();
          return;
        }
        if ($hCol1.find(":checked").length == 2) {
          $hCol1.find(":not(:checked)")
                .hide();
          $hCol1.parent("tr")
                .css({"color": "silver"});
          $hCol1.find(":checked")
                .parents("tr")
                .css({"color": "black"});
        } else {
          $hCol1.find('input')
                .show()
                .parents("tr")
                .css({"color": "black"});
        }
      }

    },

    preview: function() {
      $('#preview').modal("show");
      $.post("/misc/preview", {data: $('#editor').val()}, function(data) {
        $('#preview .modal-body').html(data).get(0).scrollTop = 0;
      });
    },

    markdownSyntax: function() {
      $('#syntax-reference').modal("show");
      if (!cheatsheetShown) {
        $('#syntax-reference .modal-body').load("/misc/syntax-reference");
        cheatsheetShown = true;
      }
    }

  }

  window.Jingo = Jingo;

})(this, jQuery);
