import { USStateCodeCrawlingLevel } from "./processors.js";





export interface USStateCodesParserResult<T> {
    version: string;
    urls: { href: string; slug: string }[];
    nextLevel: USStateCodeCrawlingLevel;
    slug: string;
    data: T;
}

export interface USStateCodesParser<T> {
    parse: (html: string, path: string[]) => Promise<USStateCodesParserResult<T>>;
}
