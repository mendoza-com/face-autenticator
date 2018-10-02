import {success, failure} from '../helper/response';

const config      = require('../config'),
      AWS = require('aws-sdk');
      AWS.config.update({region:'us-east-1'});

// Set your AWS credentials
const AWSParameters = {
  "accessKeyId": config.accessKeyId,
  "secretAccessKey": config.secretAccessKey,
  "region": "us-east-1",
  "bucket": config.bucketName
};

var s3 = new AWS.S3({
  signatureVersion: 'v4',
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: "us-east-1",
  bucket: config.bucketName
});

module.exports.auth = async (event, context, callback) => {
  const body = JSON.parse(event.body);

  if(!body)
    return callback(null, failure({message:'body error'}));
  
  const url = s3.getSignedUrl('putObject', {
    Bucket: AWSParameters.bucket,
    Key: body.Key,
    ContentType: 'binary',
    ACL: 'authenticated-read',
    Expires: 120,
  });

  return callback(null, success({"url":url}));
}