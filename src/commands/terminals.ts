import * as vscode from 'vscode';
import { Container } from '../container';
import { TerminalTreeItem } from '../automation-treeview';
const path = require('path');

export const registerTerminalCommands = (context: vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.openTerminal', openTerminalCommand);
}


export const openTerminalCommand = async (terminal: TerminalTreeItem, context: vscode.ExtensionContext) => {
    const writeEmitter = new vscode.EventEmitter<string>();

    var str = '';
    var terminalInstanceId = 0;
    var readOnly = true;
    const pty: vscode.Pseudoterminal = {
        onDidWrite: writeEmitter.event,
        open: async () => {
            writeEmitter.fire(`Starting terminal...\r\n`);
            var terminalInstance = await Container.universal.newTerminalInstance(terminal.terminal);
            terminalInstanceId = terminalInstance.id;
            var output = await Container.universal.executeTerminalCommand(terminalInstanceId, 'prompt');
            writeEmitter.fire(output.replace(/\r\n\r\n$/, ''));
            readOnly = false;
        },
        close: () => {
            Container.universal.stopTerminalInstance(terminalInstanceId);
        },
        handleInput: async data => {
            if (readOnly) { return };

            if (data.charCodeAt(0) === 127) {
                str = str.slice(0, -1);
                writeEmitter.fire('\b \b');
                return;
            }
            else {
                writeEmitter.fire(data);
                str += data;
            }

            if (data === '\r') {
                writeEmitter.fire('\r\n');
                readOnly = true;
                var output = await Container.universal.executeTerminalCommand(terminalInstanceId, str);
                writeEmitter.fire(output);
                var output = await Container.universal.executeTerminalCommand(terminalInstanceId, 'prompt');
                writeEmitter.fire(output.replace(/\r\n\r\n$/, ''));
                str = '';
                readOnly = false;
            }
        }
    };
    const terminalInstance = vscode.window.createTerminal({ name: `Terminal (${terminal.terminal.name})`, pty });
    terminalInstance.show();
};