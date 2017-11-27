(function() {

    var CONFIG = {}

    CONFIG.SERVER = 'wss://netvibesux.herokuapp.com:3000';
    //CONFIG.SERVER = 'wss://localhost:8088';

    CONFIG.COOKIE_NAME = 'NETVIBES_UX_TEST_ID';
    CONFIG.FIRST_TAB_NAME = 'Tab1';
    CONFIG.TAB_NAME = '404';

    CONFIG.SPINNER_TIME = 5000;
    CONFIG.SHOW_APP_TIME = 3000;
    CONFIG.WAIT_FOR_TAB_TIME = 20000;
    CONFIG.WAIT_FOR_MODULE_TIME = 20000;

    CONFIG.HOME_URL = 'https://www.netvibes.com';
    CONFIG.DASHBOARD_URL = 'https://www.netvibes.com/dashboard';

    CONFIG.HOME_URL_REGEXP = /https\:\/\/www\.netvibes\.com(\/(..)?)?$/i;
    CONFIG.DASHBOARD_URL_REGEXP = /https\:\/\/www\.netvibes\.com\/dashboard/i;

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

    (function(root){

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


    var Bot = {}

    Bot.getTabsInfo = function() {
        var div = document.querySelector('div#privatePagesList > div.page.private-page');
        var pageId = div.id.replace(/^page\-/, '');
        var tabs = document.querySelectorAll("div#divTabs ul.tabs > li.tab");
        var tabsInfo = [];

        for(var i=0; i<tabs.length; i++) {
            var tab = tabs[i];

            tabsInfo.push({
                id: tab.dataset.tabid,
                title: tab.querySelector('span>span.title').textContent
            });
        }



        return tabsInfo;
    }


    Bot.createTab = function(title, callback) {

        var div = document.querySelector('div#privatePagesList > div.page.private-page.active');
        var pageId = div.id.replace(/^page\-/, '');

        ajax({
            url: 'https://www.netvibes.com/api/my/tabs/create',
            method: 'POST',
            data: {
                pageId: pageId,
                title: title
            }
        }).handler(200, function(tab) {
            callback.call(callback, tab);
        }).handler(-200, function(r) {
            callback.call(callback, null);
        });
    }

    Bot.removeTab = function(title, callback) {

        callback = callback || function () {}
        var div = document.querySelector('div#privatePagesList > div.page.private-page.active');
        var pageId = div.id.replace(/^page\-/, '');

        var tabsInfo = Bot.getTabsInfo();

        for(var i=0; i<tabsInfo.length; i++) {

            var tabInfo = tabsInfo[i];

            if(tabInfo.title == title) {

                var url = 'https://www.netvibes.com/api/my/tabs/' + pageId + '/' + tabInfo.id + '/delete';


                ajax({
                    url: url,
                    method: 'POST'
                }).handler(200, function(tab) {
                    callback.call(callback, tab);
                }).handler(-200, function(r) {
                    callback.call(callback, null);
                });

                //break; could be many tabs with the same name
            }
        }
    }

    Bot.removeAllTabs = function(callback) {
        var tabsInfo = Bot.getTabsInfo();
        var total = tabsInfo.length;

        tabsInfo.map(function(tabInfo) {
            return tabInfo.title;
        }).filter(function(title, index, array) {
            return array.indexOf(title) == index;
        }).map(function(title) {
            Bot.removeTab(title, function() {
                total--;
            });
        });

        checker(function() {
            return total == 0;
        }, function() {
            callback.call(callback);
        });
    }


    var AffectivaDetector = function(callbacks) {

        var $status;

        // SDK Needs to create video and canvas nodes in the DOM in order to function
        var divRoot = document.createElement('div');
        divRoot.style.display = 'none';
        document.body.appendChild(divRoot);

        var detector = new affdex.CameraDetector(divRoot, 640, 480,
            affdex.FaceDetectorMode.LARGE_FACES);

        detector.detectAllEmotions();
        detector.detectAllEmojis();
        detector.detectAllAppearance();

        this.start = function() {
            if (!detector.isRunning) {
                $status = {
                    emoji: null,
                    emotions: null,
                    appearance: null
                }
                detector.start();
            }
        }

        this.stop = function() {
            if (detector.isRunning) {
                detector.removeEventListener();
                detector.stop();
            }
        }

        this.reset = function() {
            if (detector.isRunning) {
              detector.reset();
            }
        };

        this.getEmotions = function() {
            return $status.emotions;
        }

        this.getEmoji = function() {
            return $status.emoji;
        }

        this.getAppearance = function() {
            return $status.appearance;
        }

        if (callbacks.onInit) {
          detector.addEventListener("onInitializeSuccess", callbacks.onInit);
        }

        if (callbacks.onConnect) {
            detector.addEventListener("onWebCamConnectSuccess", callbacks.onConnect);
        }

        if (callbacks.onFail) {
            detector.addEventListener("onWebCamConnectFailure", callbacks.onFail);
        }

        if (callbacks.onStop) {
            detector.addEventListener("onStopSuccess", callbacks.onStop);
        }

        detector.addEventListener("onImageResultsSuccess", function(faces, image, timestamp) {

            var face = (faces.length == 1) ? faces[0] : null;
            var new_status = {
                emoji: face ? face.emojis.dominantEmoji : null,
                appearance: face ? face.appearance : null,
                emotions: face ? face.emotions : null
            }



            if (callbacks.onUpdate) {
                callbacks.onUpdate.call(callbacks.onUpdate, new_status, timestamp);
            }

            if (callbacks.onEmoji && $status.emoji !== new_status.emoji) {
                callbacks.onEmoji.call(callbacks.onEmoji, new_status, timestamp);
            }

            if (callbacks.onAppearance && JSON.stringify($status.appearance) !== JSON.stringify(new_status.appearance)) {
                callbacks.onAppearance.call(callbacks.onAppearance, new_status, timestamp);
            }

            $status = new_status;
        });
    }


    var PerformanceMonitor = function(callbacks) {

        var running = false;
        var interval;
        var previousMemoryInfo = null;

        this.start = function() {
            if (running) {
                return;
            }

            running = true;

            interval = setInterval(function() {
                var performance = window.performance;

                var currentMemoryInfo = {
                    heapLimit: performance.memory.jsHeapSizeLimit,
                    heapSize: performance.memory.totalJSHeapSize,
                    heapUsage: performance.memory.usedJSHeapSize,
                    usage: performance.memory.usedJSHeapSize * 100 / performance.memory.jsHeapSizeLimit
                }


                if(callbacks.onMemoryUsageChange && (!previousMemoryInfo ||
                    previousMemoryInfo.usage != currentMemoryInfo.usage)) {
                    callbacks.onMemoryUsageChange.call(
                        callbacks.onMemoryUsageChange,
                        currentMemoryInfo,
                        previousMemoryInfo
                    );
                    previousMemoryInfo = currentMemoryInfo;
                }


            }, 300);
        }

        this.stop = function() {
            if (!running) {
                return;
            }

            clearInterval(interval);

            running = false;
        }

        this.getMemoryInfo = function() {
            return previousMemoryInfo;
        }
    }


    var Test = function(items, start) {

        var Handler = function() {
            var used = false;

            this.goto = function(key) {
                if(used) return;

                if(key in items) {
                    items[key].call(new Handler());
                }
            }
        }

        var handler = new Handler();
        handler.goto(start);
    }


    var ws = function(host, callback) {
        var ws = new WebSocket(host);
        var id = 0;
        var callbacks = {};
        var methods = {}

        var execute = function() {
            var method = arguments[0];
            var params = Array.prototype.slice.call(arguments, 1);
            var callback = function() {}

            if(params.length > 0 && typeof params[params.length-1] === "function") {
                callback = params.pop();
            }

            var request = {
                id: id,
                method: method,
                data: params
            }


            ws.send(JSON.stringify({ request: request }));
            callbacks[id] = callback;
            id++;
        }


        ws.onopen = function() {
            console.log('open');

            var test_id = getCookie(CONFIG.COOKIE_NAME);

            execute('__start__', test_id, function(response) {
                setCookie(CONFIG.COOKIE_NAME, response.test_id, 3);
                var names = response.methods;
                var methods = {}

                for(var i=0; i<names.length; i++) {
                    var name = names[i];
                    methods[name] = (function(name){
                        return function() {
                            var params = [name].concat(Array.prototype.slice.call(arguments));
                            execute.apply(execute, params);
                        }
                    })(name);
                }

                if(callback) {
                    callback.call(methods);
                }
            });
        }

        ws.onmessage = function(message) {
            message = JSON.parse(message.data);
            var request = message.request;
            var response = message.response;

            if(response) {
                var id = response.id;
                if(id in callbacks) {
                    callbacks[id].call(callbacks[id], response.data);
                    delete callbacks[id];
                }
            } else if(request) {
                console.log('Request');
            }
        }

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

            chrome.runtime.sendMessage(message, function(response) {
                callback.apply(callback, response.response);
            });
        }

        var methods = {}

        methods.__get_methods__ = function() {
            this.response(Object.keys(methods));
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
        });

        return methods;

    }

    /*
        var pipe = Pipe(function() {
            var url = window.location;
            var html = '<html>' + document.documentElement.innerHTML + '</html>';
            this.getWCAG1Report(html, function(errors, warnings) {
                datalogger.wcagWarnings(warnings, function() {
                    console.log('Advertencias WCAG1', warnings);
                });
                datalogger.wcagErrors(errors, function() {
                    console.log('Errores WCAG1', errors);
                });
            });

        });
    */



    var WCAG2Contrast = (function() {

        //https://github.com/MaPePeR/jsColorblindSimulator
        var ColorMatrixMatrixes = {
            Normal:       {
                R:[100,      0,     0],
                G:  [0,    100,      0],
                B:  [0,      0, 100/*Fixed: was in the wrong spot in the original version*/]},
            Protanopia:   {
                R:[56.667, 43.333,  0],
                G:[55.833, 44.167,  0],
                B: [0,     24.167, 75.833]},
            Protanomaly:  {
                R:[81.667, 18.333,  0],
                G:[33.333, 66.667,  0],
                B: [0,     12.5,   87.5]},
            Deuteranopia: {
                R:[62.5, 37.5,  0],
                G:[70,   30,    0],
                B: [0,   30,   70]},
            Deuteranomaly:{
                R:[80,     20,      0],
                G:[25.833, 74.167,  0],
                B: [0,     14.167, 85.833]},
            Tritanopia:   {
                R:[95,  5,      0],
                G: [0, 43.333, 56.667],
                B: [0, 47.5,   52.5]},
            Tritanomaly:  {
                R:[96.667, 3.333,   0],
                G: [0,     73.333, 26.667],
                B: [0,     18.333, 81.667]},
            Achromatopsia:{
                R:[29.9, 58.7, 11.4],
                G:[29.9, 58.7, 11.4],
                B:[29.9, 58.7, 11.4]},
            Achromatomaly:{
                R:[61.8, 32,    6.2],
                G:[16.3, 77.5,  6.2],
                B:[16.3, 32.0, 51.6]}
        };

        var matrixFunction = function(matrix) {
            return function (rgb) {
                var r = rgb[0];
                var g = rgb[1];
                var b = rgb[2];
                return [
                    Math.round(r * matrix.R[0] / 100.0 + g * matrix.R[1] / 100.0 + b * matrix.R[2] / 100.0),
                    Math.round(r * matrix.G[0] / 100.0 + g * matrix.G[1] / 100.0 + b * matrix.G[2] / 100.0),
                    Math.round(r * matrix.B[0] / 100.0 + g * matrix.B[1] / 100.0 + b * matrix.B[2] / 100.0)
                ];
            };
        }


        var getRGB = function(color) {
            var rgb = color.match(/\d+/g);
            return [
                parseInt(rgb[0]),
                parseInt(rgb[1]),
                parseInt(rgb[2])
            ];
        }


        var getLuminance = function(rgb) {
            //https://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
            var Rs = rgb[0] / 255;
            var Gs = rgb[1] / 255;
            var Bs = rgb[2] / 255;

            var R = (Rs <= 0.03928) ? Rs/12.92 : Math.pow((Rs+0.055)/1.055,  2.4);
            var G = (Gs <= 0.03928) ? Rs/12.92 : Math.pow((Gs+0.055)/1.055,  2.4);
            var B = (Bs <= 0.03928) ? Bs/12.92 : Math.pow((Bs+0.055)/1.055,  2.4);

            return 0.2126 * R + 0.7152 * G + 0.0722 * B;
        }


        var getMetrics = function(element, transform){

            transform = transform || function(rgb) {return rgb}

            var style = window.getComputedStyle(element, null);

            var backgroundColor = transform(getRGB(style.backgroundColor));
            var fontColor = transform(getRGB(style.color));

            var backgroundColorLuminance = getLuminance(backgroundColor);
            var fontColorLuminance = getLuminance(fontColor);

            //https://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
            var L1 = Math.max(backgroundColorLuminance, fontColorLuminance);
            var L2 = Math.min(backgroundColorLuminance, fontColorLuminance);
            var contrastRatio = (L1 + 0.05) / (L2 + 0.05);

            //https://www.w3.org/TR/2008/REC-WCAG20-20081211/#larger-scaledef
            var fontSize = style.fontSize.match(/\d+/g)[0] * 3 / 4; //in pt
            var fontWeight = style.fontWeight;
            var largeScale = fontSize >= 18 || (fontSize >= 14 &&
                (fontWeight == 'bold' || fontWeight == 'bolder'));

            return {
                fontColor: fontColor,
                fontColorLuminance: fontColorLuminance,
                backgroundColorLuminance: backgroundColorLuminance,
                backgroundColor: backgroundColor,
                fontSize: fontSize,
                fontWeight: fontWeight,
                ratio: contrastRatio,
                AA: largeScale ? contrastRatio >= 3 : contrastRatio >= 4.5,
                AAA: largeScale ? contrastRatio >= 4.5 : contrastRatio >= 7
            }
        }


        var metrics = {}

        for(var key in ColorMatrixMatrixes) {
            metrics[key] = (function(key) {
                return function(element) {
                    return getMetrics(
                        element,
                        matrixFunction(ColorMatrixMatrixes[key])
                    );
                }
            })(key);
        }

        return metrics;

    })();


    var checker = function(check, callback, timeout, onTimeout) {
        var t0 = (new Date()).getTime();

        var interval = setInterval(function(){
            var t = (new Date()).getTime() - t0;

            if(timeout && t > timeout) {
                clearInterval(interval);
                onTimeout.call(onTimeout, t);
            } else if(check.call(check)) {
                clearInterval(interval);
                callback.call(callback, t);
            }
        }, 300);
    }


    var CheckContrast = (function() {
        var getStats = function(root, filter) {
            root = root || document;
            filter = filter || 'Normal';
            e = document.querySelectorAll('div, p, a, h1, h2, h3, h4, h5, span');

            var pass = 0;
            for(var i=0; i<e.length; i++) {
                if(WCAG2Contrast[filter](e[i]).AAA) {
                    pass++;
                }
            }

            return {
                total: e.length,
                pass: pass,
                score: pass * 100 / e.length
            }
        }

        var metrics = {}

        for(key in WCAG2Contrast) {
            metrics[key] = (function(key) {
                return function(root) {
                    return getStats(root, key);
                }
            })(key);
        }

        return metrics;
    })();


    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }


    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }


    var CheckAlt = function(root) {

        root = root || document;
        e = root.querySelectorAll('img');

        var pass = 0;
        for(var i=0; i<e.length; i++) {
            if(e[i].hasAttribute('alt')) {
                pass++;
            }
        }

        return {
            total: e.length,
            pass: pass,
            score: pass * 100 / e.length
        }
    }


    var loadView = function(text) {
        var div = document.createElement('div');
        div.innerHTML = text;
        return div.childNodes[0];
    }


    var templates = {}
    templates.spinner = '<div class="spinner"></div>';
    templates.nombre = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">¿Cual es tu nombre?</h1><input type="text" name="nombre"><input type="button" value="Aceptar" name="aceptar"></form>';
    templates.conoce_sitio = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">¿Conoces Netvibes?</h1><div class="netvibes-ux-horizontal-grid"><input type="button" value="Si" name="si"><input type="button" value="No" name="no"></div></form>';
    templates.mostrar_sitio = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">Te voy a dejar mirarlo durante 1 minuto</h1><input type="button" value="OK. Muestramelo ya!" name="continuar"></form>';
    templates.entiende_sitio = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">¿Sabes para que sirve Netvibes?</h1><div class="netvibes-ux-horizontal-grid"><input type="button" value="Creo que si" name="si"><input type="button" value="Creo que no" name="no"></div></form>';
    templates.sirve_para = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">Sobre Netvibes</h1><p>Netvibes te permite tener la información de muchos sitios en un solo lugar. Podes crear paneles a lo que le podes agregar pestañas. En estas pestañas podes agregar widgets para ver tu correo, feeds, noticias, etc. Además podes agregar apps como calculadoras, conversores o relojes. Netvibes también te permite manejar los artefactos de tu casa que estan conectados a internet</p><div class="netvibes-ux-horizontal-grid"><input type="button" value="Continuar" name="continuar"></div></form>';
    templates.si_entiende_sitio = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">Genial. A continuación te voy a redireccionar</h1><input type="button" value="Continuar" name="continuar"></form>';
    templates.crear_pestania = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">¡Vamos a hacer una prueba!</h1><p>Te voy a pedir que crees una pestaña llamada "404"</p><input type="button" value="Continuar" name="continuar"></form>';
    templates.pestania_creada = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">Excelente!</h1><p>Lograste crear la pestaña. Ahora te lo voy a poner un poco mas difícil</p><input type="button" value="Continuar" name="continuar"></form>';
    templates.pestania_no_creada = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">No importa. Voy a crearla por vos!</h1><p>Presiona continuar y aguarda unos instantes</p><input type="button" value="Continuar" name="continuar"></form>';
    templates.agregar_modulo = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">Agregando aplicaciones</h1><p>Quiero que agregues un modulo a cualquiera de las pestañas y si no tenes seleccionada la pestaña en la que lo agregaste seleccionala</p><p>Pista: Apreta el botón "Agregar" y luego elegí una de las "Aplicaciones esenciales"<input type="button" value="Voy a intentarlo" name="continuar"></form>';
    templates.can_add_module_yes = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">¡Lo hiciste Genial!</h1><p>Pudiste agregar el modulo sin problemas</p><input type="button" value="Continuar" name="continuar"></form>';
    templates.can_add_module_no = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">No pudiste agregar el modulo en la pestaña actual</h1><input type="button" value="Continuar" name="continuar"></form>';
    templates.finalizar = '<form onsubmit="return false;" class="netvibes-ux-vertical-grid"><h1 class="netvibes-ux-title">¡Lo hiciste Genial!</h1><p>Gracias por participar de esta experiencia</p><input type="button" value="Finalizar" name="finalizar"></form>';


    //crear gui
    var gui = new (function() {
        var topLayer = document.createElement('div');
        topLayer.classList.add('netvibes-ux', 'netvibes-ux-top-layer');

        this.show = function() {
            document.body.classList.add('netvibes-ux-overflow-hidden');
            topLayer.classList.remove('netvibes-ux-hidden');
        }

        this.hide = function() {
            document.body.classList.remove('netvibes-ux-overflow-hidden');
            topLayer.classList.add('netvibes-ux-hidden');
        }

        this.setView = function(view) {
            topLayer.innerHTML = '';
            topLayer.appendChild(view);
        }


        this.hide();
        document.body.appendChild(topLayer);
    })();


    ws(CONFIG.SERVER, function() {

        var datalogger = this;


        var goto = function(step) {
            datalogger.setStep(step, function(test) {
                steps[step](test);
            });
        }


        var analyzeDom = function(callback) {

            datalogger.wcag(document.documentElement.innerHTML, function(errors, warnings) {
                console.log(errors, warnings);
            });

            datalogger.alt(CheckAlt(), function(alt) {
                console.log('Texto alternativo para imagenes', alt);
            });

            datalogger.contrast(CheckContrast.Normal(), 'normal', function(contrast) {
                console.log('Contraste Normal', contrast);
            });

            datalogger.contrast(CheckContrast.Protanopia(), 'protanopia', function(contrast) {
                console.log('Contraste Protanopia', contrast);
            });

            datalogger.contrast(CheckContrast.Protanomaly(), 'protanomaly', function(contrast) {
                console.log('Contraste Protanomaly', contrast);
            });

            datalogger.contrast(CheckContrast.Deuteranopia(), 'deuteranopia', function(contrast) {
                console.log('Contraste Deuteranopia', contrast);
            });

            datalogger.contrast(CheckContrast.Deuteranomaly(), 'deuteranomaly', function(contrast) {
                console.log('Contraste Deuteranomaly', contrast);
            });
        }


        var detector = new AffectivaDetector({
            onInit: function() {
                console.log('Detección de emociones activado');
            },

            //registra cada que se produce un cambio de estado de animo
            //sonriendo, enojado, triste, etc
            onEmoji: function(status) {

                var emotion = Object.assign({emoji: status.emoji},
                    status.emotions)

                datalogger.emotion(emotion, function(emotion) {
                    console.log('Emoción actual', emotion);
                });
            },
            //registra cada que se produce un cambio en la apariencia fisica
            //sexo, edad, etnia, usa anteojos
            onAppearance: function(status) {
                datalogger.appearance(status.appearance, function(appearance) {
                    console.log('Apariencia', status.appearance);
                });
            }
        });


        var performanceMonitor = new PerformanceMonitor({
            //registra cada que se produce un cambio en el uso de memoria
            onMemoryUsageChange: function(current, previous) {
                datalogger.memory(current, function(current) {
                    console.log('Uso de memoria actual', current);
                    console.log('Uso de memoria anterior', previous);
                });
            }
        });


        var steps = {}

        steps.setUp = function(test) {

            if(!window.location.href.match(CONFIG.DASHBOARD_URL_REGEXP)) {
                window.location = CONFIG.DASHBOARD_URL;
            }

            var view = loadView(templates.spinner);

            setTimeout(function() {

                var tabsInfo = Bot.getTabsInfo();

                if(tabsInfo.length == 0) {
                    Bot.createTab(CONFIG.FIRST_TAB_NAME, function() {
                        window.location.reload();
                    });
                } if(tabsInfo.length == 1 && tabsInfo[0].title == CONFIG.FIRST_TAB_NAME) {
                    goto(CONFIG.STEPS.USER_NAME);
                } else {
                    Bot.removeAllTabs(function() {
                        window.location.reload();
                    });
                }
            }, CONFIG.SPINNER_TIME);

            gui.setView(view);
            gui.show();
        }


        steps.userName = function(test) {

            var view = loadView(templates.nombre);

            view.elements.aceptar.addEventListener('click', function() {
                datalogger.setName(view.elements.nombre.value, function(test) {
                    goto(CONFIG.STEPS.KNOW_APP);
                });
            });

            gui.setView(view);
            gui.show();
        }


        steps.knowApp = function(test) {

            var view = loadView(templates.conoce_sitio);

            view.elements.si.addEventListener('click', function() {
                datalogger.setKnowApp(true, function(test) {
                    goto(CONFIG.STEPS.UNDERSTAND_APP);
                });
            });

            view.elements.no.addEventListener('click', function() {
                datalogger.setKnowApp(false, function(test) {
                    goto(CONFIG.STEPS.SHOW_APP);
                });
            });

            gui.setView(view);
            gui.show();
        }


        steps.showApp = function(test) {

            if(!window.location.href.match(CONFIG.HOME_URL_REGEXP)) {
                window.location = CONFIG.HOME_URL;
            }

            var view = loadView(templates.mostrar_sitio);

            view.elements.continuar.addEventListener('click', function() {
                gui.hide();
                setTimeout(function() {
                    goto(CONFIG.STEPS.UNDERSTAND_APP);
                }, CONFIG.SHOW_APP_TIME);
            });

            gui.setView(view);
            gui.show();
        }


        steps.understandApp = function(test) {
            var view = loadView(templates.entiende_sitio);

            view.elements.si.addEventListener('click', function() {
                datalogger.setUnderstandApp(true, function(test) {
                    goto(CONFIG.STEPS.EXPLAIN_APP);
                });
            });

            view.elements.no.addEventListener('click', function() {
                datalogger.setUnderstandApp(false, function(test) {
                    goto(CONFIG.STEPS.EXPLAIN_APP);
                });
            });

            gui.setView(view);
            gui.show();
        }


        steps.explainApp = function(test) {
            var view = loadView(templates.sirve_para);

            view.elements.continuar.addEventListener('click', function() {
                goto(CONFIG.STEPS.CAN_CREATE_TAB);
            });

            gui.setView(view);
            gui.show();
        }

        steps.canCreateTab = function(test) {
            var view = loadView(templates.crear_pestania);

            view.elements.continuar.addEventListener('click', function() {
                goto(CONFIG.STEPS.WAIT_FOR_TAB);
            });

            gui.setView(view);
            gui.show();
        }


        steps.waitForTab = function(test) {

            if(!window.location.href.match(CONFIG.DASHBOARD_URL_REGEXP)) {
                window.location = CONFIG.DASHBOARD_URL;
            }

            gui.hide();

            setTimeout(analyzeDom, 2000);

            checker(function() {
                var tabs = document.querySelectorAll("ul.tabs>li.tab>span.innerTab>span.title");
                for(var i=0; i<tabs.length; i++) {
                    var tab = tabs[i];
                    if(tab.innerHTML == CONFIG.TAB_NAME) {
                        return true;
                    }
                }
            }, function() {
                datalogger.setCanCreateTab(true, function(test) {
                    goto(CONFIG.STEPS.CAN_CREATE_TAB_YES);
                });
            }, CONFIG.WAIT_FOR_TAB_TIME, function(test) {
                datalogger.setCanCreateTab(false, function(test) {
                    goto(CONFIG.STEPS.CAN_CREATE_TAB_NO);
                });
            });

        }


        steps.canCreateTabYes = function(test) {
            var view = loadView(templates.pestania_creada);

            view.elements.continuar.addEventListener('click', function() {
                goto(CONFIG.STEPS.CAN_ADD_MODULE);
            });

            gui.setView(view);
            gui.show();
        }


        steps.canCreateTabNo = function(test) {
            var view = loadView(templates.pestania_no_creada);

            view.elements.continuar.addEventListener('click', function() {
                goto(CONFIG.STEPS.BOT_CREATING_TAB);
            });

            gui.setView(view);
            gui.show();
        }


        steps.botCreatingTab = function(test) {

            var view = loadView(templates.spinner);

            setTimeout(function() {

                var tabTitles = Bot.getTabsInfo().map(function(tabInfo) {
                    return tabInfo.title;
                });

                if(tabTitles.indexOf(CONFIG.TAB_NAME) == -1) {
                    Bot.createTab(CONFIG.TAB_NAME, function() {
                        console.log('Creada');
                        window.location.reload();
                    });
                } else {
                    goto(CONFIG.STEPS.CAN_ADD_MODULE);
                }
            }, 5000);

            gui.setView(view);
            gui.show();
        }


        steps.canAddModule = function(test) {

            var view = loadView(templates.agregar_modulo);

            view.elements.continuar.addEventListener('click', function() {
                goto(CONFIG.STEPS.WAIT_FOR_MODULE);
            });

            gui.setView(view);
            gui.show();
        }


        steps.waitForModule = function(test) {

            if(!window.location.href.match(CONFIG.DASHBOARD_URL_REGEXP)) {
                window.location = CONFIG.DASHBOARD_URL;
            }

            if(Bot.getTabsInfo().length == 0) {
                goto(CONFIG.STEPS.SET_UP);
            }

            gui.hide();

            checker(function() {
                return document.querySelector("#maintable > div#modulesArea div.module");
            }, function() {
                datalogger.setCanAddModule(true, function(test) {
                    goto(CONFIG.STEPS.CAN_ADD_MODULE_YES);
                });
            }, CONFIG.WAIT_FOR_MODULE_TIME, function() {
                datalogger.setCanAddModule(false, function(test) {
                    goto(CONFIG.STEPS.CAN_ADD_MODULE_NO);
                });
            });

        }


        steps.canAddModuleYes = function() {
            var view = loadView(templates.can_add_module_yes);

            view.elements.continuar.addEventListener('click', function() {
                goto(CONFIG.STEPS.FINISH);
            });

            gui.setView(view);
            gui.show();
        }


        steps.canAddModuleNo = function() {
            var view = loadView(templates.can_add_module_no);

            view.elements.continuar.addEventListener('click', function() {
                goto(CONFIG.STEPS.FINISH);
            });

            gui.setView(view);
            gui.show();
        }


        steps.finish = function(test) {
            setCookie(CONFIG.COOKIE_NAME, '', 0);

            var view = loadView(templates.finalizar);
            view.elements.finalizar.addEventListener('click', function() {
                window.location = CONFIG.DASHBOARD_URL;
            });

            gui.setView(view);
            gui.show();
        }


        datalogger.getTest(function(test){
            if(!test.step) {
                goto(CONFIG.STEPS.SET_UP);
            } else {
                goto(test.step);

                if(test.step != CONFIG.STEPS.SET_UP && test.step != CONFIG.STEPS.USER_NAME) {
                    performanceMonitor.start();
                    detector.start();
                }
            }
        });

    });

})();


//https://es.shopify.com/blog/9-herramientas-para-probar-la-accesibilidad-de-un-sitio-web
//https://www.lawebera.es/accesibilidad-y-usabilidad/como-evaluar-accesibilidad-de-una-pagina-web.php
//http://accesibilidadweb.dlsi.ua.es/?menu=hr-trabajar-color
//https://www.toptal.com/designers/colorfilter


///api/my/tabs/create pageId 97824466 sort 4 title mipestania   id=page-pageId
