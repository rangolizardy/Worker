var amqp = require('amqp');
var sox = require('sox');
var http = require('http');
var fs = require('fs');

var helper = require('./helper.js');

/* S3 */
/*
Access Key ID:
AKIAJND366FEJVEVEYNA
Secret Access Key:
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
*/


var self = this;

console.log('starting');
var connection = amqp.createConnection({host: '192.99.247.106',login: 'rango', password: 'aisa1250', authMechanism: 'AMQPLAIN'});
connection.on('ready', function(){
    connection.queue('task_pile', {autoDelete: false, durable: true}, function(queue){
        console.log(' [*] Waiting for messages. To exit press CTRL+C');
        queue.subscribe({ack: true, prefetchCount: 1}, function(msg){
            var body = msg.data.toString('utf-8');
            var payload =  JSON.parse(body);
            
            
            var file_type = payload.data.extension;
            var file_name = payload.data.name;
            
            console.log('main thread');
            helper.get_file(file_name,file_type,'wl_in/'+file_name+file_type,function(){
                helper.transcode_file('wl_in/'+file_name+file_type,'wl_out/'+file_name+".ogg",function(){
                    helper.upload_file(file_name+file_type, 'wl_out/'+file_name+".ogg",function(){
                        //
                        console.log('end game');
                        queue.shift();
                    });
                });
            });
            
            //upload_file(f_output,'wl_out/'+name+".ogg");
            
            /*
            setTimeout(function(){
               // console.log(" [x] Done");
                //queue.shift(); // basic_ack equivalent
            }, (body.split('.').length - 1) * 1000);*/
        });
    });
});
