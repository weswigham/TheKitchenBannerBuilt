import * as Koa from "koa";
import * as notjs from "not.js";
import * as favicon from "koa-favicon";
import * as path from "path";
import * as fs from "fs";

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
  const ms = process.hrtime(start);
  console.log('%s %s - %ss %sns', ctx.method, ctx.url, ms[0], ms[1]);
});

// Favicon handling middleware
app.use(favicon(path.join(__dirname, "favicon.ico")));

// Site API Middleware
app.use(async (ctx, next) => {
    if (!ctx.url.startsWith("/api/")) return await next();
    ctx.body = ctx.url;
});

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

// Site Page Rendering Middleware
app.use(async (ctx, next) => {
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

app.listen(app.env === "development" ? 3000 : 80);