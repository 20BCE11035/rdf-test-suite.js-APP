import { ITestCase } from "../ITestCase";
import { ILdfQueryEngine } from "./ILdfQueryEngine";

/**
 * A Linked Data Fragments test case data hpmder
 */
export interface ILdfTestCase extends ITestCase<ILdfQueryEngine> {
  type: 'ldf';
}