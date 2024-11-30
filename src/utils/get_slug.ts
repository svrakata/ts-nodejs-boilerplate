const getSlug = (str: string): string => {
    const slug = str
        .toLowerCase()
        .trim()
        .replace(/§§/g, "sections")     // Replace §§ with 'sections'
        .replace(/§/g, "section")      // Replace § with 'section'
        .replace(/[(){}\[\]]/g, "")    // Remove brackets: (), [], {}
        .replace(/'/g, "")             // Remove single quotes
        .replace(/[\u2013\u2014]/g, "-") // Replace en-dash/em-dash with hyphen
        .replace(/[.,:;]/g, "")         // Remove punctuation
        .replace(/\s+/g, "-")           // Replace spaces with a single hyphen
        .replace(/-+/g, "-");           // Replace multiple hyphens with a single hyphen
    return slug;
};

export default getSlug;
