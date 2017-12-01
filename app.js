const mongodb = require('mongodb');
const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const request = require('request');
const htmlparser = require('node-html-parser');
const handlebars = require('handlebars');
const fs = require('fs');

const PORT = process.env.PORT || 3000;
const url = "mongodb://" + process.env.DB_USER  + ":" + process.env.DB_PASSWORD  + "@ds139342.mlab.com:39342/netvibesux";

var CONFIG = {}
CONFIG.STEPS = {}
CONFIG.STEPS.SET_UP = 'setUp';
CONFIG.STEPS.USER_NAME = 'userName';
CONFIG.STEPS.KNOW_APP = 'knowApp';
CONFIG.STEPS.UNDERSTAND_APP = 'understandApp';
CONFIG.STEPS.SHOW_APP = 'showApp';
CONFIG.STEPS.EXPLAIN_APP = 'explainApp';
CONFIG.STEPS.CAN_CREATE_TAB = 'canCreateTab';
CONFIG.STEPS.WAIT_FOR_TAB = 'waitForTab';
CONFIG.STEPS.CAN_CREATE_TAB_YES = 'canCreateTabYes';
CONFIG.STEPS.CAN_CREATE_TAB_NO = 'canCreateTabNo';
CONFIG.STEPS.BOT_CREATING_TAB = 'botCreatingTab';
CONFIG.STEPS.CAN_ADD_MODULE = 'canAddModule';
CONFIG.STEPS.WAIT_FOR_MODULE = 'waitForModule';
CONFIG.STEPS.CAN_ADD_MODULE_YES = 'canAddModuleYes';
CONFIG.STEPS.CAN_ADD_MODULE_NO = 'canAddModuleNo';
CONFIG.STEPS.FINISH = 'finish';

CONFIG.TASKS = {}
CONFIG.TASKS.CREATE_TAB = 'Crear Pestaña';
CONFIG.TASKS.ADD_MODULE = 'Agregar módulo';



var Schema = mongoose.Schema;

var MemoryInfoSchema = new Schema({
    heapLimit:    { type: Number },
    heapSize:    { type: Number },
    heapUsage:    { type: Number },
    usage:    { type: Number },
    test: { type: Schema.Types.ObjectId, ref: 'Test' },
    step: { type: String },
    updated: { type: Date, default: Date.now }
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
    step: { type: String },
    updated: { type: Date, default: Date.now }
});

var AppearanceSchema = new Schema({
    gender:    { type: String },
    glasses:    { type: String },
    age:    { type: String },
    ethnicity:    { type: String },
    test: { type: Schema.Types.ObjectId, ref: 'Test' },
    updated: { type: Date, default: Date.now }
});

var WCAGWarningSchema = new Schema({
    checkpoint:    { type: String },
    description:    { type: String },
    element:    { type: String },
    attribute:    { type: String },
    test: { type: Schema.Types.ObjectId, ref: 'Test' },
    updated: { type: Date, default: Date.now }
});

var WCAGErrorSchema = new Schema({
    checkpoint:    { type: String },
    description:    { type: String },
    element:    { type: String },
    attribute:    { type: String },
    test: { type: Schema.Types.ObjectId, ref: 'Test' },
    updated: { type: Date, default: Date.now }
});

var AltSchema = new Schema({
    total:    { type: Number },
    pass:    { type: Number },
    score:    { type: Number },
    test: { type: Schema.Types.ObjectId, ref: 'Test' },
    updated: { type: Date, default: Date.now }
});

var ContrastSchema = new Schema({
    total:    { type: Number },
    pass:    { type: Number },
    score:    { type: Number },
    type: { type: String, enum: ['normal', 'protanopia', 'protanomaly', 'deuteranopia', 'deuteranomaly']},
    test: { type: Schema.Types.ObjectId, ref: 'Test' },
    updated: { type: Date, default: Date.now }
});

var TestSchema = new Schema({
    name: { type: String},
    knowApp: { type: Boolean},
    understandApp: { type: Boolean},
    step: { type: String },
    updated: { type: Date, default: Date.now }
});

var TaskSchema = {
    name: { type: String },
    time: { type: Number },
    done: { type: Boolean},
    test: { type: Schema.Types.ObjectId, ref: 'Test' }
}


