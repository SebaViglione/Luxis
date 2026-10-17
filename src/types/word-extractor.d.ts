declare module 'word-extractor' {
  interface Documento { getBody(): string; getFootnotes?(): string; getHeaders?(): string }
  export default class WordExtractor { extract(input: string | Buffer): Promise<Documento> }
}
