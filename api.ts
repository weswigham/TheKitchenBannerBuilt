import * as Koa from "koa";
import * as bodyparser from "koa-bodyparser";
import GithubWebhook, { GithubWebhookEventData } from "./github-webhook";
import * as git from "nodegit";
import buildIndex from "./build-index";

const app = new Koa();

app.use(bodyparser());

const hook = new GithubWebhook({
    path: "hook",
    secret: process.env.GITHUB_HOOK_SECRET || "lolnosecret"
});
hook.on("push", async (data: GithubWebhookEventData) => {
    // Update repo on disk
    const repo = await git.Clone.clone(process.env.RECIPE_BOX_TARGET || "https://github.com/ibanner56/NotRubyButChef.git", "../recipe_box");
    // TODO: Precalculate/cache more stuff (fuzzy name search set, full text search index)?
    const newIndex = await buildIndex();
    app.context.recipeSearchIndex.close(err => {
        if (err) console.error(err); // Errors closing the search index can get logged, but are probably ignorable
    });
    app.context.recipeSearchIndex = newIndex; // TODO: Figure out if this is shared between the API subapp and the parent as expected
});
app.use(hook.middleware());

app.use(async (ctx, next) => {
    ctx.body = ctx.url;
});

export = app;