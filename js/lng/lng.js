var Expression = function() {
    var func = function (string) {
        var regex = /^([\w\d]+)[ ]*\(([\w\d, ]*)\)$/;
        var match = string.match(regex);
        if (match === null) {
            throw "Function expression parse error regex: " + regex.toString();
        };
        return {
            name: match[1].trim(),
            attribute: match[2].trim()
        };
    };

    var repeat = function (string) {
        var regex = /^([\w\d]+)[ ]*in[ ]([\w\d]+)$/;
        var match = string.trim().match(regex);
        if (match === null) {
            throw "Repeat expression parse error regex: " + regex.toString();
        };
        return {
            lhs: match[1].trim(),
            rhs: match[2].trim()
        };
    };
    return {
        func: func,
        repeat: repeat
    };
};

var LngScope = function() {
    _variable = {};
    var getVariable = function(string) {
        var props = string.trim().split('.');
        var name = props.splice(0, 1).toString().trim();
        if (!name) {
            return false;
        }

        if (this[name]) {
            return getValue(this[name], props);
        }

        if (_variable[name]) {
            return getValue(_variable[name], props);
        }
        return false;
    };

    var getValue = function(variable, props) {
        if (!props) {
            return variable
        }

        var firstProp = props.splice(0, 1).toString().trim();
        if (firstProp == "") {
            return variable;
        }

        if (!variable[firstProp]) {
            return false
        };

        return getValue(variable[firstProp], props);
    };

    return {
        getVariable: getVariable
    };
}