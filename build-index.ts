/// <reference types="node" />
import * as git from "nodegit";
import * as searchIndex from "search-index";
import * as path from "path";
import {slug} from "./util";

export interface Document {
    title: string;
    fulltext: string;
}

export default function buildIndex(provided?: git.Repository) {
    return new Promise<{index: searchIndex.Index<Document>, cache: {[index: string]: Document}}>((resolve, reject) => {
        searchIndex<Document>({preserveCase: false, nGramLength: 2}, async (err, si) => {
            if (err) return reject(err);
            const repo = provided || await git.Repository.open("../recipe_box");
            const masterCommit = await repo.getBranchCommit("master");
            const diff = await git.Diff.treeToTree(repo, null, await masterCommit.getTree());
            const patches = await diff.patches();
            const uniqueness: {[index: string]: git.Oid} = {};
            const objects = await Promise.all(patches.map((p) => {
                const file = p.newFile();
                return {path: file.path(), id: file.id()};
            }).filter(o => {
                return !(o.path in uniqueness) && (uniqueness[o.path] = o.id);
            }).map(async o => ({path: o.path, content: (await repo.getBlob(o.id)).content()})));
            const map: {[index: string]: Document} = {};
            const recipes: Document[] = objects.filter(o => o.path.endsWith(".md") && !o.path.endsWith("README.md")).map(o => {
                const name = path.basename(o.path);
                const doc = {title: name.substring(0, name.length-3).split(/(?=[A-Z])/).join(" "), fulltext: o.content.toString()};
                map[slug(doc.title)] = doc;
                return doc;
            });
            si.concurrentAdd({fieldOptions: {}}, recipes, err => {
                if (err) return reject(err);
                resolve({index: si, cache: map});
            });
        });
    })
}