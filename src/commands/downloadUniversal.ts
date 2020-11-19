import * as vscode from 'vscode';
const os = require('os'); 
const https = require('https');
const fs = require('fs');
const temp = require('temp');
var AdmZip = require('adm-zip');
const path = require('path');
import { SetServerPath } from './../settings'

export const downloadUniversal = async () => {
    temp.track();

    let platform = '';
    switch(os.platform())
    {
        case 'darwin':
            platform = 'osx';
            break;
        case 'linux':
            platform = 'linux';
            break;
        case 'win32':
            platform = 'win7';
            break;
        default:
            vscode.window.showErrorMessage("Unsupported platform");
            return;
    }

    return new Promise((resolve, reject) => {
        https.get('https://imsreleases.blob.core.windows.net/universal/production/version.txt', (resp : any) => {
            let data = '';
    
            // A chunk of data has been recieved.
            resp.on('data', (chunk : string) => {
                data += chunk;
            });
    
            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                temp.open('universal', function(err : any, info : any) {
                    const file = fs.createWriteStream(info.path);

                    file.on('finish', function () {
                        file.close();

                        const universalPath = path.join(process.env.APPDATA, "PowerShellUniversal");
    
                        var zip = new AdmZip(info.path);
                        zip.extractAllTo(universalPath, true);

                        SetServerPath(path.join(process.env.APPDATA, "PowerShellUniversal")).then(() => resolve());
                    });

                    https.get(`https://imsreleases.blob.core.windows.net/universal/production/${data}/Universal.${platform}-x64.${data}.zip`, function(response : any) {
                        response.pipe(file);
                    });
                });
            });
    
            }).on("error", (err : any) => {
                vscode.window.showErrorMessage(err.message);
                reject();
            });
    })
}

export const downloadUniversalCommand = () => {
    return vscode.commands.registerCommand('powershell-universal.downloadUniversal', downloadUniversal);
}
