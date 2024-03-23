import * as RDF from "rdf-js";
import { IQueryResult } from "../sparql/IQueryEngine";

/**
 * A query engine handler for Linked Data Fragments.
 */
export interface ILdfQueryEngine {
  parse(queryString: string, options: {[key: string]: any}) : Promise<void>;
  query(dataSource: string, queryString: string, options: {[key: string]: any}): Promise<IQueryResult>;
}