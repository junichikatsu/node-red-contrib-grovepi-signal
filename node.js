
var GrovePi = require('@ia-cloud/node-grovepi').GrovePi;

var Commands = GrovePi.commands
var Board = GrovePi.board

module.exports = function(RED) {
    var board = new Board({
        debug: true,
        onError: function(err){
          console.error('GrovePiBoard.js: Something went wrong');
          console.error(err)
        },
        onInit: function(res) {
        }
    });

    board.init();

    function getSignal(n) {
        RED.nodes.createNode(this,n);
        this.pin = n.pin;
        this.threshold = n.threshold;
        this.sensor = n.sensor;
        var node = this;

        board.pinMode(node.pin, 'input');
        var oldVal;
        var interval = setInterval(function() {
            var value = false;
            var analog_in;
            var writeRet = board.writeBytes(Commands.aRead.concat([node.pin, Commands.unused, Commands.unused]));
            if(writeRet) {
                board.readByte();
                var bytes = board.readBytes();
                if(bytes instanceof Buffer) {
                    analog_in = bytes[1] * 256 + bytes[2]
                    if(analog_in > node.threshold) {
                        value = true;
                    }
                } else {
                    analog_in = 0;
                }
            }
            if(value !== oldVal) {
                node.send({ topic:"pi/"+node.pin, analogIn:analog_in, payload:value });
                node.buttonState = value;
                node.status({fill:"green",shape:"dot",text:value.toString()});  
                oldVal = value;
            }
        }, 500);

        node.on('close', function() {
            node.status({fill:"grey",shape:"ring",text:"Closed"});
            this.sensor(function(){
                 done();
            });
            clearInterval(interval);
        });
    }
    RED.nodes.registerType("get-signal",getSignal);
}