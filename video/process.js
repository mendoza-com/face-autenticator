import {success, failure} from '../helper/response';

const Rekognition = require('node-rekognition'),
config            = require('../config'),
AWS               = require('aws-sdk');
AWS.config.update({region:'us-east-1'});

const AWSParameters     = {
    "accessKeyId"     : config.accessKeyId,
    "secretAccessKey" : config.secretAccessKey,
    "region"          : "us-east-1",
    "bucket"          : config.bucketName
};

const rekognition = new Rekognition(AWSParameters),
      dynamoDb    = new AWS.DynamoDB.DocumentClient();

      //Process and evaluates if the face sent appear in the video
module.exports.process = async ( event, context, callback) => {

  const body = JSON.parse(event.body);
  
  var JobId;
  var id;

  if ('JobId' in body) 
    JobId = body.JobId;
  else
    return callback(null, failure({message:'Required JobId'}));
 
  if ('id' in body)
    id = body.id;
  else
    return callback(null, failure({message:'Required id'}));
  
  const getFaceSearch = await rekognition.getFaceSearch(JobId);
  
  console.log(getFaceSearch);
  var result;

  switch (getFaceSearch.JobStatus){
    
    case "SUCCEEDED":
      //check if is present the object "FaceMatches", that indicates if the given face appear in the video
      if(getFaceSearch.Persons.some(e => e['FaceMatches'])) {
        
        var Similarity = 0.0;
        
        var FacesMatches = await getFaceSearch.Persons.filter(e => e['FaceMatches']);
    
        var Faces = await FacesMatches.filter(e => e['FaceMatches'].length > 0);
    
        Faces.forEach((person)=> {Similarity += person.FaceMatches[0].Similarity;});
        var average = Similarity/Faces.length;
        console.log("id: ",id," similarity: ",average);
        
        result = {similarity:average, match:'OK', faces:Faces};
        await saveLogDb(result, id);
        delete result.faces; //elimino faces para no mostrarlo en las respuestas  
        return callback(null, success(result));
      
      }else{
        result = {message:'The document image does not appear in the video'};
        await saveLogDb(result, id);
        return callback(null, success(result));
      } 

    case "IN_PROGRESS":
      return callback(null, success({message:'The JobId is in process...', error:getFaceSearch.status}));
     
    default:
      result = {message:'JobId error', error:getFaceSearch.StatusMessage};
      await saveLogDb(result,id);
      return callback(null, failure(result));
  }
};

async function saveLogDb(result, id){
  
  var status;
  
  if (result.match === 'OK'){
    status = 1;
  }else{
    status = -1;
  }
  
  var logLine = {
    step: "3",
    date: new Date().getTime(),
    details: {
      resultFaceSearch:result
    }
  };

  const dbParams = {
    TableName: config.tableLog,
    Key: { userId: parseInt(id) },
    UpdateExpression: 'set #logs = list_append(if_not_exists(#logs, :empty_list), :logLine), #validationStatus = :status',
    ExpressionAttributeNames: {
      '#logs': 'logs',
      '#validationStatus':'validationStatus'
    },
    ExpressionAttributeValues: {
      ':logLine': [logLine],
      ':empty_list': [],
      ':status' : status
    }
  };
  
  await dynamoDb.update(dbParams, (error) => {
    if (error) {
      console.error(error);
    }
  });
}