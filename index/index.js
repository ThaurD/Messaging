const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

var app = require('express')();
var http = require('http').Server(app);


app.get('/', function(req, res) {
    res.sendfile('index.html');
 });

 http.listen(3000, function() {
    console.log('listening on localhost:3000');
 });


// Connect to mongo
mongo.connect('mongodb://127.0.0.1/mongochat',{ useNewUrlParser: true }, function(err, db){
    if(err){
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    client.on('connection', function(socket){
        var dbo = db.db("mydb");  // veri tabanı oluşturuluyor
        let chat = dbo.collection('chats'); // veri tabanında chat isimli collection oluşturuluyor

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }
 
        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', function(data){
            let name = data.name;
            let message = data.message;

            // Check for name and message
            if(name == '' || message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});