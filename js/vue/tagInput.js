var TagInput = Vue.extend({
    data: {
        tags: []
    },
    methods: {
        addTag : function(e) {
            if (this.tagText){
                var tag = this.tagText.trim().toLowerCase();
                if (this.tags.map(function(e) { return e.name; }).indexOf(tag) >= 0) {
                    alert("duplicated");
                    return;
                }
                this.tags.push({name: tag});
                this.tagText = '';
            }
        },
        removeTag : function(tagToRemove) {
            var index = this.tags.indexOf(tagToRemove);
            if (index < 0) return;
            this.tags.splice(index, 1);
        },
        getTags : function() {
            var tags = this.tags.map(function(e) { return e.name; });
            $('.result').append('<li>' + tags +'</li>');
            return tags;
        },
        getTagsSerialize : function() {
            return this.tags.map(function(e) { return e.name; }).join(',');
        },
        input : function(e) {
            this.addTag();
        }
    }
});
