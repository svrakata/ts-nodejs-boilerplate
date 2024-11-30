import { createHash } from "crypto";

export const getHash = (content: string): string => {
    const hash = createHash("sha256");
    hash.update(content);
    return hash.digest("hex");
};
