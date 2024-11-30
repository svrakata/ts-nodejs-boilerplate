import { USStateCodeCrawlingLevel } from "@/types/processors.js";
import StatesParser from "./states.js";
import YearsParser from "./years.js";
import LeafParser from "./leaf.js";

class USStateCodesParserFactory {
    public static create(level: USStateCodeCrawlingLevel) {
        switch (level) {
            case USStateCodeCrawlingLevel.STATES:
                return new StatesParser();
            case USStateCodeCrawlingLevel.YEARS:
                return new YearsParser();
            case USStateCodeCrawlingLevel.LEAF:
                return new LeafParser();
            default:
                throw new Error(`Unknown level: ${level}`);
        }
    }
}

export default USStateCodesParserFactory;
