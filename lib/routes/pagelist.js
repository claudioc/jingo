var Path   = require("path")
  , Tools  = require("../tools");
  
var Git = global.app.locals.Git;

exports.route = function(req, res) {

  var items = []
    , len;

  Git.ls(function(err, list) {

    len = list.length;

    list.forEach(function(page) {

      page = Path.basename(page);

      Git.hashes(page,2, function(err, hashes) {

        Git.readFile(page, "HEAD", function(err, content) {

          (function(title) {

            Git.log(page, "HEAD", function(err, metadata) {

              Git.lastMessage(page, "HEAD", function(err, message) {

                items.push({
                  pageTitle: title,
                  message: message,
                  metadata: metadata,
                  hashes: hashes.length == 2 ? hashes.join("..") : ""
                });

                if (items.length === len) {
                  items.sort(function(a, b) {
                    return b.metadata.timestamp - a.metadata.timestamp;
                  });

                  res.render("list", {
                    title: "Document list – Sorted by update date",
                    items: items
                  });
                }
              });
            });
          })(Tools.getPageTitle(content, page));
        });
      });
    });
  });
};
