export interface DownloadOutput {
    url: string;
    status: "success" | "error";
    headers: Record<string, string>;
    data: string;
}
