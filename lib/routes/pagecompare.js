
var Git = global.app.locals.Git;

exports.route = function(req, res) {

  var pageName = req.params.page
    , revisions = req.params.revisions;
    
  res.locals.revisions = revisions.split("..");
  res.locals.lines = [];

  Git.diff(pageName + ".md", revisions, function(err, diff) {

    diff.split("\n").slice(4).forEach(function(line) {

      if (line.slice(0,1) != '\\') {
        res.locals.lines.push({
          text: line,
          ldln: leftDiffLineNumber(0, line),
          rdln: rightDiffLineNumber(0, line),
          class: lineClass(line)
        });
      }

    });

    res.render('compare', {
      title: "Compare Revisions"
    });

  });

  var ldln = 0
    , cdln;
  function leftDiffLineNumber(id, line) {

    var li;
    
    switch(true) {

      case line.slice(0,2) == '@@':
        li = line.match(/\-(\d+)/)[1];
        ldln = parseInt(li, 10);
        cdln = ldln;
        return '...';

      case line.slice(0,1) == '+':
        return "";

      case line.slice(0,1) == '-':
      default:
        ldln++;
        cdln = ldln - 1;
        return cdln;
    }
  }

   var rdln = 0;
   function rightDiffLineNumber(id, line) {

    var ri;

    switch(true) {

      case line.slice(0,2) == '@@':
        ri = line.match(/\+(\d+)/)[1];
        rdln = parseInt(ri, 10);
        cdln = rdln;
        return '...';

      case line.slice(0,1) == '-':
        return ' ';

      case line.slice(0,1) == '+':
      default:
        rdln += 1;
        cdln = rdln - 1;
        return cdln;
    }
  }

  function lineClass(line) {
    if (line.slice(0,2) === '@@') {
      return "gc";
    }
    if (line.slice(0,1) === '-') {
      return "gd";
    }
    if (line.slice(0,1) === '+') {
      return "gi";
    }
  }
}
