var ServiceCloudConfig = require('service-cloud-config2');

var loaded = false;
var env = process.env.NODE_ENV || 'development';

var config = new ServiceCloudConfig({
  service: 'config/' + env + '/saas-plat-wiki',
  adapter: {
    name: 'consul',
    connection: {
      host: 'cfg.saas-plat.com',
      port: 4720
    }
  },
  mergeWithConfigEnv: true,
  envServiceName: 'config/' + env + '/environment'
});


exports.getData = function(callback) {
  if (loaded) {
    return;
  }
  config.start(function(err, data) {
    if (err) {
      console.error(err);
      callback(err);
      return;
    }
    config.getData(function(err, data) {
      if (err) {
        console.error(err);
        callback(err);
        return;
      }
      console.info('配置已经加载', env);
      loaded = true;
      callback(null, data);
    });
  });
};

exports.get = function(key) {
  return config.get(key);
};

exports.getConfig = function() {
  return config.getConfig();
};
