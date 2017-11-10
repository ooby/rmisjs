const objectProperties = (obj, ...props) => {
  for (let prop of props) {
      if (prop in obj === false) {
          return false;
      }
  }
  return true;
};

module.exports = ({ mongoose }) => {
  let result = 'mongodb://';
  if (objectProperties(mongoose, 'username', 'password')) {
      let { username, password } = mongoose;
      result += `${username}:${password}@`;
  }
  let { host, db } = mongoose;
  result += `${host}`;
  if (objectProperties(mongoose, 'port')) {
      result += `:${mongoose.port}`;
  }
  return result + `/${db}`;
};