var MemoryInfo = mongoose.model('MemoryInfo', MemoryInfoSchema);
var Emotion = mongoose.model('Emotion', EmotionSchema);
var Appearance = mongoose.model('Appearance', AppearanceSchema);
var WCAGWarning = mongoose.model('WCAGWarning', WCAGWarningSchema);
var WCAGError = mongoose.model('WCAGError', WCAGErrorSchema);
var Alt = mongoose.model('Alt', AltSchema);
var Contrast = mongoose.model('Contrast', ContrastSchema);
var Test = mongoose.model('Test', TestSchema);
var Task = mongoose.model('Task', TaskSchema);

const app = express()


handlebars.registerHelper('percent', function(number) {
  return (number && number.toFixed) ? number.toFixed(2) + '%' : '';
});

handlebars.registerHelper('SiNo', function(flag) {
  return (flag) ? 'Si' : 'No';
});

var templates = {
    tests: './templates/tests.html',
    tasks: './templates/tasks.html',
    test: './templates/test.html',
    alts: './templates/alts.html',
    index: './templates/index.html',
    plattforms: './templates/plattforms.html',
    contrasts: './templates/contrasts.html'
}

for(name in templates) {
    (function(name) {
        fs.readFile(templates[name], "utf8", function(err, data) {
            templates[name] = handlebars.compile(data);
        });
    })(name);
}

app.get('/', function(req, res) {

    res.send(templates.index({}));
});



app.get('/plattforms', function(req, res) {

    var stats = []
    var plattforms = [
        {title: 'iPad Air 2 - iOS 9.1 - Landscape', pass: true},
        {title: 'iPad Air 2 - iOS 9.1 - Portrait', pass: true},
        {title: 'iPhone 6S  - iOS 9.1 - Landscape', pass: true},
        {title: 'iPhone 6S  - iOS 9.1 - Portrait', pass: true},
        {title: 'OS X High Sierra - Chrome 62', pass: true},
        {title: 'OS X High Sierra - Firefox 57', pass: true},
        {title: 'OS X High Sierra - Safari 11', pass: true},
        {title: 'Win 10 - Chrome 62', pass: true},
        {title: 'Win 10 - Edge 16', pass: true},
        {title: 'Win 10 - Firefox 57', pass: true},
        {title: 'Win 10 - IE 11', pass: true}
    ]

    stats.push({title: 'Plataformas probadas', value: plattforms.length});
    stats.push({title: 'Plataformas correctas', value: plattforms.length, percent: 100});
    res.send(templates.plattforms({plattforms: plattforms, stats: stats}));
});



app.get('/tests', function(req, res) {
    Test.find({step: CONFIG.STEPS.FINISH}, function(error, tests) {

        var stats = []
        stats.push({title: 'Terminados', value: tests.length});

        var value = tests.filter(function(test){
            return test.knowApp;
        }).length;
        var percent = value * 100 / tests.length;
        stats.push({title: 'Conocían Netvibes previamente', value: value, percent: percent});


        value = tests.filter(function(test){
            return test.understandApp;
        }).length;
        var percent = value * 100 / tests.length;
        stats.push({title: 'Entendían para que sirve antes de explicarles', value: value, percent: percent});

        res.send(templates.tests({
            tests: tests,
            stats: stats
        }));
    });
});

app.get('/tasks', function(req, res) {
    Test.find({step: CONFIG.STEPS.FINISH}, function(error, tests) {

    var ids = tests.map(function(test) {
        return test._id;
    });

    Task.find({test: {$in: ids }},  function(error, tasks) {
    Task.find({test: {$in: ids }, name: CONFIG.TASKS.CREATE_TAB},  function(error, tasks_create_tab) {
    Task.find({test: {$in: ids }, name: CONFIG.TASKS.ADD_MODULE},  function(error, tasks_add_module) {

        var stats = [];

        var done = tasks_create_tab.filter(function(task){
            return task.done;
        });
        var avg_time = done.map(function(task) {
            return task.time;
        }).reduce(function(a, b) {
            return a + b;
        }) / done.length;
        avg_time = (avg_time/1000).toFixed(2);


        var percent = done.length * 100 / tasks_create_tab.length;
        stats.push({title: 'Lograron completar tarea: Crear pestaña', value: done.length, percent: percent});
        stats.push({title: 'Tiempo promedio: Crear pestaña', value: avg_time});

        done = tasks_add_module.filter(function(task){
            return task.done;
        });
        avg_time = done.map(function(task) {
            return task.time;
        }).reduce(function(a, b) {
            return a + b;
        }) / done.length;
        avg_time = (avg_time/1000).toFixed(2);

        var percent = done.length * 100 / tasks_add_module.length;
        stats.push({title: 'Lograron completar tarea: Agregar módulo', value: done.length, percent: percent});
        stats.push({title: 'Tiempo promedio: Agregar Módulo', value: avg_time});

        res.send(templates.tasks({
            tasks: tasks,
            stats: stats
        }));
    })
    })
    })
    });
});

