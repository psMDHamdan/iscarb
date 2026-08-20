/**
 * Ambient types for html-pdf-node (no official types ship with the package).
 */
declare module "html-pdf-node" {
  export interface Options {
    format?: string;
    orientation?: "portrait" | "landscape";
    printBackground?: boolean;
    margins?: { top?: string; right?: string; bottom?: string; left?: string };
    pageRanges?: string;
    args?: string[];
  }

  export interface FileInput {
    content?: string;
    url?: string;
  }

  export function generatePdf(
    file: FileInput,
    options?: Options,
    callback?: (err: Error | null, buffer: Buffer) => void
  ): Promise<Buffer>;

  export function generatePdfs(
    files: FileInput[],
    options?: Options,
    callback?: (err: Error | null, buffers: Buffer[]) => void
  ): Promise<Buffer[]>;

  const htmlPdf: {
    generatePdf: typeof generatePdf;
    generatePdfs: typeof generatePdfs;
  };
  export default htmlPdf;
}
