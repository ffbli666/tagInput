var tagApp = angular.module('tagApp', []);

tagApp.controller('TagListCtrl', function ($scope) {
    $scope.tags = [
        {name: 'tag1'},
        {name: 'tag2'},
        {name: 'tag3'}
    ];
    $scope.add = function(e) {
        if ($scope.tagText){
            var tag = angular.lowercase($scope.tagText)
            if ($scope.tags.map(function(e) { return e.name; }).indexOf(tag) >= 0) {
                alert("duplicated");
                return;
            }
            $scope.tags.push({name: tag});
            $scope.tagText = '';
        }
    }
    
    $scope.input = function(e) {
        if ((e.keyCode == 13)) {
            $scope.add();
        }
    }

    $scope.removeTag = function(tagToRemove) {
        console.log(tagToRemove);
        var index = $scope.tags.indexOf(tagToRemove);
        $scope.tags.splice(index, 1);
    };

    $scope.getTags = function() {
        console.log($scope.tags.map(function(e) { return e.name; }));
        return $scope.tags.map(function(e) { return e.name; });
    };

    $scope.getTagsSerialize = function() {
        return $scope.tags.map(function(e) { return e.name; }).join(',');
    };
});