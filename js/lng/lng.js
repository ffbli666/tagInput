'use strict';

var Expression = (function() {
    var isFunction = function(string) {
        if (!string) {
            return false;
        }
        var regex = /^([\w\d.]+)[ ]*\(([\w\d, .]*)\)$/;
        var match = string.trim().match(regex);
        if (match === null) {
            return false;
        };
        return true;
    };
    var func = function (string) {
        var regex = /^([\w\d.]+)[ ]*\(([\w\d, .]*)\)$/;
        var match = string.trim().match(regex);
        if (match === null) {
            throw "Function expression parse error e.g. helloWorld()";
        };
        return {
            name: match[1].trim(),
            attrs: match[2].trim()
        };
    };

    var repeat = function (string) {
        var regex = /^([\w\d]+)[ ]*in[ ]([\w\d]+)$/;
        var match = string.trim().match(regex);
        if (match === null) {
            throw "Repeat expression parse error e.g. element in array";
        };
        return {
            lhs: match[1].trim(),
            rhs: match[2].trim()
        };
    };
    return {
        isFunction: isFunction,
        func: func,
        repeat: repeat
    };
})();

var LngScope = function() {
    var _alias = {};
    var _watch = [];
    var _watchlast = 0;
    var watch = function(string, handler) {
        var find = getWatchVariable.bind(this)(string);
        var needWatch = find.variable;
        var prop = find.prop;
        var id;
        if (!needWatch) {
            return false;
        }
        //console.log(needWatch);
        console.log(_watch);
        if (needWatch[prop + 'handlerID']) {
            id = needWatch[prop + 'handlerID'];
            var index = _watch.map(function(e) { return e.id; }).indexOf(id);
            if (index >= 0) {
                var watch = _watch[index];
                watch.handler.push(handler);
                return true;
            }
        }

        id = ++_watchlast;
        needWatch[prop + 'handlerID'] = id;
        var watch = {
            id: id,
            needWatch: find.variable,
            prop: prop,
            handler: [handler]
        };
        _watch.push(watch);
        //console.log(needWatch);
        needWatch.watch(prop, function(prop, oldval, newval) {
            // console.log(oldval);
             //console.log(newval);
            var newval;
            for(var i=0; i<watch.handler.length; i++){
                newval = watch.handler[i].call(this, prop, oldval, newval);
            }
            return newval;
        });

        return true;
        //needWatch[prop] = needWatch[prop];
    };

    var unwatch = function(string) {
        var find = getWatchVariable.bind(this)(string);
        var needUnwatch = find.variable;
        var prop = find.prop;
        var id;
        if (!needUnwatch) {
            return false;
        }
        if (needUnwatch[prop + 'handlerID']) {
            id = needUnwatch[prop + 'handlerID'];
            var index = _watch.map(function(e) { return e.id; }).indexOf(id);
            if (index >= 0) {
                _watch.splice(index, 1);
            }
            delete  needUnwatch[prop + 'handlerID'];
        }
        needUnwatch.unwatch(prop);
    };

    var observe = function(string, hander) {
        var find = getWatchVariable.bind(this)(string);
        var needWatch = find.variable;
        var prop = find.prop;
        if (!needWatch) {
            return false;
        }
        if (typeof needWatch[prop] !== "object") {
            return false;
        }
        //console.log(needWatch[prop]);
        Object.observe(needWatch[prop], function(changes) {
            hander.call(this, changes);
        });
        //needWatch[prop] = needWatch[prop];
    }
    var getWatchVariable = function (string) {
        if (!string) {
            return false;
        }
        var props = string.trim().split('.');
        var name = props[0].toString().trim();
        if (!name) {
            return false;
        }
        var prop = props.pop();
        var needbind;
        if (this[name]) {
            var find = _findValue(this, props);
            if (!find[prop]) {
                return false
            }
            return {
                variable: find,
                prop: prop
            };
        } else if (_alias[name]) {
            var find = _findValue(_alias, props);
            if (!find[prop]) {
                return false
            }
            return {
                variable: find,
                prop: prop
            };
        }
        return false;
    };
    var getVariable = function(string) {
        if (!string) {
            return false;
        }
        var props = string.trim().split('.');
        var name = props.splice(0, 1).toString().trim();
        if (!name) {
            return false;
        }

        if (this[name]) {
            return _findValue(this[name], props);
        }

        if (_alias[name]) {
            return _findValue(_alias[name], props);
        }
        return false;
    };

    var _findValue = function(variable, props) {
        if (!variable) {
            return false;
        }

        if (!props) {
            return variable;
        }
        var firstProp = props.splice(0, 1).toString().trim();
        if (firstProp == "") {
            return variable;
        }

        if (!variable[firstProp]) {
            return false;
        }

        return _findValue(variable[firstProp], props);
    };

    var getFunction = function(string) {
        if (!string) {
            return false;
        }
        var attrs = [];
        var ep = Expression.func(string);
        var func = getVariable.bind(this)(ep.name);
        if (!func) {
            return false;
        }

        if ( typeof func !== 'function') {
            return false;
        }

        var funcAttrs = ep.attrs.split(',');
        for (var i in funcAttrs ) {
            var variable = this.getVariable(funcAttrs[i]);
            if (variable) {
                attrs.push(variable);
            }
        }
        return {
            func: func,
            attrs: attrs
        }
    };
    var setAlias = function(alias, variable) {
        if(!alias || !variable) {
            return ;
        }
        _alias[alias] = variable;
    };

    return {
        getWatchVariable: getWatchVariable,
        getVariable: getVariable,
        getFunction: getFunction,
        setAlias: setAlias,
        $watch:watch,
        $unwatch:unwatch,
        $observe:observe
    };
};

