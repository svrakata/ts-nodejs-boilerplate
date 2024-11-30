import { BASE_URL } from "@/config/crawler.js";
import { USStateCodesParser, USStateCodesParserResult } from "@/types/parser.js";
import { USStateCodeCrawlingLevel } from "@/types/processors.js";
import { JSDOM } from "jsdom";

interface State {
    name: string;
    slug: string;
    href: string;
}

export interface StatesData {
    slug: string;
    type: "states";
    states: State[];
}

const PARSER_VERSION = "1.0.0";

class StatesParser implements USStateCodesParser<StatesData> {
    async parse(html: string, path: string[]): Promise<USStateCodesParserResult<StatesData>> {
        const dom = new JSDOM(html);
        const scopedDom = dom.window.document.querySelector("#maincontent");
        if (!scopedDom) {
            throw new Error("Could not find '#maincontent' element");
        }

        const anchors = scopedDom.querySelectorAll("ul > li > a");
        const anchorsArray = Array.from(anchors);

        const stateAnchors = anchorsArray.filter((anchor) => {
            const href = anchor.getAttribute("href");
            if (href === null) {
                return false;
            }

            if (href.startsWith("/codes/") && href !== "/codes/us/") {
                return true;
            }

            return false;
        });

        const stateCodes = stateAnchors.map((anchor) => {
            const href = anchor.getAttribute("href");
            if (href === null) {
                throw new Error("Anchor does not have an href attribute");
            }

            const slug = href.replace("/codes/", "").replace("/", "");
            return {
                name: anchor.textContent || "",
                slug,
                href: path.join("/") + slug,
            };
        });

        return {
            version: PARSER_VERSION,
            slug: "/",
            urls: stateAnchors.map((anchor) => {
                const href = anchor.getAttribute("href");
                if (href === null) {
                    throw new Error("Anchor does not have an href attribute");
                }
                return {
                    href: BASE_URL + href,
                    slug: href.replace("/codes/", "").replace("/", ""),
                };
            }),
            nextLevel: USStateCodeCrawlingLevel.YEARS,
            data: {
                slug: "/",
                type: "states",
                states: stateCodes,
            },
        };
    }
}

export default StatesParser;
