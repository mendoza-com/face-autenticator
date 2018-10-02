import { success, failure } from '../helper/response';

const Rekognition = require('node-rekognition'),
  config = require('../config'),
  AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

// Set your AWS credentials
const AWSParameters = {
  "accessKeyId": config.accessKeyId,
  "secretAccessKey": config.secretAccessKey,
  "region": "us-east-1",
  "bucket": config.bucketName
};

const rekognition = new Rekognition(AWSParameters),
  dynamoDb = new AWS.DynamoDB.DocumentClient();
module.exports.add = async (event, context, callback) => {

  if (!event.body)
    return callback(null, failure({ message: 'body error' }));

  const s3Image = JSON.parse(event.body).image,
   userData = JSON.parse(event.body).userData.dni,
   dniDataFromQR = JSON.parse(event.body).dniData,
   //todo: mejorar expresion para contemplar docs con diferente cant de cifras
   stringDni = userData.slice(0, 2) + "." + userData.slice(2, 5) + "." + userData.slice(5, 8);
   
  var DetectedText;
  
  console.log(s3Image);
  console.log(userData);

  const imageFaces = await rekognition.detectFaces(s3Image)
    .catch(function (error) { console.log(error); return callback(null, failure(error)); });

  const imageText = await rekognition.detectText(s3Image)
    .catch(function (error) { console.log(error); return callback(null, failure(error)); });

  //DETECCION DE TEXTO
  console.log("Finding text match...");
  if (!imageText.TextDetections.some(function (element){
    if (element.DetectedText === stringDni){
      console.log("Match found: " + JSON.stringify(element));
      DetectedText = element;
      return element.DetectedText;
    }
  })){
    var result = {};
    result.dniDataFromQR = dniDataFromQR;
    result.DetectedText = false;
    result.resultIndexFacesPhoto = null;
    result.imageFaces = null;
    await saveLogDb(result, s3Image.id);
    return callback(null, success({ message: 'Invalid text in image' }));
  }

  //DETECCION DE CARAS
  if (typeof imageFaces.FaceDetails === 'undefined' || imageFaces.FaceDetails.length <= 0) {
    
    var result = {};
    result.dniDataFromQR = dniDataFromQR;
    result.DetectedText = DetectedText;
    result.resultIndexFacesPhoto = null;
    result.imageFaces = imageFaces;

    await saveLogDb(result, s3Image.id);
    return callback(null, success({ message: 'No faces in image' }));
  }

  //CREACION DE COLLECTION
  var resultColection;
  resultColection = await rekognition.createCollection("face-" + s3Image.id)
    .catch(
      async function (error) {
        if (error.code == 'ResourceAlreadyExistsException') { //si la coleccion ya existe la borramos y creamos una nueva con ese mismo ID
          await rekognition.deleteCollection("face-" + s3Image.id)
            .catch(function (error) { console.log(error); return callback(null, failure(error)); });

          resultColection = await rekognition.createCollection("face-" + s3Image.id)
            .catch(function (error) { console.log(error); return callback(null, failure(error)); });
        } else {
          console.log(error);
          return callback(null, failure(error));
        }
      }
    );

  //INDEXADO DE CARAS
  var resultIndexFaces = await rekognition.indexFaces("face-" + s3Image.id, s3Image)
    .catch(
      function (error) {
        console.log(error);
        return callback(null, failure(error));
      }
    );
  
  var result = {};
  result.dniDataFromQR = dniDataFromQR;
  result.DetectedText = DetectedText;
  result.resultIndexFacesPhoto = resultIndexFaces;
  result.imageFaces = imageFaces;
  
  await saveLogDb(result, s3Image.id);

  callback(null, success({ message: 'Image correctly saved' }));
};

async function saveLogDb(result, id) {
  //Linea que va dentro del array de logs (step y desc del log)
  var logLine = {
    step: "1",
    date: new Date().getTime(),
    details: result
  };

  const dbParams =
  {
    TableName: config.tableLog,
    Key: { userId: parseInt(id) },
    ReturnValues: 'ALL_NEW',
    UpdateExpression: 'set #logs = list_append(if_not_exists(#logs, :empty_list), :logLine), #validationStatus = :status',
    ExpressionAttributeNames: {
      '#logs': 'logs',
      '#validationStatus': 'validationStatus'
    },
    ExpressionAttributeValues: {
      ':logLine': [logLine],
      ':empty_list': [],
      ':status': -1
    }
  };

  await dynamoDb.update(dbParams, (error) => {
    // handle potential errors
    if (error) {
      console.error(error);
    }
  });

}