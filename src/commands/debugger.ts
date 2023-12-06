import * as vscode from 'vscode';
import { load } from '../settings';
// @ts-ignore
import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';
import { DebugProtocol } from '@vscode/debugprotocol';
import { RunspaceTreeItem } from '../platform-treeview';

let adapter: UniversalDebugAdapter;

export const registerDebuggerCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.attachRunspace', (item) => attachRunspace(item, context));

    adapter = new UniversalDebugAdapter(context);

    vscode.debug.registerDebugAdapterDescriptorFactory('powershelluniversal', {
        createDebugAdapterDescriptor: (_session) => {
            return new vscode.DebugAdapterInlineImplementation(adapter);
        }
    });
}


export const attachRunspace = async (runspace: RunspaceTreeItem, context: vscode.ExtensionContext) => {
    await vscode.debug.startDebugging(undefined, {
        name: "PowerShell Universal",
        type: "powershelluniversal",
        request: "attach",
        processId: runspace.runspace.processId,
        runspaceId: runspace.runspace.id
    });
};

export class UniversalDebugAdapter implements vscode.DebugAdapter {

    constructor(context: vscode.ExtensionContext) {
        const connectionName = context.globalState.get("universal.connection");
        const settings = load();

        var appToken = settings.appToken;
        var url = settings.url;
        var rejectUnauthorized = true;
        var windowsAuth = false;

        if (connectionName && connectionName !== 'Default') {
            const connection = settings.connections.find(m => m.name === connectionName);
            if (connection) {
                appToken = connection.appToken;
                url = connection.url;
                rejectUnauthorized = !connection.allowInvalidCertificate;
            }
        }

        this.hubConnection = new HubConnectionBuilder()
            .withUrl(`${url}/debuggerhub`, { accessTokenFactory: () => appToken })
            .configureLogging(LogLevel.Information)
            .build();

        this.hubConnection.on("message", (message: string) => {
            const protocolMessage = JSON.parse(message) as DebugProtocol.ProtocolMessage;
            this.handleMessage(protocolMessage);
        });

        this.hubConnection.onclose(() => {
            vscode.window.showInformationMessage("Disconnected from PowerShell Universal Debugger.");
        });
    }

    private hubConnection: HubConnection;
    private sendMessage = new vscode.EventEmitter<DebugProtocol.ProtocolMessage>();

    readonly onDidSendMessage: vscode.Event<DebugProtocol.ProtocolMessage> = this.sendMessage.event;

    handleMessage(message: DebugProtocol.ProtocolMessage): void {
        if (this.hubConnection.state === 'Disconnected') {
            this.hubConnection.start().then(() => {
                this.handleMessage(message);
            });
            return;
        }

        switch (message.type) {
            case 'request':
                this.hubConnection.send("message", JSON.stringify(message));
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
        this.hubConnection.stop();
    }
}
