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
    var watch = function(string, hander) {
        var find = getWatchVariable.bind(this)(string);
        var needWatch = find.variable;
        var prop = find.prop;
        if (!needWatch) {
            return false;
        }
        needWatch.watch(prop, function(prop, oldval, newval){
            hander.call(this, prop, oldval, newval);
            return newval;
        });
        //needWatch[prop] = needWatch[prop];
    }
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
            return {
                variable: _findValue(this, props),
                prop: prop
            };
        } else if (_alias[name]) {
            return {
                variable: _findValue(_alias, props),
                prop: prop
            };
        }
        return false;
    }
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
    var getAlias = function() {
        return _alias;
    }
    return {
        getWatchVariable: getWatchVariable,
        getVariable: getVariable,
        getFunction: getFunction,
        setAlias: setAlias,
        getAlias: getAlias,
        $watch:watch,
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
            var bind = function (dom, string) {
                var items = dom.find('[ng-bind]');
                items.each( function( index, element ) {
                    var value = $(element).attr('ng-bind').trim();
                    if(Expression.isFunction(value)) {
                        var findfunc = $scope.getFunction(value);
                        $(element).html(findfunc.func.apply(this, findfunc.attrs));
                    }
                    else {
                        var variable = $scope.getVariable(value);
                        if (!variable || typeof variable !== 'string') {
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
            var items = self.find('[ng-repeat]');
            //console.log(items);
            items.each( function( index, element ) {
                var template = $(this).clone();
                renderQueue.push({dom: $(this).clone(), parent: $(this).parent(), type: 'repeat'});
                $(this).remove();
            });
            renderQueue.push({dom: self, type: 'root'});
            //console.log(renderQueue.length);
            for(var i = renderQueue.length-1; i >= 0; i--) {
                var renderObj = renderQueue[i];
            //renderQueue.reverse().forEach(function( renderObj ) {
                if (renderObj.type == 'repeat') {
                    var repeatEp = Expression.repeat(renderObj.dom.attr('ng-repeat'));
                    var rhs = $scope.getVariable(repeatEp.rhs);
                    if (!rhs || !rhs instanceof Array) {
                        return ;
                    }
                    $scope.$watch (repeatEp.rhs, function(prop, oldval, newval){
                        //console.log(newval);
                        renderObj.parent.empty();
                        newval.forEach(function(item) {
                            var temp = renderObj.dom.clone();
                            $scope.setAlias(repeatEp.lhs, item);
                            bind(temp);
                            registerEvent(temp, 'click');
                            renderObj.parent.append(temp);
                        });
                        return newval;
                    });
                    //init render
                    var watch = $scope.getWatchVariable(repeatEp.rhs);
                    watch.variable[watch.prop] = watch.variable[watch.prop];

                    $scope.$observe (repeatEp.rhs, function(changes){
                        watch.variable[watch.prop] = watch.variable[watch.prop];
                    });
                }
                else {
                    bind(renderObj.dom);
                    registerEvent(renderObj.dom, 'click');
                }
            };

            return self;
        }
    });
})(jQuery);