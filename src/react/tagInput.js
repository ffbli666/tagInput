var TagList = React.createClass({
    render: function() {
        var that = this;
        var createTag = function(item, index) {
            return (
                <li>
                    <div className='tag'>
                        <span className='name'>{item.name}</span>
                        <span className='remove' onClick={that.props.removeTag.bind(that, item)}>x</span>
                    </div>
                </li>
            );
        };
        return <ul>{this.props.tags.map(createTag)}</ul>;
    }
});

var TagInput = React.createClass({
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
            <div className="tag-list">
                <TagList tags={this.state.tags} removeTag={this.removeTag}/>
                <div>
                    <input ref="name" className="tag-input"  placeholder="+" onKeyDown={this.onKeyDown} />
                    &nbsp;<button type="button" className="btn btn-primary" onClick={this.addTag}>Add Tags</button>
                </div>
            </div>
        );
    },
});

var tagInput = React.render(<TagInput tags={[{name: 'tag1'},{name: 'tag2'},{name: 'tag3'}]} />, document.getElementById('example'));