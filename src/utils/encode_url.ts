const encodeUrl = (url: string): string => {
    // Encode the URL string to Base64
    return Buffer.from(url).toString("base64");
};

export default encodeUrl;
