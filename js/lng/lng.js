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
    }
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
    var watch = function(watchExpression, hander) {
        // var regex = /^([\w\d.]+)$/;
        // var match = string.trim().match(regex);
        // if (match === null) {
        //     throw "watch expression parse error e.g. val";
        // };
        var props = watchExpression.trim().split('.');
        _getValue
        var oldval, newval;

        var getter = function () {
            return newval;
        };

        var setter = function (val) {
            oldval = newval;
            return newval = handler.call(this, prop, oldval, val);
        };


        if (delete this[prop]) { // can't watch constants
            Object.defineProperty(this, prop, {
                  get: getter
                , set: setter
                , enumerable: true
                , configurable: true
            });
        }
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
            return _getValue(this[name], props);
        }

        if (_alias[name]) {
            return _getValue(_alias[name], props);
        }
        return false;
    };

    var _getValue = function(variable, props) {
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

        return _getValue(variable[firstProp], props);
    };

    var getFunction = function(string) {
        if (!string) {
            return false;
        }
        var attrs = [];
        var ep = Expression.func(string);
        var func = this.getVariable(ep.name);
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
    }
    var setAlias = function(alias, variable) {
        if(!alias || !variable) {
            return ;
        }
        _alias[alias] = variable;
    }
    return {
        $watch: watch,
        getVariable: getVariable,
        getFunction: getFunction,
        setAlias: setAlias
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
                        // $scope.watch(variable, function(prop, oldval, newval){
                        //     $(element).html(newval);
                        //     return newval;
                        // });
                        //$(element).html(variable);
                    }
                    //if (!$scope[variable] || typeof $scope[variable] !== 'string') return;
                    // $scope.watch(variable, function(prop, oldval, newval){
                    //     $(element).html(newval);
                    //     return newval;
                    // });
                    // $scope[variable] = $scope[variable];
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
                    //$scope.setAlias(repeatEp.lhs, rhs);
                    //console.log(rhs);
                    rhs.forEach(function(item) {
                        var temp = renderObj.dom.clone();
                        $scope.setAlias(repeatEp.lhs, item);
                        bind(temp);
                        registerEvent(temp, 'click');
                        renderObj.parent.append(temp);
                    })
                    //console.log(repeatEp);
                    //registerEvent(renderObj.dom, 'click');
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