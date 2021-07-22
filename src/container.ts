import { Universal } from "./universal";
import { ExtensionContext, OutputChannel, window } from "vscode";

export class Container {
    static initialize(context: ExtensionContext, universal: Universal) {
        this._context = context;
        this._universal = universal;
    }

    private static _connected : boolean;
    static get connected() {
		return this._connected;
    }
    
    static set connected(value: boolean) {
        this._connected = value;
    }

    private static _universal: Universal;
	static get universal() {
		return this._universal;
    }
    
    private static _context: ExtensionContext;
	static get context() {
		return this._context;
	}

    private static _outputPanels: Array<OutputChannel> = [];
    static getPanel(name: string) {
        let panel = this._outputPanels.find(panel => panel.name === name);
        if (!panel) {
            panel = window.createOutputChannel(name);
            this._outputPanels.push(panel);
        }   
        return panel;
    }    
}
