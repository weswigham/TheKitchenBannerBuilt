/// <reference types="node" />

import * as Koa from "koa";
import * as notjs from "not.js";
import * as favicon from "koa-favicon";
import * as mount from "koa-mount";
import * as staticfiles from "koa-static";
import * as path from "path";
import * as fs from "fs";

declare module "koa" {
    interface Context {
        recipeSearchIndex: Index<Document>;
        recipeSlugMap: {[index: string]: Document};
    }
}

const app = new Koa();

// Highest level error handling middleware
app.use(async (ctx, next) => {  
    try {
        await next();
    } catch (err) {
        if (app.env === "development") {
            ctx.body = { message: err.message, stack: err.stack };
        }
        else {
            ctx.body = { message: "Internal Server Error" }; // TODO: Render 500 page
        }
        ctx.status = err.status || 500;
    }
});

// Perf logging middleware
app.use(async (ctx, next) => {
  const start = process.hrtime();
  await next();
  const time = process.hrtime(start);
  console.log('%s %s - %ss %sns', ctx.method, ctx.url, time[0], time[1]);
});

// Favicon handling middleware
app.use(favicon(path.join(__dirname, "static/favicon.ico")));

// Static Site Assets
app.use(mount("/static", staticfiles("./static")));

// Site API Middleware
import api = require("./api");
app.use(mount("/api", api));

async function fileExists(path: string) {
    return await new Promise<boolean>((resolve, reject) => {
        try {
            fs.stat(path, (err, stats) => {
                if (err) return resolve(false);
                resolve(true);
            });
        }
        catch (e) {
            resolve(false);
        }
    });
}

import {Index} from "search-index";
import {Document} from "./build-index";
import {slug, deslug} from "./util";

async function titleExists(index: Index<Document>, title: string) {
    const hits = await new Promise<number>((resolve, reject) => {
        index.totalHits({
            query: {
                AND: {
                    "title": [deslug(title)]
                }
            },
        }, (err, count) => {
            if (err) return reject(err);
            resolve(count);
        });
    });
    return hits > 0;
}

import marked = require("marked");

app.use(mount("/r", async (ctx, next) => {
    const url = ctx.url.substring(1);
    console.log(`Checking for existance of /r/${url}`);
    if (ctx.recipeSlugMap[url]) {
        console.log(`Rendering /r/${url}...`);
        const entry = ctx.recipeSlugMap[url];
        const renderContext = {
            document: entry,
            rendered: marked(entry.fulltext),
        };
        ctx.body = notjs.renderFunc(require("./pages/r.not.js"), renderContext, undefined, path.dirname(path.join(__dirname, "./pages/r.not.js")));
    }
    else {
        await next();
    }
}));

// Site Page Rendering Middleware
app.use(async (ctx, next) => {
    if (ctx.url === "/") {
        console.log(`Rendering index...`);
        const context = {
            recipes: (await new Promise<{title: string, preview: string}[]>((resolve, reject) => {
                const recipes: {title: string, preview: string}[] = [];
                ctx.recipeSearchIndex.search({
                    query: {
                        AND: {"*": ["*"]}
                    },
                    pageSize: 400
                })
                .on("data", ({document: data}: {document: Document}) => {
                    if (recipes.find(r => r.title === data.title)) return;
                    recipes.push({title: data.title, preview: data.fulltext.length > 50 ? `${data.fulltext.substring(0, 50)}...` : data.fulltext});
                })
                .on("end", () => {
                    resolve(recipes);
                })
                .on("error", (err: any) => {
                    reject(err);
                });
            })).sort((a, b) => a.title.localeCompare(b.title)).map(o => ({title: o.title, preview: o.preview, slug: slug(o.title)}))
        };
        ctx.body = notjs.renderFunc(require("./pages/index.not.js"), context, undefined, path.dirname(path.join(__dirname, "./pages/index.not.js")));
        return;
    }
    const template = path.join(__dirname, "./pages", `${ctx.url}.not.js`);
    const indexTemplate = path.join(__dirname, "./pages", `${ctx.url}/index.not.js`);
    if (await fileExists(template)) {
        console.log(`Rendering ${template}...`);
        ctx.body = notjs.renderFunc(require(template), ctx, undefined, path.dirname(template));
    }
    else if (await fileExists(indexTemplate)) {
        console.log(`Rendering ${indexTemplate}...`);
        ctx.body = notjs.renderFunc(require(indexTemplate), ctx, undefined, path.dirname(indexTemplate));
    }
    else {
        console.log(`Rendering 404 for ${ctx.url}...`);
        ctx.body = notjs.renderFunc(require("./pages/404.not.js"), ctx, undefined, path.dirname(path.join(__dirname, "./pages/404.not.js")));
        ctx.status = 404;
        ctx.type = "html";
    }
});

import buildIndex from "./build-index";
buildIndex().then(({index, cache}) => {
    app.context.recipeSearchIndex = index;
    app.context.recipeSlugMap = cache;
    app.listen(app.env === "development" ? 3000 : 80);
});