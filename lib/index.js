exports.register = (server, options, next) => {
  console.log('register');
  next();
};

exports.register.attributes = {
    pkg: require('../package.json')
};
