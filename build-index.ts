import * as git from "nodegit";
import * as searchIndex from "search-index";
import * as path from "path";

export interface Document {
    title: string;
    fulltext: string;
}

export default function buildIndex(provided?: git.Repository) {
    return new Promise<searchIndex.Index<Document>>((resolve, reject) => {
        searchIndex<Document>({preserveCase: false}, async (err, si) => {
            if (err) return reject(err);
            const repo = provided || await git.Repository.open("../recipe_box");
            const masterCommit = await repo.getBranchCommit("master");
            const diff = await git.Diff.treeToTree(repo, null, await masterCommit.getTree());
            const patches = await diff.patches();
            const objects = await Promise.all(patches.map(async (p) => {
                const file = p.newFile();
                return {path: file.path(), content: (await repo.getBlob(file.id())).content()};
            }));
            const recipes: Document[] = objects.filter(o => o.path.endsWith(".md") && !o.path.endsWith("README.md")).map(o => {
                return {title: path.basename(o.path).split(/(?=[A-Z])/).join(" "), fulltext: o.content.toString()}
            });
            si.concurrentAdd({fieldOptions: {}}, recipes, err => {
                if (err) return reject(err);
                resolve(si);
            });
        });
    })
}