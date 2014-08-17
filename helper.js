var amqp = require('amqp');
var sox = require('sox');
var http = require('http');
var fs = require('fs');
var aws = require('aws-sdk');
aws.config.loadFromPath('./aws_config.json');
var s3 = new aws.S3();

function get_file(name,extension, dest,callback) {
    var file = fs.createWriteStream('wl_in/'+name+extension);
    var stream = s3.getObject({ Bucket: "pulsr-media-input", Key: name+extension }).createReadStream().pipe(file);
    file.on('finish', function(){
        callback();
    });

}
function upload_file(destination, input,callback){
      var fileBuffer = fs.readFileSync(input);
      var metaData = getContentTypeByFile(input);

      s3.putObject({
        ACL: 'authenticated-read',
        Bucket: 'ireland.aws.pulsr.fm',
        Key: destination,
        Body: fileBuffer,
        ContentType: metaData
      }, function(error, response) {
         callback();
      });
}
function transcode_file(f_input,f_output,callback){

    var job = sox.transcode(f_input, f_output, {
        sampleRate: 44100,
        format: 'ogg',
        channelCount: 2,
        bitRate: 192 * 1024,
        compressionQuality: -1
    });
    job.on('error', function(err) {
      console.error(err);
    });
    job.on('progress', function(amountDone, amountTotal) {
      console.log("progress", amountDone, amountTotal);
    });
    job.on('src', function(info) {
        console.log('[INFO]');
        console.log(info);
      /* info looks like:
      {
        format: 'wav',
        duration: 1.5,
        sampleCount: 66150,
        channelCount: 1,
        bitRate: 722944,
        sampleRate: 44100,
      }
      */
    });
    job.on('dest', function(info) {
        
        console.log('[DEST]');
        console.log(info);
      /* info looks like:
      {
        sampleRate: 44100,
        format: 'mp3',
        channelCount: 2,
        sampleCount: 67958,
        duration: 1.540998,
        bitRate: 196608,
      }
      */
    });
    job.on('end', function() {
      callback();
    });
    job.start();
}
function getContentTypeByFile(fileName) {
  var rc = 'application/octet-stream';
  var fileNameLowerCase = fileName.toLowerCase();

  if (fileNameLowerCase.indexOf('.html') >= 0) rc = 'text/html';
  else if (fileNameLowerCase.indexOf('.css') >= 0) rc = 'text/css';
  else if (fileNameLowerCase.indexOf('.json') >= 0) rc = 'application/json';
  else if (fileNameLowerCase.indexOf('.js') >= 0) rc = 'application/x-javascript';
  else if (fileNameLowerCase.indexOf('.png') >= 0) rc = 'image/png';
  else if (fileNameLowerCase.indexOf('.jpg') >= 0) rc = 'image/jpg';

  return rc;
}

module.exports.get_file = get_file;
module.exports.transcode_file = transcode_file;
module.exports.upload_file = upload_file;