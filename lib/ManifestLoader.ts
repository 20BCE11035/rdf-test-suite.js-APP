import {RdfObjectLoader, Resource} from "rdf-object";
import {termToString} from "rdf-string";
import {IManifest, manifestFromResource} from "./IManifest";
import {ITestCase} from "./testcase/ITestCase";
import {ITestCaseHandler} from "./testcase/ITestCaseHandler";
import {IFetchOptions, Util} from "./Util";

/**
 * A ManifestLoader loads test suites from URLs.
 */
export class ManifestLoader {

  public static readonly DEFAULT_TEST_CASE_HANDLERS: {[uri: string]: ITestCaseHandler<ITestCase<any>>} =
    require('./testcase/TestCaseHandlers');
  public static readonly LOADER_CONTEXT = require('./context-manifest.json');

  private readonly testCaseHandlers: {[uri: string]: ITestCaseHandler<ITestCase<any>>};

  constructor(args?: IManifestLoaderArgs) {
    if (!args) {
      args = {};
    }
    this.testCaseHandlers = args.testCaseHandlers || ManifestLoader.DEFAULT_TEST_CASE_HANDLERS;
  }

  /**
   * Load the manifest from the given URL.
   * @param {string} url The URL of a manifest.
   * @param {IFetchOptions} options The fetch options.
   * @return {Promise<IManifest>} A promise that resolves to a manifest object.
   */
  public async from(url: string, options?: IFetchOptions): Promise<IManifest> {
    const objectLoader = new RdfObjectLoader({ context: ManifestLoader.LOADER_CONTEXT });
    const manifest: Resource = await this.import(objectLoader, url, options);
    return manifestFromResource(this.testCaseHandlers, options, manifest);
  }

  protected async import(objectLoader: RdfObjectLoader, urlInitial: string, options?: IFetchOptions)
    : Promise<Resource> {
    const [url, parsed] = await Util.fetchRdf(urlInitial, options);

    // Dereference the URL and load it
    try {
      await objectLoader.import(parsed);
    } catch (e) {
      console.error(new Error(`Failed to parse manifest at ${url}`).toString());
      return;
    }

    // Import all sub-manifests
    let manifest: Resource = objectLoader.resources[url];
    if (!manifest) {
      // Also try extension-less manifest URL (needed for RDFa test suite)
      manifest = objectLoader.resources[url.substr(0, url.lastIndexOf('.'))];
      if (!manifest) {
        throw new Error(`Could not find a resource ${url} in the document at ${url}`);
      }
    }
    const includeJobs: Promise<any>[] = [];
    for (const includeList of manifest.properties.include) {
      for (const include of includeList.list) {
        if (include.term.termType !== 'NamedNode') {
          throw new Error(`Found invalid manifest term ${termToString(include.term)} when parsing ${url}`);
        }
        includeJobs.push(this.import(objectLoader, include.value, options));
      }
    }
    await Promise.all(includeJobs);

    return manifest;
  }

}

export interface IManifestLoaderArgs {
  testCaseHandlers?: {[uri: string]: ITestCaseHandler<ITestCase<any>>};
}
