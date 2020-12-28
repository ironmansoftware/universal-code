import { start } from 'repl';
import * as vscode from 'vscode';
import { getVSCodeDownloadUrl } from 'vscode-test/out/util';
import { Container } from './container';
import { SampleTreeItem } from './sample-treeview';
import { Sample, SampleFile, SampleFolder } from './types';
const path = require('path');
const fs = require('fs');
const YAML = require('yaml')

const samplesPath = path.join(process.env.APPDATA, "universal-samples");

export const registerSampleCommands = (context : vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.syncSamples', async () => {
        var sampleService = new SampleService();
        await sampleService.synchronizeSamples();
    });
    vscode.commands.registerCommand('powershell-universal.insertSample', insertSampleCommand);
}

const insertSampleCommand = async (sample : SampleTreeItem) => {

    Container.universal.saveConfiguration("../nice.ps1", 'coolstuff');

    for(let file of sample.sample.files) {
        let document : vscode.TextDocument | undefined = await vscode.commands.executeCommand("powershell-universal.openConfigFile", file);
        if (document) {
            var we = new vscode.WorkspaceEdit();

            var content = file.content;
            if (document.lineCount != 0) 
            {
                content = "\r\n" + content;
            }

            we.insert(document.uri, new vscode.Position(document.lineCount, 0), content);
            vscode.workspace.applyEdit(we);
        }
    }
}

export class SampleService {
    async synchronizeSamples() {
        
        if (fs.existsSync(samplesPath))
        {
            await vscode.commands.executeCommand("git.openRepository", samplesPath)
            await vscode.commands.executeCommand("git.pull", samplesPath)
            await vscode.commands.executeCommand("git.close", samplesPath)
        }
        else 
        {
            await vscode.commands.executeCommand("git.clone", 'https://github.com/ironmansoftware/universal-samples.git', process.env.APPDATA)
        }
    }

    getRootSamples() : Array<SampleFolder> {
        return fs.readdirSync(samplesPath).filter((fileName : string) => {
            return (fileName !== "README.md" && fileName !== "LICENSE" && fileName !== ".git" )
        }).map((fileName : string) => {
            return new SampleFolder(fileName, path.join(samplesPath, fileName));
        })
    }

    getFolderChildren(folder : SampleFolder) : Array<Sample | SampleFolder> {
        return fs.readdirSync(folder.path).map((fileName : string) => {
            const itemPath = path.join(folder.path, fileName);
            if (fs.lstatSync(itemPath).isDirectory())
            {
                if (fs.readdirSync(itemPath).find((m : string) => m === "manifest.yml")) 
                {
                    let manifest : string = fs.readFileSync(path.join(itemPath, "manifest.yml"), 'utf8');
                    const info = YAML.parse(manifest);

                    const files = fs.readdirSync(itemPath).filter((m : string) => m !== "manifest.yml").map((sampleFileName : string) => {
                        let script : string = fs.readFileSync(path.join(itemPath, sampleFileName), 'utf8');
                        return new SampleFile(sampleFileName, script);
                    })

                    return new Sample(info.title, info.description, info.version, files);
                }
                else 
                {
                    return new SampleFolder(fileName, itemPath)
                }
            }
            else 
            {
                let script : string = fs.readFileSync(itemPath, 'utf8');
                const startIndex = script.indexOf("<#") + 2;
                const endIndex = script.indexOf("#>");
                const manifest = script.substr(startIndex, endIndex - startIndex);
                const info = YAML.parse(manifest);

                script = script.substr(endIndex + 2); 

                var file = new SampleFile(info.file, script);

                return new Sample(info.title, info.description, info.version, [file]);
            }
        })
    }
}