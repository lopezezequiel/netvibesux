const mongodb = require('mongodb');
const WebSocket = require('ws');
const ws = new WebSocket.Server({
    port: 3000,
    //ssl_key: 'host.key', ssl_cert: 'host.cert',
    host:'0.0.0.0'
});

//    port: 3000, ssl: true, ssl_key: 'host.key', ssl_cert: 'host.cert' });
const request = require('request');
const htmlparser = require('node-html-parser');

var url = "mongodb://localhost:27017/netvibesux";
var url = "mongodb://" + process.env.DB_USER  + ":" + process.env.DB_PASSWORD  + "@ds139342.mlab.com:39342/netvibesux";
var mongoose = require('mongoose');
mongoose.connect(url);


var Schema = mongoose.Schema;

var MemoryInfoSchema = new Schema({
    heapLimit:    { type: Number },
    heapSize:    { type: Number },
    heapUsage:    { type: Number },
    usage:    { type: Number },
    test: { type: Schema.Types.ObjectId, ref: 'Test' },
    step: { type: String }
});

var EmotionSchema = new Schema({
    emoji:    { type: String },
    anger: {type: Number},
    contempt: {type: Number},
    disgust: {type: Number},
    engagement: {type: Number},
    fear: {type: Number},
    joy: {type: Number},
    sadness: {type: Number},
    surprise: {type: Number},
    valence: {type: Number},
    test: { type: Schema.Types.ObjectId, ref: 'Test' },
    step: { type: String }
});

var AppearanceSchema = new Schema({
    gender:    { type: String },
    glasses:    { type: String },
    age:    { type: String },
    ethnicity:    { type: String },
    test: { type: Schema.Types.ObjectId, ref: 'Test' }
});

var WCAGWarningSchema = new Schema({
    checkpoint:    { type: String },
    description:    { type: String },
    element:    { type: String },
    attribute:    { type: String },
    test: { type: Schema.Types.ObjectId, ref: 'Test' }
});

var WCAGErrorSchema = new Schema({
    checkpoint:    { type: String },
    description:    { type: String },
    element:    { type: String },
    attribute:    { type: String },
    test: { type: Schema.Types.ObjectId, ref: 'Test' }
});

var AltSchema = new Schema({
    total:    { type: Number },
    pass:    { type: Number },
    score:    { type: Number },
    test: { type: Schema.Types.ObjectId, ref: 'Test' }
});

var ContrastSchema = new Schema({
    total:    { type: Number },
    pass:    { type: Number },
    score:    { type: Number },
    type: { type: String, enum: ['normal', 'protanopia', 'protanomaly', 'deuteranopia', 'deuteranomaly']},
    test: { type: Schema.Types.ObjectId, ref: 'Test' }
});

var TestSchema = new Schema({
    name: { type: String},
    knowApp: { type: Boolean},
    understandApp: { type: Boolean},
    canCreateTab: { type: Boolean},
    canAddModule: { type: Boolean},
    step: { type: String }
});


var MemoryInfo = mongoose.model('MemoryInfo', MemoryInfoSchema);
var Emotion = mongoose.model('Emotion', EmotionSchema);
var Appearance = mongoose.model('Appearance', AppearanceSchema);
var WCAGWarning = mongoose.model('WCAGWarning', WCAGWarningSchema);
var WCAGError = mongoose.model('WCAGError', WCAGErrorSchema);
var Alt = mongoose.model('Alt', AltSchema);
var Contrast = mongoose.model('Contrast', ContrastSchema);
var Test = mongoose.model('Test', TestSchema);


var Session = function(socket) {

    var session = this;
    var test = null;

    socket.on('message', function(message){
        message = JSON.parse(message);
        var request = message.request;
        var response = message.response;

        if(request) {
            var method = session[request.method];

            if(method) {

                $this = {
                    response: function(data) {
                        if(socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({response: {
                                id: request.id,
                                data: data
                            }}));
                        }
                    }
                }

                method.apply($this, request.data);

            }
        }
    });

    this.__start__ = function(tid) {
        $this = this;

        Test.findOne({_id: tid}, function(errors, $test) {

            if($test) {
                test = $test;

                $this.response({
                    test_step: test.step,
                    test_id: test.id,
                    methods: Object.keys(session)
                });
            } else {
                test = new Test;

                test.save(function(error, test) {
                    if (error) throw error;
                    $this.response({
                        test_id: test.id,
                        test_step: test.step,
                        methods: Object.keys(session)
                    });
                });
            }
        });
    }

    this.memory = function(memoryInfo) {
        var $this = this;
        var m = new MemoryInfo(memoryInfo);
        m.test = test;
        m.step = test.step;
        m.save(function(err, m) {
            if (err) throw err;
            $this.response(m);
        });
    }

    this.emotion = function(emotion) {
        var $this = this;
        var e = new Emotion(emotion);
        e.test = test;
        e.step = test.step;
        e.save(function(err, e) {
            if (err) throw err;
            $this.response(e);
        });
    }

    this.appearance = function(appearance) {
        var $this = this;
        var a = new Appearance(appearance);
        a.test = test;
        a.save(function(err, a) {
            if (err) throw err;
            $this.response(a);
        });
    }

