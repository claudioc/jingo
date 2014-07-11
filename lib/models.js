var Promise = require("bluebird");

var models = {
    
  gitmech: null,
  
  use: function(gitmech) {
    this.gitmech = gitmech;
  },

  pages: {
      
    getHistory: function(pageName, callback) {

      Git.show(pageName + ".md", "HEAD", function(err, content) {

        if (err) {
          callback(err);
        }

        Git.log(pageName + ".md", "HEAD", 30, function(err, metadata) {
          
          if (err) {
            callback(err);
          }
          
          callback(null, content, metadata);
        });
      });
    }
  }
    
};

Promise.promisifyAll(models.pages);

module.exports = models;