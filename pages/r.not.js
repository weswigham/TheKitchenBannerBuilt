module.exports = () => {
    html
        $scope.title = $scope.document.title;
        -include("../partials/header.not.js")
        body()
            $($scope.rendered, true);
        $body
    $html
}