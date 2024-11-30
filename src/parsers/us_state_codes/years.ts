import { JSDOM } from "jsdom";
import { USStateCodesParser, USStateCodesParserResult } from "@/types/parser.js";
import { USStateCodeCrawlingLevel } from "@/types/processors.js";
import { BASE_URL } from "@/config/crawler.js";

interface Year {
    name: string;
    slug: string;
    href: string;
}

export interface YearsData {
    title: string;
    description: string[];
    years: Year[];
}

class YearsParser implements USStateCodesParser<YearsData> {
    async parse(html: string, path: string[]): Promise<USStateCodesParserResult<YearsData>> {
        const dom = new JSDOM(html);
        const scopedDom = dom.window.document.querySelector("#maincontent");

        if (!scopedDom) {
            throw new Error("Failed to find main content");
        }

        const title = scopedDom.querySelector(".heading-1")?.textContent;

        if (!title) {
            throw new Error("Failed to find title");
        }

        const description = Array.from(scopedDom.querySelectorAll("p"))
            .map((d) => d.textContent)
            .filter((d) => d !== null);

        const years = Array.from(scopedDom.querySelectorAll("ul > li > a"))
            .map((d) => {
                const href = d.getAttribute("href");
                if (!href) {
                    return null;
                }
                const segments = href.split("/").filter((d) => d !== "");
                const year = segments[segments.length - 1];

                if (!year) {
                    return null;
                }
                return year;
            })
            .filter((d) => d !== null);

        const currentYear = years.map((d) => parseInt(d as string, 10)).sort((a, b) => b - a)[0];

        if (!currentYear) {
            throw new Error("Failed to find the current year");
        }

        const yearsHrefs = Array.from(scopedDom.querySelectorAll("ul > li > a"))
            .map((d) => d.getAttribute("href"))
            .filter((d) => d !== null);
        const currentYearHref = yearsHrefs[0];

        if (!currentYearHref) {
            throw new Error("Failed to find the current year href");
        }

        const slug = path[path.length - 1];

        if (!slug) {
            throw new Error("Failed to find the last slug");
        }

        return {
            version: "1.0.0",
            urls: [
                {
                    href: BASE_URL + currentYearHref,
                    slug: currentYear.toString(),
                },
            ],
            slug,
            nextLevel: USStateCodeCrawlingLevel.LEAF,
            data: {
                title,
                description,
                years: years.map((year) => ({
                    name: year,
                    slug: year,
                    href: path.join("/") + "/" + year,
                })),
            },
        };
    }
}

export default YearsParser;
