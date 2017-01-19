module.exports = () => {
    html
        $scope.title = "The Kitchen Banner Built";
        -include("../partials/header.not.js")
        body;
            div.jumbotron;
                h1["display-3"]; $("The Kitchen Banner Built"); $h1;
                p.lead; $(`A collection of recipes maintained by <a href="https://github.com/ibanner56">ibanner56</a>, made searchable for your pleasure.`, true); $p;
                hr["my-4"];
                form({method: "POST", action: "/"})
                    div["form-group"];
                        label({for: "search"}); $("Search"); $label;
                        input$({type: "text", id: "search", name: "search", placeholder: "Search..."})["form-control"];
                        small["form-text"]["text-muted"]; $("Fulltext search! Try searching for things like 'avacado' or 'dutch oven'."); $small;
                    $div;
                $form
            $div;
            if ($scope.recipes.length) {
                ol
                for (const r of $scope.recipes) {
                    li
                        a({href: `/r/${r.slug}`}); h3; $(r.title); $h3; $a;
                        small; $(r.preview); $small;
                    $li
                }
                $ol
            }
            else {
                p; $(`No search results found.`); $p;
            }
            script;
            $(`
                $("input")[0].addEventListener("keypress", function(e) {
                    var input = $("input")[0].value + e.key;
                    console.log(input);
                });
            `, true);
            $script;
        $body
    $html
}