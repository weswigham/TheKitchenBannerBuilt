module.exports = () => {
    html
        $scope.title = "The Kitchen Banner Built";
        -include("../partials/header.not.js")
        body()
            h1; $(`This is a test`); $h1;
            form({method: "POST", action: "index.html"})
                input$({type: "text", name: "search", placeholder: "Search..."})
            $form
            ol
            for (const r of $scope.recipes) {
                li
                    h3; $(r.title); $h3;
                    small; $(r.preview); $small;
                $li
            }
            $ol
        $body
    $html
}