module.exports = function(config) {

  const signatur_error = function(args, param) {
    return {
      status: "error",
      result: `### Signatur error ###  Origin: ${config.origin} ### args: ${JSON.stringify(args)} ### param: ${param}`,
      arguments: args,
      parameter: param,
      origin: config.origin
    }
  }


  return {
    signatur_error: signatur_error
  }


}
