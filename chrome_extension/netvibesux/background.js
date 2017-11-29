/*

pipe = Pipe(function() {
});
pipe.getWCAG1Report = function(html) {
    getWCAG1(html, this.response);
}

pipe.createTab = function(pageId, title) {
    var $this = this;

    ajax({
        url: 'https://www.netvibes.com/api/my/tabs/create',
        method: 'POST',
        data: {
            pageId: pageId,
            title: title
        }
    }).handler(200, function(tab) {
        $this.response(tab);
    }).handler(-200, function(r) {
        $this.response(null);
    });
}

var getWCAG1 = function(html, callback) {
    ajax({
        url: 'http://sipt07.si.ehu.es/evalaccess2/servlet/Evaluate',
        method: 'POST',
        data: {
            "Accessibility_Evaluation": "Evaluate",
            "action": "Accessibility Evaluation Text",
            "errors": "on",
            "levels": "123",
            "text": html,
            "warnings": "on"
        }
    }).handler(200, function(html) {

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
                    checkpoint: fields[0].textContent,
                    description: fields[1].textContent,
                    element: parseElement(fields[2].textContent),
                    attribute: parseAttribute(fields[2].textContent),
                    lines: parseLines(fields[3].textContent),
                    priority: priority
                });
            }
            return results;
        }

        var root = document.createElement('div');
        root.innerHTML = html;

        var tables = root.querySelectorAll("div#report > table");

        var errors = parseTable(tables[1], 1);
        errors = errors.concat(parseTable(tables[2], 2));
        errors = errors.concat(parseTable(tables[3], 3));

        var warnings = parseTable(tables[4], 1);
        warnings = warnings.concat(parseTable(tables[5], 2));
        warnings = warnings.concat(parseTable(tables[6], 3));


        callback.call(callback, errors, warnings);


    }).handler(500, function(error) {
        console.log(error);
    });

}

var Pipe = function(callback) {


    var execute = function() {
        var method = arguments[0];
        var params = Array.prototype.slice.call(arguments, 1);
        var callback = function() {}

        if(params.length > 0 && typeof params[params.length-1] === "function") {
            callback = params.pop();
        }

        var message = {
            method: method,
            params: params
        }

        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
                callback.apply(callback, response.response);
            });
        });
    }

    var methods = {}
    var sync = false;

    methods.__get_methods__ = function() {
        this.response(Object.keys(methods));

        if(sync) {
            return;
        }

        execute('__get_methods__', function(names) {
            var methods = {}

            for(var i=0; i<names.length; i++) {
                var name = names[i];
                methods[name] = function() {
                    var params = [name].concat(Array.prototype.slice.call(arguments));
                    execute.apply(execute, params);
                }
            }

            if(callback) {
                callback.call(methods);
            }

            sync = true;
        });

    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        var method = methods[request.method];
        if(method) {
            method.apply({
                response: function() {
                    sendResponse({response: Array.prototype.slice.call(arguments)});
                }
            }, request.params);
        }
        return true;
    });

    return methods;
}

*/


var running = false;

var setRunning = function(flag) {
    running = flag;
    chrome.browserAction.setIcon({path: (flag) ? 'images/stop.png' : 'images/play.png'});
}


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        setRunning(request.running);
});


chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {run: !running}, function(response) {
            setRunning(response.running);
        });
    });
});

//https://usabilitygeek.com/10-free-web-based-web-site-accessibility-evaluation-tools/
