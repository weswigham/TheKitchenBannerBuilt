import * as Koa from "koa";
import * as bodyparser from "koa-bodyparser";
import GithubWebhook, { GithubWebhookEventData } from "./github-webhook";
import * as git from "nodegit";

const app = new Koa();

app.use(bodyparser());

const hook = new GithubWebhook({
    path: "hook",
    secret: process.env.GITHUB_HOOK_SECRET || "lolnosecret"
});
hook.on("push", async (data: GithubWebhookEventData) => {
    // Update repo on disk
    const repo = await git.Clone.clone(process.env.RECIPE_BOX_TARGET || "https://github.com/ibanner56/NotRubyButChef.git", "../recipe_box");
    // TODO: Precalculate/cache stuff (fuzzy name search set, full text search index)?
});
app.use(hook.middleware());

app.use(async (ctx, next) => {
    ctx.body = ctx.url;
});

export = app;