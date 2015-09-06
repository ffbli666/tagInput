(function($) {
    $.fn.extend({
        TagInput: function(tags) {
            var self = this;
            var tagData = self.find('.tag-data');
            var tagDataTemp = tagData.find('li');
            var _tags = tags;

            var _removeTag = function(value) {
                var index = _tags.map(function(e) { return e.name; }).indexOf(value);
                if (index < 0) return;
                _tags.splice(index, 1);
            };

            var _addTag = function(value) {
                if (!value) return;
                var tag = value.toLowerCase();
                if (_tags.map(function(e) { return e.name; }).indexOf(tag) >= 0) {
                    return false;
                }
                _tags.push({name: tag});
                return true;
            };

            var _getTags = function() {
                var tags = _tags.map(function(e) { return e.name; });
                return tags;
            };

            var _addTagItem = function(value) {
                var newData = tagDataTemp.clone();
                newData.find('.name').html(value);
                newData.find('.remove').click(function(){
                    _removeTag(value);
                    newData.remove();
                });
                tagData.append(newData);
            }
            var _addTagOpt = function(){
                var value = tagInput.val().trim();
                if (!value) return;
                if (!_addTag(value)){
                    alert("duplicated");
                    return;
                }
                _addTagItem(value);
                tagInput.val('');
            }

            //init display tags
            tagData.empty();
            _tags.forEach(function(element, index, array) {
                _addTagItem(element.name);
            })

            //add tags event register
            var tagInput = self.find('.tag-input');
            tagInput.keydown(function( event ) {
                if (event.keyCode == 13) {
                    _addTagOpt();
                };
            });

            self.find('.tag-add').click(_addTagOpt);

            //get tags event register
            self.find('.tag-get').click(function (){
                var tags = _getTags();
                $('.result').append('<li>' + tags +'</li>');
            });
            return this;
        }
    });
})(jQuery);