
!(function(window, undefined) {

  var cheatsheetShown = false;

  var Jingo = {

    init: function() {

      $('.confirm-delete-page').on("click", function(evt) {
        return confirm("Do you really want to delete this page?");
      });

      var $hCol1 = $('.history td:first-child');

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

      if (window.location.pathname.match(/^\/wiki\//)) {
        var pages = $.map($("#content a[href]").filter(function(i, a) {
          var href = $(a).attr("href");
          return !(href[0] == '/' || href.match(/^(f|ht)tps?:/));
        }), function(a) {
          return a.getAttribute("href").split("#")[0];
        });

        $.getJSON("/misc/existence", {data: pages}, function(result) {
          $.each(result.data, function(href, a) {
            $("#content a[href=" + a + "]").addClass("unknown");
          });
        });
      }

      function toggleCompareCheckboxes() {
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

})(this);
