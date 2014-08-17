var amqp       = require('amqp');

var connection = amqp.createConnection({host: '192.99.247.106',login: 'rango', password: 'aisa1250', authMechanism: 'AMQPLAIN'});

var message = {};
message.data = {};
message.data.name = "nobrave";
message.data.extension = ".mp3";
var payload = JSON.stringify(message);

connection.on('ready', function(){
    connection.queue('task_queue', {autoDelete: false,durable: true}, function(queue){
                                    
        connection.publish('task_pile', payload, {deliveryMode: 2});
        console.log(" [x] Sent %s", message);

        connection.queue('tmp-' + Math.random(), {exclusive: true}, function(){
        connection.end();

        // `connection.end` in 0.1.3 raises a ECONNRESET error, silence it:
        connection.once('error', function(e){
            if (e.code !== 'ECONNRESET' || e.syscall !== 'write')
                throw e;
            });
        });
    });
});