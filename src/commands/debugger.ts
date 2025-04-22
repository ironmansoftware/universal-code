import * as vscode from 'vscode';
import { DebugProtocol } from '@vscode/debugprotocol';
import { RunspaceTreeItem } from '../platform-treeview';
import { Container } from '../container';

export const registerDebuggerCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.attachRunspace', (item) => attachRunspace(item, context));

    vscode.debug.registerDebugAdapterDescriptorFactory('powershelluniversal', {
        createDebugAdapterDescriptor: (_session) => {
            return new vscode.DebugAdapterInlineImplementation(new UniversalDebugAdapter());
        }
    });
}


export const attachRunspace = async (runspace: RunspaceTreeItem, context: vscode.ExtensionContext) => {
    await vscode.debug.startDebugging(undefined, {
        name: "PowerShell Universal",
        type: "powershelluniversal",
        request: "attach",
        processId: runspace.process.processId,
        runspaceId: runspace.runspace.runspaceId
    });
};

export class UniversalDebugAdapter implements vscode.DebugAdapter {
    constructor() {
        Container.universal.registerDebugAdapter(this);
    }

    private sendMessage = new vscode.EventEmitter<DebugProtocol.ProtocolMessage>();

    readonly onDidSendMessage: vscode.Event<DebugProtocol.ProtocolMessage> = this.sendMessage.event;

    handleMessage(message: DebugProtocol.ProtocolMessage): void {
        switch (message.type) {
            case 'request':
                var request = message as DebugProtocol.Request;
                if (request.command === 'disconnect') {
                    Container.universal.unregisterDebugAdapter();
                } else {
                    Container.universal.sendDebuggerMessage(request);
                }
                break;
            case 'response':
                this.sendMessage.fire(message);
                break;
            case 'event':
                this.sendMessage.fire(message);
                break;
        }
    }

    dispose() {
        Container.universal.unregisterDebugAdapter();
    }
}
