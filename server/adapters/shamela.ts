/**
 * AZWO Shamela Adapter
 * Server-side only. Never expose SHAMELA_API_KEY to browsers.
 *
 * This is a contract/skeleton until official API access and usage rights
 * are confirmed with Shamela.
 */

export type ShamelaBook = {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  metadata?: Record<string, unknown>;
};

export type ShamelaPassage = {
  bookId: string;
  location?: string;
  text: string;
  metadata?: Record<string, unknown>;
};

export interface ShamelaAdapter {
  searchBooks(query: string): Promise<ShamelaBook[]>;
  getBook(bookId: string): Promise<ShamelaBook | null>;
  searchWithinBook(bookId: string, query: string): Promise<ShamelaPassage[]>;
}

export class ShamelaV4Adapter implements ShamelaAdapter {
  constructor(
    private readonly config: {
      apiKey: string;
      booksEndpoint: string;
      masterPatchEndpoint?: string;
    }
  ) {
    if (!config.apiKey) throw new Error("Missing SHAMELA_API_KEY");
    if (!config.booksEndpoint) throw new Error("Missing SHAMELA books endpoint");
  }

  async searchBooks(_query: string): Promise<ShamelaBook[]> {
    // TODO after official API contract is confirmed.
    // Keep this server-side and normalize all returned metadata.
    throw new Error("Shamela API integration is not enabled yet");
  }

  async getBook(_bookId: string): Promise<ShamelaBook | null> {
    throw new Error("Shamela API integration is not enabled yet");
  }

  async searchWithinBook(_bookId: string, _query: string): Promise<ShamelaPassage[]> {
    throw new Error("Shamela API integration is not enabled yet");
  }
}
