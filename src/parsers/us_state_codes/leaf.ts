import { JSDOM } from "jsdom";
import { USStateCodesParser, USStateCodesParserResult } from "@/types/parser.js";
import getSlug from "@/utils/get_slug.js";
import { USStateCodeCrawlingLevel } from "@/types/processors.js";
import { BASE_URL } from "@/config/crawler.js";

type LeafData = ExtractionEntity;

export type ExtractionEntity = ExtractionEntityListing | ExtractionEntitySection;

export interface ExtractionEntityListing {
    type: "listing";
    title: string;
    slug: string;
    items: ExtractionEntityListingItem[];
}

export interface ExtractionEntitySection {
    type: "section";
    title: string;
    citation: string;
    slug: string;
    contentRaw: ExtractionEntityContent[];
    content: ExtractionEntityContent[];
}

export interface ExtractionEntityListingItem {
    name: string;
    slug: string;
    href: string;
}

export interface ExtractionEntityContent {
    level: string;
    text: string;
}

const PARSER_VERSION = "1.0.0";

class LeafParser implements USStateCodesParser<LeafData> {
    async parse(html: string, path: string[]): Promise<USStateCodesParserResult<LeafData>> {
        const dom = new JSDOM(html);
        const slug = path[path.length - 1];

        if (!slug) {
            throw new Error("Failed to find slug");
        }

        const scopedDom = dom.window.document.querySelector(".primary-content");

        if (!scopedDom) {
            throw new Error("Failed to find primary content");
        }

        const titleNode = scopedDom.querySelector(".heading-1");
        const childNodes = titleNode?.childNodes; // Get all child nodes

        if (!childNodes) {
            throw new Error("Failed to find titleTextContent");
        }

        const textNodes = Array.from(childNodes).filter(node => node.nodeType === dom.window.Node.TEXT_NODE);

        const title = textNodes[textNodes.length - 1]?.textContent?.trim();

        if (!title) {
            throw new Error("Failed to find title");
        }

        const section = scopedDom.querySelector("#codes-content");

        const nextLevel = section ? USStateCodeCrawlingLevel.END : USStateCodeCrawlingLevel.LEAF;

        let entity: ExtractionEntity | null = null;

        let urls: { href: string; slug: string }[] = [];

        if (section) {
            // extract section and end the recursion
            const citation = scopedDom.querySelector(".citation > span")?.textContent ?? "";
            const content = getSectionContent(section);
            entity = {
                type: "section" as const,
                title,
                citation,
                slug: getSlug(title),
                contentRaw: content,
                content: [],
            };
        } else {
            // extract entities
            const codesListing = Array.from(scopedDom.querySelectorAll(".codes-listing ul > li > a"));

            const entityItems: ExtractionEntityListingItem[] = codesListing
                .map((node) => {
                    const textContent = node.textContent;
                    const href = node.getAttribute("href");
                    const lastSegment = href
                        ?.split("/")
                        .filter((d) => d !== "")
                        .pop();

                    if (!textContent || !href || !lastSegment) {
                        console.error("Failed to find textContent, href or lastSegment");
                        return null;
                    }

                    const slug = getSlug(textContent);

                    return {
                        name: textContent,
                        slug,
                        href: path.join("/") + "/" + slug,
                    };
                })
                .filter((d) => d !== null);

            urls = Array.from(scopedDom.querySelectorAll(".codes-listing ul > li > a"))
                .map((node) => {
                    const href = node.getAttribute("href");
                    const lastSegment = href
                        ?.split("/")
                        .filter((d) => d !== "")
                        .pop();

                    if (!href || !lastSegment) {
                        console.error("Failed to find href or lastSegment");
                        return null;
                    }

                    return {
                        href: `${BASE_URL.slice(0, -1)}${href}`,
                        slug: getSlug(lastSegment),
                    };
                })
                .filter((d) => d !== null) as { href: string; slug: string }[];

            entity = {
                type: "listing" as const,
                title: title,
                slug: getSlug(title),
                items: entityItems,
            };
        }

        return {
            version: PARSER_VERSION,
            urls,
            slug,
            nextLevel,
            data: entity,
        };
    }
}

const getSectionContent = (section: Element): ExtractionEntityContent[] => {
    try {
        const paragraphs = Array.from(section.querySelectorAll("p"));
        const items: ExtractionEntityContent[] = [];

        for (const p of paragraphs) {
            const text = p.textContent;

            if (!text) {
                continue;
            }

            const item: ExtractionEntityContent = {
                level: "1",
                text,
            };

            items.push(item);
        }

        return items;
    } catch (error) {
        console.error("Error in getSection: ", error);
        throw error;
    }
};

export default LeafParser;
