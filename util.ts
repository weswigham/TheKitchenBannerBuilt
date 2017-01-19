export function slug(name: string) {
    return name.replace(/\-/g, "---").replace(/ /g, "-").toLowerCase();
}

export function deslug(slug: string) {
    return slug.replace(/\-\-\-/g, "-").replace(/\-/g, " ");
}