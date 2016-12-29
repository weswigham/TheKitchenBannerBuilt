// This is mostly plagarized from https://github.com/TinOo512/koa-github-webhook-handler
// But refactored for new koa's async/await middleware stack + typescript
import { EventEmitter } from "events";
import { createHmac } from "crypto";
import { Context } from "koa";

function sign(key: string, blob: string | Buffer) {
    return `sha1=${createHmac('sha1', key).update(blob).digest('hex')}`;
};

export interface GithubWebhookHandlerOptions {
    path: string;
    secret: string;
}

export interface GithubWebhookEventData {
    event: string;
    id: string;
    payload: any;
    protocol: string;
    host: string;
    url: string;
}

export default class GithubWebhookHandler extends EventEmitter {
    constructor(public options: GithubWebhookHandlerOptions) {
        super();

        if (typeof options !== 'object') throw new TypeError(`must provide an options object`);
        if (typeof options.path !== 'string') throw new TypeError(`must provide a 'path' option`);
        if (typeof options.secret !== 'string') throw new TypeError(`must provide a 'secret' option`);
    }

    middleware() {
        return async (ctx: Context, next: () => Promise<any>) => {
            if (ctx.request.path !== this.options.path) return await next();

            const sig = ctx.request.get('x-hub-signature');
            const event = ctx.request.get('x-github-event');
            const id = ctx.request.get('x-github-delivery');

            ctx.assert(sig, 400, 'No X-Hub-Signature found on request');
            ctx.assert(event, 400, 'No X-Github-Event found on request');
            ctx.assert(id, 400, 'No X-Github-Delivery found on request');

            const isBlobMatchingSig = sig === sign(this.options.secret, JSON.stringify(ctx.request.body));
            ctx.assert(isBlobMatchingSig, 400, 'X-Hub-Signature does not match blob signature');

            ctx.response.body = {ok: true};

            const emitData: GithubWebhookEventData = {
                event,
                id,
                payload: ctx.request.body,
                protocol: ctx.request.protocol,
                host: ctx.request.get('host'),
                url: ctx.request.url
            };

            this.emit(event, emitData);
            this.emit('*', emitData);
        };
    }
}
