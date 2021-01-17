var fs = require('fs')
var Promiser = require('bluebird')
// using fs.access instead of the deprecated fs.exists:
// https://nodejs.org/api/fs.html#fs_fs_exists_path_callback
var exists = Promiser.promisify(fs.access)

module.exports = {
  sync: function (file) {
    try {
      fs.accessSync(file)
      // If it didn't throw, the file exists
      return true
    } catch (err) {
      return catchEnoent(err)
    }
  },
  async: function (file) {
    return exists(file)
    .then(function (res) { return true })
    .catch(catchEnoent)
  }
}

function catchEnoent (err) {
  if (err.code === 'ENOENT') {
    return false
  } else {
    throw err
  }
}
