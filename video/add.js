const Rekognition = require('node-rekognition'),
  config = require('../config'),
  AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

import { success, failure } from '../helper/response';

// Set your AWS credentials
const AWSParameters = {
  "accessKeyId": config.accessKeyId,
  "secretAccessKey": config.secretAccessKey,
  "region": "us-east-1",
  "bucket": config.bucketName
};

const AWSSnsParameter = {
  "role": config.snsRole,
  "topic": config.snsTopic
};

const rekognition = new Rekognition(AWSParameters),
  dynamoDb = new AWS.DynamoDB.DocumentClient();

//Add the video and the face to palta rekon system
module.exports.add = async (event, context, callback) => {

  if (!event.body) {
    return callback(null, failure({ message: 'body error' }));
  }

  const faceToSearchInVideo = JSON.parse(event.body);
  try {
    const startFaceSearch = await rekognition.startFaceSearch("face-" + faceToSearchInVideo.id, faceToSearchInVideo, AWSSnsParameter)
      .catch(function (error) { console.log(error); return callback(null, failure(error)); });

    var logLine = {
      step: "2",
      date: new Date().getTime(),
      details: {
        resultStartFaceSearch: startFaceSearch
      }
    };

    const dbParams = {
      TableName: config.tableLog,
      Key: { userId: parseInt(faceToSearchInVideo.id) },
      ReturnValues: 'ALL_NEW',
      UpdateExpression: 'set #logs = list_append(if_not_exists(#logs, :empty_list), :logLine)',
      ExpressionAttributeNames: {
        '#logs': 'logs'
      },
      ExpressionAttributeValues: {
        ':logLine': [logLine],
        ':empty_list': []
      }
    };

    await dynamoDb.update(dbParams, (error) => {
      if (error) {
        console.error(error);
      }
    });

    callback(null, success({ message: 'FaceSearch ', startFaceSearch }));
    
  } catch (error) {
    callback(null, failure({ message: 'Error adding video', error: error }));
  }

};