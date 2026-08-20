/**
 * pdfjs-dist Node loader — fixes the Turbopack "fake worker" failure.
 * ===========================================================================
 * In Node, pdfjs runs on the main thread via a "fake worker": it does
 * `await import(GlobalWorkerOptions.workerSrc)` where the default
 * (`"./pdf.worker.mjs"`) is a bundler-relative specifier that Turbopack
 * rewrites to a virtual chunk it never emits, so the load rejects with
 * `Setting up fake worker failed: Cannot find module .../pdf.worker.mjs`.
 *
 * String-literal `import()` calls are statically bundled by Turbopack and
 * absolute filesystem paths are rejected as "server relative imports". The
 * spelling Turbopack leaves to its runtime module resolver is a bare package
 * specifier: `import("pdfjs-dist/legacy/build/pdf.worker.mjs")` resolves
 * against node_modules from the app root at runtime and loads the real file.
 */
let configured = false;

/**
 * Load pdfjs-dist's DOM-free legacy build. In Node it configures the fake
 * worker's module specifier so document parsing works under Turbopack/Next.js
 * dev.
 */
export async function loadPdfjs<P = any>(): Promise<P> {
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as P & {
    GlobalWorkerOptions?: { workerSrc?: string };
  };
  if (!configured && pdfjs.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.mjs";
    configured = true;
  }
  return pdfjs;
}