
var Path   = require("path");

var Git = global.app.locals.Git;

exports.route = function(req, res) {

  var record;

  res.locals.matches = [];
  res.locals.term = req.query.term.trim();

  if (res.locals.term.length < 2) {
    res.locals.warning = "Search string is too short.";
    renderResults();
  } else {

    Git.grep(res.locals.term, function(err, items) {

      items.forEach(function(item) {
        if (item.trim() !== "") {
          record = item.split(":");
          res.locals.matches.push({
            pageName: Path.basename(record[0].split(".")[0]),
            line: record[1] ? ":" + record[1] : "",
            text: record.slice(2).join('')
          });
        }
      });

      renderResults();
    });
  }

  function renderResults() {
    res.render("search", {
      title: "Search results"
    });
  }
};
