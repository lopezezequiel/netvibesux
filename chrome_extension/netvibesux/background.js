/*
 * (function(root){

    var toQueryParams = function(data) {
        var params = [];
        for(var key in data) {
            params.push(encodeURIComponent(key) + "=" +
                encodeURIComponent(data[key]));
        }
        return params.join("&");
    }


    var prepare = function(config) {

        var $config = {
            url: config.url,
            method: config.method || 'GET',
            data: config.data || {},
            timeout: config.timeout || 0,
            headers: {
                'CONTENT-TYPE': 'application/x-www-form-urlencoded;charset=UTF-8',
                'X-REQUESTED-WITH': 'XMLHttpRequest'
            },
            onerror: config.onerror,
            response: undefined,
            handlers: [],
            xhr: new XMLHttpRequest()
        }


        for(key in config.headers) {
            $config.headers[key.toUpperCase()] = config.headers[key];
        }

        if($config.headers['CONTENT-TYPE'].toLowerCase() ===
            'application/json') {
                $config.data = JSON.stringify($config.data);
        } else if($config.headers['CONTENT-TYPE'].match(/application\/x\-www\-form-urlencoded/i)) {
                $config.data = toQueryParams($config.data);
        } else if($config.method === 'GET') {
            if($config.data) {
                $config.url += '?' + toQueryParams($config.data);
            }

            $config.data = null;
        }

        return $config;
    }


    var getResponse = function(xhr) {
        if(xhr.responseXML) {
            return xhr.responseXML;
        }
        try {
            return  JSON.parse(xhr.responseText);
        } catch(e) {
            return xhr.responseText;
        }
    }


    var sendRequest = function(config) {

        config.xhr.open(config.method, config.url, true);

        config.xhr.timeout = config.timeout;
        config.xhr.onerror = config.onerror;

        for(key in config.headers) {
            config.xhr.setRequestHeader(key, config.headers[key]);
        }

        config.xhr.onreadystatechange = function () {
            if (config.xhr.readyState !== 4) return;

            config.response = getResponse(config.xhr);

            for(var i=0; i<config.handlers.length; i++) {
                executeHandler(config.handlers[i], config);
            }
        }

        config.xhr.send(config.data);
    }


    var isArray = function(object) {
        return Object.prototype.toString.call(object) ===
            '[object Array]';
    }


    var executeHandler = function(handler, config) {
        var codes = isArray(handler.codes) ? handler.codes :
            [handler.codes];

        var negatives = [];
        var positives = [];

        for(var i=0; i<codes.length; i++) {
            if(codes[i] < 0) {
                negatives.push(-codes[i]);
            } else {
                positives.push(codes[i]);
            }
        }

        var status = config.xhr.status;

        if(negatives.length > 0 && negatives.indexOf(status) === -1) {
            handler.callback(config.response, config.xhr);
        } else if(positives.indexOf(status) !== -1) {
            handler.callback(config.response, config.xhr);
        }
    }


    root.ajax = function(config) {

        config = prepare(config);
        sendRequest(config);

        var ajax = {};

        ajax.handler = function(codes, callback) {

            var handler = {
                codes: codes,
                callback: callback
            }

            if(typeof config.response === 'undefined') {
                config.handlers.push(handler);
            } else {
                executeHandler(handler, config);
            }

            return ajax;
        }

        return ajax;
    }
})(this);


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
*/

//https://usabilitygeek.com/10-free-web-based-web-site-accessibility-evaluation-tools/
