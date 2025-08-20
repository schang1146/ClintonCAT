import { CATWikiPageSearchResults } from '@/database';

export abstract class BaseScanner {
    abstract scan(): CATWikiPageSearchResults;
}
