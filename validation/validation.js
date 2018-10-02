import { success, failure } from '../helper/response';

const config = require('../config'),
      AWS = require('aws-sdk');


const AWSParameters     = {
    "accessKeyId"     : config.accessKeyId,
    "secretAccessKey" : config.secretAccessKey,
    "region"          : "us-east-1",
    "bucket"          : config.bucketName
};

const dynamoDb = new AWS.DynamoDB.DocumentClient(AWSParameters);

module.exports.get = (event, context, callback) => {

    if (!event.queryStringParameters.userId)
        return callback(null, failure({ message: 'Error: no userId in request'}));
    
    var params = {
        TableName: config.tableLog,
        KeyConditionExpression: "userId = :idValue",
        ExpressionAttributeValues: {
            ":idValue": parseInt(event.queryStringParameters.userId)
        }
    };

    dynamoDb.query(params, function (err, data) {
        if (err) {    
            console.error("Unable to query. Error:", JSON.stringify(err));
            return callback(null, failure({ message: "Unable to query. Error:". JSON.stringify(err)}));
        } else {

            if(data.Items[0])
                return callback(null, success({userId:data.Items[0].userId, validationStatus: data.Items[0].validationStatus}));
            else
                return callback(null, success({ message: 'UserId not found'}));
        }
    });    
};

module.exports.update = (event, context, callback) => {

    if (!event.queryStringParameters.userId)
        return callback(null, failure({ message: 'Error: no userId in request'}));

    let userId = parseInt(event.queryStringParameters.userId);

    var params = {
        TableName:config.tableLog,
        Key:{
            userId : userId
        },
        UpdateExpression: "set validationStatus = :newValue",
        ConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
            ":userId": userId,
            ":newValue": 1
        },
        ReturnValues:"ALL_NEW"
    };

    dynamoDb.update(params, function (err, data) {
        if (err) {    
            return callback(null, failure(err));
        } else {
            if(data.Attributes)
                return callback(null, success({ message: 'User updated correctly'}));
            else
                return callback(null, success({ message: 'User does not updated'}));
        }
    });    
};