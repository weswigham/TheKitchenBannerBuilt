module.exports = () => {
    html
        $scope.title = $scope.document.title;
        -include("../partials/header.not.js")
        body["container-fluid"];
            div.jumbotron;
                h1["display-3"]; a["fixed-color"]({href: "/"}); $("The Kitchen Banner Built"); $a; $h1;
                p.lead; $($scope.title); $p;
            $div;
            $($scope.rendered, true);
        $body
    $html
}