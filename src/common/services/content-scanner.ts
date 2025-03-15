// The 'require.context' feature depends on WebPack (@types/webpack)
const context: __WebpackModuleApi.RequireContext = require.context('../../content-scanners', true, /\.ts$/, 'sync');
import DefaultScanner from '@/content-scanners/default-scanner';
import objectKeys from '@/utils/helpers/object-keys';
import { IContentScannerPlugin, IScanParameters } from './content-scanner.types';

class ContentScanner {
    private scannerPlugins: IContentScannerPlugin[] = [];
    private defaultScannerPlugin: IContentScannerPlugin = new DefaultScanner();

    constructor() {
        this.findScannerPlugins();
    }

    public async checkPageContents(scannerParameters: IScanParameters): Promise<void> {
        for (const plugin of this.scannerPlugins) {
            // TODO: memoize the result ?
            if (plugin.canScanContent(scannerParameters)) {
                console.log(`Found a plugin that can handle request: ${scannerParameters.domain}`);
                // TODO: allow multiple handlers ?
                const didFindPages = await plugin.scan(scannerParameters);
                if (didFindPages) return;
            }
        }
        console.log('Using default content scanner');
        await this.defaultScannerPlugin.scan(scannerParameters);
    }

    private findScannerPlugins(): void {
        context.keys().map((filename) => {
            try {
                const module = context(filename) as Record<string, new () => IContentScannerPlugin>;
                const className = objectKeys(module)[0];
                const Class = module[className];
                const obj: IContentScannerPlugin = new Class();
                this.scannerPlugins.push(obj);
                console.log(`Added content scanner plugin: ${className}`, ' metainfo: ', obj.metaInfo());
            } catch (error) {
                console.error('Failed to add content scanner plugin: ', filename, error);
            }
        });
    }
}

export default ContentScanner;
