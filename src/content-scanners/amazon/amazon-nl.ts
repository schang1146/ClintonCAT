import { IContentScannerPlugin, IScanParameters } from '@/common/services/content-scanner.types';

class AmazonNLScanner implements IContentScannerPlugin {
    metaInfo(): string {
        return 'amazon.nl';
    }

    canScanContent(params: IScanParameters): boolean {
        return params.mainDomain === 'amazon' && params.domain.endsWith('.nl');
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async scan(params: IScanParameters): Promise<boolean> {
        console.log(`Amazon NL Scanner: ${params.domain} - ${params.mainDomain}`);
        return false;
    }
}

export default AmazonNLScanner;
