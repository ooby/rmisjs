module.exports = pattern => {
  let schema = {
    type: 'string',
    minLength: 1
  }
  if (pattern) {
    schema.pattern = pattern
  }
  return schema
}
