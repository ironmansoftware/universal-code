import * as vscode from 'vscode';
import { SampleTreeItem } from './sample-treeview';
import { load, SetSamplesDirectory } from './settings';
import { Sample, SampleFile, SampleFolder } from './types';
const path = require('path');
const fs = require('fs');
const YAML = require('yaml')

const getSamplesPath = async () => {
    const settings = load();
    const samplesPath = process.env.APPDATA + "";

    if (settings.samplesDirectory === "") {
        await SetSamplesDirectory(samplesPath);
        return samplesPath;
    }

    return settings.samplesDirectory;
}



export const registerSampleCommands = (context : vscode.ExtensionContext) => {
    vscode.commands.registerCommand('powershell-universal.syncSamples', async () => {
        var sampleService = new SampleService();
        await sampleService.synchronizeSamples();
    });
    vscode.commands.registerCommand('powershell-universal.insertSample', insertSampleCommand);
    vscode.commands.registerCommand('powershell-universal.viewSampleOnGitHub', viewSampleOnGitHubCommand);
}

const insertSampleCommand = async (sample : SampleTreeItem) => {
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

const viewSampleOnGitHubCommand = async (sample : SampleTreeItem) => {
    vscode.env.openExternal(vscode.Uri.parse(sample.sample.url));
}

export class SampleService {
    async synchronizeSamples() {

        const settings = load();
        if (!settings.syncSamples) return;

        const sampleRoot = await getSamplesPath();
        const samplesPath = path.join(sampleRoot, "universal-samples")
        
        if (fs.existsSync(samplesPath))
        {
            await vscode.commands.executeCommand("git.openRepository", samplesPath)
            await vscode.commands.executeCommand("git.pull", samplesPath)
            await vscode.commands.executeCommand("git.close", samplesPath)
        }
        else 
        {            
            await vscode.commands.executeCommand("git.clone", 'https://github.com/ironmansoftware/universal-samples.git', sampleRoot)
        }
    }

    async getRootSamples() : Promise<Array<SampleFolder>> {
        const sampleRoot = await getSamplesPath();
        const samplesPath = path.join(sampleRoot, "universal-samples")

        if (!fs.existsSync(samplesPath))
        {
            return [];
        }

        return fs.readdirSync(samplesPath).filter((fileName : string) => {
            return (fileName !== "README.md" && fileName !== "LICENSE" && fileName !== ".git" )
        }).map((fileName : string) => {
            return new SampleFolder(fileName, path.join(samplesPath, fileName));
        })
    }

    async getFolderChildren(folder : SampleFolder) : Promise<Array<Sample | SampleFolder>> {
        const sampleRoot = await getSamplesPath();
        const samplesPath = path.join(sampleRoot, "universal-samples")

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

                    const sampleBase = itemPath.replace(samplesPath, '').split('\\').join('/')
                    const url = `https://github.com/ironmansoftware/universal-samples/blob/main${sampleBase}`

                    return new Sample(info.title, info.description, info.version, files, url);
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

                const sampleBase = itemPath.replace(samplesPath, '').split('\\').join('/')
                const url = `https://github.com/ironmansoftware/universal-samples/blob/main${sampleBase}`
                return new Sample(info.title, info.description, info.version, [file], url);
            }
        })
    }
}