/*
    this.wcagWarnings = function(warnings) {
        var $this = this;
        for(var i=0; i<warnings.length; i++) {
            var m = new WCAGWarning(warnings[i]);
            m.test = test;
            m.save(function(err) {
                if (err) throw err;
            });
            if(i == warnings.length) $this.response();
        }
    }

    this.wcagErrors = function(errors) {
        var $this = this;
        for(var i=0; i<errors.length; i++) {
            var m = new WCAGError(errors[i]);
            m.test = test;
            m.save(function(err) {
                if (err) throw err;
                if(i == errors.length) $this.response();
            });
        }
    }
*/

    this.alt = function(alt) {
        var $this = this;
        var a = new Alt(alt);
        a.test = test;
        a.save(function(err, a) {
            if (err) throw err;
            $this.response(a);
        });
    }

    this.contrast = function(contrast, type) {
        var $this = this;
        contrast.type = type;
        var c = new Contrast(contrast);
        c.test = test;
        c.save(function(err, c) {
            if (err) throw err;
            $this.response(c);
        });
    }

    this.getTest = function() {
        this.response(test);
    }

    this.setName = function(name) {
        $this = this;
        test.name = name;
        test.save(function(error, test) {
            $this.response(test);
        });
    }

    this.setStep = function(step) {
        $this = this;
        test.step = step;
        test.save(function(error, test) {
            $this.response(test);
        });
    }

    this.setKnowApp = function(knowApp) {
        $this = this;
        test.knowApp = knowApp;
        test.save(function(error, test) {
            $this.response(test);
        });
    }

    this.setUnderstandApp = function(understandApp) {
        $this = this;
        test.understandApp = understandApp;
        test.save(function(error, test) {
            $this.response(test);
        });
    }

    this.setCanCreateTab = function(canCreateTab) {
        $this = this;
        test.canCreateTab = canCreateTab;
        test.save(function(error, test) {
            $this.response(test);
        });
    }

    this.setCanAddModule = function(canAddModule) {
        $this = this;
        test.canAddModule = canAddModule;
        test.save(function(error, test) {
            $this.response(test);
        });
    }

    this.wcag = function(html) {
        var $this = this;
        request.post(
            'http://sipt07.si.ehu.es/evalaccess2/servlet/Evaluate',
            { form: {
                    "Accessibility_Evaluation": "Evaluate",
                    "action": "Accessibility Evaluation Text",
                    "errors": "on",
                    "levels": "123",
                    "text": html,
                    "warnings": "on"
            }},
            function (error, response, raw) {
                if (!error && response.statusCode == 200) {

                    var parseLines = function(raw) {
                        return raw.match(/\d+/g);
                    }

                    var parseElement = function(raw) {
                        var element = raw.replace(/ /g,'').split(',')[0];
                        element = element || null;
                        element = (element == 'N/A') ? null : element;

                        return element;
                    }

                    var parseAttribute = function(raw) {
                        var attribute = raw.replace(/ /g,'').split(',')[1];
                        attribute = attribute || null;
                        return attribute;
                    }

                    var parseTable = function(table, priority) {
                        var rows = table.querySelectorAll('tr');
                        var results = [];
                        for(var i=1; i<rows.length; i++) {
                            var fields = rows[i].querySelectorAll('td');
                            results.push({
                                checkpoint: fields[0].childNodes[0].rawText,
                                description: fields[1].childNodes[0].rawText,
                                element: parseElement(fields[2].childNodes[0].rawText),
                                attribute: parseAttribute(fields[2].childNodes[0].rawText),
                                lines: parseLines(fields[3].childNodes[0].rawText),
                                priority: priority
                            });
                        }
                        return results;
                    }

                    var root = htmlparser.parse(raw);
                    var div = root.querySelector("#report");
                    var tables = div.querySelectorAll("table");

                    var errors = parseTable(tables[1], 1);
                    errors = errors.concat(parseTable(tables[2], 2));
                    errors = errors.concat(parseTable(tables[3], 3));

                    var warnings = parseTable(tables[4], 1);
                    warnings = warnings.concat(parseTable(tables[5], 2));
                    warnings = warnings.concat(parseTable(tables[6], 3));


                    for(var i=0; i<warnings.length; i++) {
                        var m = new WCAGWarning(warnings[i]);
                        m.test = test;
                        m.save(function(err) {
                            if (err) throw err;
                        });
                    }

                    for(var i=0; i<errors.length; i++) {
                        var m = new WCAGError(errors[i]);
                        m.test = test;
                        m.save(function(err) {
                            if (err) throw err;
                        });
                    }

                    $this.response(errors.length, warnings.length);
                }
            }
        );
    }
}

ws.on('connection', function connection(socket) {
    new Session(socket);
});
