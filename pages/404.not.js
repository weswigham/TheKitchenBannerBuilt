module.exports = () => {
    html
        $scope.title = "Page Not Found";
        -include("../partials/header.not.js")
        body
            h1; $(`The page you were looking for (${$scope.url}) doesn't seem to exist`); $h1;
        $body
    $html
};