app.get('/contrasts', function(req, res) {
    Test.find({step: CONFIG.STEPS.FINISH}, function(error, tests) {

    var ids = tests.map(function(test) {
        return test._id;
    });

    Contrast.find({test: {$in: ids }},  function(error, contrasts) {

        var stats = [];

        var addStat = function(title, vision) {
            var total = contrasts.filter(function(contrast){
                return contrast.type == vision;
            });
            var pass = total.filter(function(contrast){
                return contrast.pass;
            });

            var percent = pass.length * 100 / total.length;
            stats.push({title: title, value: pass.length, percent: percent});
        }

        stats.push({title: 'Total', value: contrasts.length});
        addStat('Correctos para visión normal', 'normal');
        addStat('Correctos para visión con protanopia', 'protanopia');
        addStat('Correctos para visión con protanomalia', 'protanomaly');
        addStat('Correctos para visión con deuteranopia', 'deuteranopia');
        addStat('Correctos para visión con deuteranomalia', 'deuteranomaly');


        res.send(templates.contrasts({
            contrasts: contrasts,
            stats: stats
        }));
    })
    });
});

app.get('/alts', function(req, res) {
    Test.find({step: CONFIG.STEPS.FINISH}, function(error, tests) {

    var ids = tests.map(function(test) {
        return test._id;
    });

    Alt.find({test: {$in: ids }},  function(error, alts) {

        var stats = [];

        var score = 0;
        var pass = 0;
        var total = 0;
        for(var i=0; i<alts.length; i++) {
            score += alts[i].score;
            pass += alts[i].pass;
            total += alts[i].total;
        }

        var percent = score / alts.length;
        stats.push({title: 'Total', value: total});
        stats.push({title: 'Correctos', value: pass, percent: percent});

        res.send(templates.alts({
            alts: alts,
            stats: stats
        }));
    })
    });
});


app.get('/tests/:testId', function(req, res) {

    Test.findOne({step: CONFIG.STEPS.FINISH, _id: req.params.testId}, function(error, test) {
    MemoryInfo.find({test: test}, function(error, memory) {
    Appearance.find({test: test}, function(error, appearance) {
    Alt.find({test: test}, function(error, alts) {
    Contrast.find({test: test}, function(error, contrasts) {
    WCAGError.find({test: test}, function(error, wcagerrors) {
    WCAGWarning.find({test: test}, function(error, wcagwarnings) {
    Emotion.find({test: test}, function(error, emotions) {
    Task.find({test: test}, function(error, tasks) {

        if(test) test.memory = memory;
        if(test) test.alts = alts;
        if(test) test.contrasts = contrasts;
        if(test) test.wcagerrors = wcagerrors;
        if(test) test.wcagwarnings = wcagwarnings;
        if(test) test.emotions = emotions;
        if(test) test.tasks = tasks;

        if(test) {

            var a = appearance.find(function(a) {
                return a.age != 'Unknown';
            });
            test.age = (a) ? a.age : 'Desconocida';

            a = appearance.find(function(a) {
                return a.glasses != 'Unknown';
            });
            test.glasses = (a) ? a.glasses : 'Desconocido';

            a = appearance.find(function(a) {
                return a.gender != 'Unknown';
            });
            test.gender = (a) ? a.gender : 'Desconocido';

            a = appearance.find(function(a) {
                return a.ethnicity != 'Unknown';
            });
            test.ethnicity = (a) ? a.ethnicity : 'Desconocida';
        }
        res.send(templates.test({test: test}));
    })
    })
    })
    })
    })
    })
    })
    })
    });

});

var server = app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
const ws = new WebSocket.Server({server: server});


mongoose.connect(url);


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

    this.task = function(task) {
        var $this = this;
        var t = new Task(task);
        t.test = test;
        t.save(function(err, t) {
            if (err) throw err;
            $this.response(t);
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
