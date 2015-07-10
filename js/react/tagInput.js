var TagList = React.createClass({displayName: "TagList",
    render: function() {
        var that = this;
        var createTag = function(item, index) {
            return (
                React.createElement("li", null,
                    React.createElement("div", {className: "tag"},
                        React.createElement("span", {className: "name"}, item.name),
                        React.createElement("span", {className: "remove", onClick: that.props.removeTag.bind(that, item)}, "x")
                    )
                )
            );
        };
        return React.createElement("ul", null, this.props.tags.map(createTag));
    }
});

var TagInput = React.createClass({displayName: "TagInput",
    getInitialState: function() {
        return {
            tags: this.props.tags
        };
    },
    onKeyDown: function(e) {
        if ((e.keyCode == 13)) {
            this.addTag();
        }
    },
    addTag: function(e) {
        var nameDOM =  React.findDOMNode(this.refs.name);
        var name = nameDOM.value.trim();
        if (!name)
            return;

        if (this.state.tags.map(function(e) { return e.name; }).indexOf(name) >= 0) {
            alert("duplicated");
            return;
        }

        nameDOM.value = "";
        var nextItems = this.state.tags.concat([{name: name}]);
        this.setState({tags: nextItems});
    },
    removeTag: function(tag) {
        var index = this.state.tags.indexOf(tag);
        if (index < 0)
            return;

        this.state.tags.splice(index, 1)
        var nextItems = this.state.tags;
        this.setState({tags: nextItems});
    },
    getTags: function() {
        var tags = this.state.tags.map(function(e) { return e.name; });
        return tags;
    },
    getTagsSerialize: function() {
        var tags = this.state.tags.map(function(e) { return e.name; }).join(',');
        return tags;
    },
    render: function() {
        return (
            React.createElement("div", {className: "tag-list"},
                React.createElement(TagList, {tags: this.state.tags, removeTag: this.removeTag}),
                React.createElement("div", null,
                    React.createElement("input", {ref: "name", className: "tag-input", placeholder: "+", onKeyDown: this.onKeyDown}),
                    " ", React.createElement("button", {type: "button", className: "btn btn-primary", onClick: this.addTag}, "Add Tags")
                )
            )
        );
    },
});