var LngCore = function(selecton, lngScope) {
};

(function($) {
    $.fn.extend({
        lng: function(cb) {
            var self = this;
            var $scope = new LngScope();
            var lng = new LngScope(self, $scope);
            cb.call(self, $scope);
            var bind = function (dom) {
                var items = dom.find('[ng-bind]');
                items.each( function( index, element ) {
                    var value = $(element).attr('ng-bind').trim();
                    if(Expression.isFunction(value)) {
                        var findfunc = $scope.getFunction(value);
                        $(element).html(findfunc.func.apply(this, findfunc.attrs));
                    }
                    else {
                        var variable = $scope.getVariable(value);
                        if (!variable || typeof variable === 'function') {
                            return ;
                        }
                        $scope.$watch (value, function(prop, oldval, newval){
                            $(element).html(newval);
                            return newval;
                        });
                        //init render
                        var watch = $scope.getWatchVariable(value);
                        watch.variable[watch.prop] = watch.variable[watch.prop];
                    }
                });
            };
            var unbind = function(dom){
                var items = dom.find('[ng-bind]');
                items.each( function( index, element ) {
                    var value = $(element).attr('ng-bind').trim();
                    $scope.$unwatch(value);
                });
            }

            var registerEvent = function (dom, event) {
                var items = dom.find('[ng-' + event + ']');
                items.each( function( index, element ) {
                    var findfunc = $scope.getFunction($(this).attr('ng-' + event));
                    //console.log($(this).attr('ng-' + event));
                    if (!findfunc) {
                        return;
                    }

                    $(element).on(event, function(e){
                        findfunc.attrs.unshift(e);
                        findfunc.func.apply(this, findfunc.attrs);
                    });
                });
            };

            var render = function(dom) {
                bind(dom);
                registerEvent(dom, 'click');
            };

            // init get need render dom
            var renderQueue = new Array();
            var renderWatch = new Array();
            var items = self.find('[ng-repeat]');
            //console.log(items);
            items.each( function( index, element ) {
                var template = $(this).clone();
                renderQueue.push({dom: $(this).clone(), parent: $(this).parent(), type: 'repeat'});
                $(this).remove();
            });
            renderQueue.push({dom: self, type: 'root'});


            //
            console.log(renderQueue);
            //for(var i = renderQueue.length-1; i >= 0; i--) {
                //var renderObj = renderQueue[i];
            renderQueue.reverse().forEach(function( renderObj ) {
                if (renderObj.type == 'repeat') {
                    console.log(renderObj.parent);
                    var repeatEp = Expression.repeat(renderObj.dom.attr('ng-repeat'));
                    var rhs = $scope.getVariable(repeatEp.rhs);
                    if (!rhs || !rhs instanceof Array) {
                        return ;
                    }

                    $scope.$watch (repeatEp.rhs, function(prop, oldval, newval) {
                        console.log(renderObj.parent);
                        //console.log(newval);
                        renderObj.parent.empty();
                        for(var j=0; j < newval.length; j++) {
                            var item = newval[j];
                            var temp = renderObj.dom.clone();
                            $scope.setAlias(repeatEp.lhs, item);
                            bind(temp);
                            registerEvent(temp, 'click');
                            renderObj.parent.append(temp);
                        };
                        return newval;
                    });
                    //init render
                    var index = renderWatch.indexOf(repeatEp.rhs);
                    if (index < 0) {
                        renderWatch.push(repeatEp.rhs);

                        $scope.$observe (repeatEp.rhs, function(changes){
                            console.log(changes);
                            //unbind
                            var lastevent = changes.pop();
                            if (lastevent.type === "delete") {
                                $scope.setAlias(repeatEp.lhs, lastevent.oldValue);
                                unbind(renderObj.dom);
                            }
                            var newval = lastevent.object;
                            for(var j=0; j < newval.length; j++) {
                                var item = newval[j];
                                $scope.setAlias(repeatEp.lhs, item);
                                unbind(renderObj.dom);
                            };
                            //re render
                            var watch = $scope.getWatchVariable(repeatEp.rhs);
                            watch.variable[watch.prop] = watch.variable[watch.prop];
                        });
                    }
                }
                else {
                    bind(renderObj.dom);
                    registerEvent(renderObj.dom, 'click');
                }
            });
            //console.log(renderWatch);
            renderWatch.forEach(function( item ) {
                var watch = $scope.getWatchVariable(item);
                watch.variable[watch.prop] = watch.variable[watch.prop];
            });
            //watch.variable[watch.prop]
            return self;
        }
    });
})(jQuery);