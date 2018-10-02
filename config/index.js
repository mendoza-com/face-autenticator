var nodeEnv = process.env.ENV || 'test';

config.bucketName = process.env.BUCKETNAME;
config.snsRole = process.env.SNS_ROLE;
config.snsTopic = process.env.SNS_TOPIC;
config.tableLog = process.env.LOG_TABLE;
config.secretAccessKey = process.env.SECRETACCESSKEY;
config.accessKeyId = process.env.ACCESSKEYID;

module.exports = config;