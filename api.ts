import * as Koa from "koa";
import * as bodyparser from "koa-bodyparser";
import * as git from "nodegit";
import * as mount from "koa-mount";
import GithubWebhook, { GithubWebhookEventData } from "./github-webhook";
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
    const {index, cache} = await buildIndex(repo);
    app.context.recipeSearchIndex.close(err => {
        if (err) console.error(err); // Errors closing the search index can get logged, but are probably ignorable
    });
    app.context.recipeSearchIndex = index; // TODO: Figure out if this is shared between the API subapp and the parent as expected
    app.context.recipeSlugMap = cache;
});
app.use(hook.middleware());

app.use(mount("/suggest", async (ctx, next) => {
    if (ctx.method !== "GET") {
        ctx.status = 405;
        return;
    };
    if (!ctx.query) {
        ctx.body = { error: "Query parameters not supplied" };
        ctx.status = 400;
        ctx.type = "json";
    }
    if (!ctx.query["input"]) {
        ctx.body = { error: "Required query parameter 'input' not supplied" };
        ctx.status = 400;
        ctx.type = "json";
    }
    const matches: string[] = [];
    await new Promise((resolve, reject) => {
        app.context.recipeSearchIndex.match({beginsWith: ctx.query["input"], limit: 5, threshold: 3})
        .on("data", (match: string) => {
            matches.push(match);
        })
        .on("end", () => {
            resolve();
        })
        .on("error", (err: any) => reject(err));
    });
    ctx.type = "json";
    ctx.body = { results: matches };
    ctx.status = 200;
}));

export = app;