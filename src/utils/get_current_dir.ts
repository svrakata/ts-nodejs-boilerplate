import { fileURLToPath } from "url";
import { dirname } from "path";

const getCurrentDir = (meta: ImportMeta) => {
    const __filename = fileURLToPath(meta.url);
    const __dirname = dirname(__filename);
    return __dirname;
};

export default getCurrentDir;
