import { Universal } from "./universal";
import { ExtensionContext } from "vscode";

export class Container {
    static initialize(context: ExtensionContext, universal: Universal) {
        this._context = context;
        this._universal = universal;
    }

    private static _universal: Universal;
	static get universal() {
		return this._universal;
    }
    
    private static _context: ExtensionContext;
	static get context() {
		return this._context;
	}
}
