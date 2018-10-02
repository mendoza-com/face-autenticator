/**
 * Success function
 * @param {*} body 
 */
export function success(body) {
  console.log("Success",200);
  return buildResponse(200, body);
}

/**
 * Fail response status 500
 * @param {*} body 
 */
export function failure(err) {
  console.log("FAIL",err);
  return buildResponse(400, err);
}

/**
 * Build Responses for success and fail actions
 * @param {*} statusCode 
 * @param {*} body 
 */
function buildResponse(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    },
    body: JSON.stringify(body)
  };
}