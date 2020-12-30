import * as vscode from 'vscode';
import { Dashboard, DashboardDiagnostics, Settings, Endpoint, Script, Job, ScriptParameter, DashboardLog } from './types';
import axios, { AxiosPromise } from 'axios';
var path = require('path');
import {load, SetAppToken} from './settings';

export class Universal {
    private context : vscode.ExtensionContext;
    constructor(context : vscode.ExtensionContext) {
        this.context = context;
    }

    request(path : string, method: any, data : any = null) : AxiosPromise<any> | undefined {

        const settings = load();

        if (settings.appToken == null || settings.appToken === "") 
        {
            vscode.window.showErrorMessage("Not connected");
            return;
        }

        return axios({ 
            url: `${settings.url}${path}`,
            method,
            headers : {
                authorization: `Bearer ${settings.appToken}`,
                'Content-Type': 'application/json'
            },
            data: data
        });
    }

    load() {
    }

    getVersion() : Promise<string> {
        return new Promise((resolve) => {
            this.request('/api/v1/version', 'GET')?.then(x => resolve(x.data)).catch(x => {                
            })
        })
    }

    async getReleasedVersion() {        
        const response = await axios.get("https://imsreleases.blob.core.windows.net/universal/production/version.txt");
        return response?.data;
    }

    async isAlive(url : string) {
        try {
            await axios({ 
                url: `${url}/api/v1/alive`,
                method: "get"
            });
            return true;
        } catch {}
        return false; 
    }

    async waitForAlive() {
        const settings = load();

        let disposable = vscode.window.setStatusBarMessage(`Attempting to connect to PowerShell Universal at ${settings.url}`)
        var retries = 0;

        while(retries < 60) {
            if (await this.isAlive(settings.url))
            {
                disposable.dispose();
                return true;
            }
            retries++;
        }

        vscode.window.showWarningMessage(`Failed to connect to PowerShell Universal. Ensure that the server is running on ${settings.url}.`);

        disposable.dispose();
        return false;
    }

    async grantAppToken() : Promise<boolean> {
        const settings = load();

        const transport = axios.create({
            withCredentials: true
        })

        var response = await transport.post(`${settings.url}/api/v1/signin`, {
            username: 'admin',
            password: 'any'
        });

        if (response.data.errorMessage && response.data.errorMessage !== '')
        {
            var result = await vscode.window.showErrorMessage("We couldn't generate an App Token automatically. You will have to do it manually.", "View Admin Console");
            if (result === "View Admin Console")
            {
                vscode.env.openExternal(vscode.Uri.parse(`${settings.url}/admin/settings/security`))
            }
            return false;
        }

        const [cookie] = response.headers["set-cookie"];

        transport.defaults.headers.Cookie = cookie;

        const appToken = await transport.get(`${settings.url}/api/v1/appToken/grant`, {
            headers: {
                Cookie: cookie
            }
        });

        await SetAppToken(appToken.data.token);

        return true;
    }

    addDashboard() : Promise<Dashboard> {
        return new Promise((resolve, reject) => {
            this.request('/api/v1/dashboard', 'POST')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query dashboards.');
            })
        })
    }

    startDashboard(id : number) : Promise<Dashboard> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}/status`, 'PUT')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to start dashboard.');
            })
        })
    }

    stopDashboard(id : number) : Promise<Dashboard> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}/status`, 'DELETE')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to stop dashboard.');
            })
        })
    }

    getDashboard(id : number) : Promise<Dashboard> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query dashboards.');
            })
        })
    }

    getDashboardLog(id : number) : Promise<DashboardLog> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}/log`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query dashboard log.');
            })
        })
    }

    getDashboards() : Promise<Array<Dashboard>> {
        return new Promise((resolve, reject) => {
            this.request('/api/v1/dashboard', 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query dashboards.');
            })
        })
    }

    saveDashboard(id : number, dashboard : Dashboard) {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}`, 'PUT', dashboard)?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to save dashboard.');
            })
        })
    }

    getDiagnostics(id : number) : Promise<DashboardDiagnostics> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}/diagnostics`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query dashboard diagnostics.');
            })
        })
    }

    getEndpoints() : Promise<Array<Endpoint>> {
        return new Promise((resolve, reject) => {
            this.request('/api/v1/endpoint', 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query endpoints.');
            })
        })
    }

    getJob(id : number) : Promise<Job> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/job/${id}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query job.');
            })
        })
    }

    getScripts() : Promise<Array<Script>> {
        return new Promise((resolve, reject) => {
            this.request('/api/v1/script', 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query scripts.');
            })
        })
    }

    getScript(id : number) : Promise<Script> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/script/${id}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query script.');
            })
        })
    }

    getScriptFilePath(filePath : string) : Promise<Script> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/script/path/${filePath}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query script.');
            })
        })
    }

    saveScript(script : Script) {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/script/`, 'PUT', script)?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to save script.');
            })
        })
    }

    getScriptParameters(id : number) : Promise<Array<ScriptParameter>> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/script/${id}/parameter`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query job.');
            })
        })
    }

    runScript(id : number) : Promise<number> {
        return new Promise((resolve, reject) => {
            const jobContext = {}
            this.request(`/api/v1/script/${id}`, 'POST', jobContext)?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query scripts.');
            })
        })
    }

    refreshConfig() : Promise<any> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration`, 'POST')?.then(() => resolve(null)).catch(x => {
                reject('Failed refresh configuration.');
            })
        })
    }

    getSettings() : Promise<Settings> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/settings`, 'GET')?.then(x => resolve(x.data[0])).catch(x => {
                reject('Failed to query settings.');
            })
        })
    }

    getConfigurations() : Promise<Array<string>> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query configurations.');
            })
        })
    }

    getConfiguration(fileName : string) : Promise<string> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration/${fileName}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                resolve('');
            })
        })
    }

    saveConfiguration(fileName : string, data : string) {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration/${fileName}`, 'PUT', data)?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to save configuration.');
            })
        })
    }

    sendTerminalCommand(command : string) {
        var terminal = vscode.window.terminals.find(x => x.name === "PowerShell Integrated Console");
        if (terminal == null) {
            vscode.window.showErrorMessage("PowerShell Terminal is missing!");
        }

        terminal?.sendText(command, true);
    }

    connectDashboard(id : number) {
        this.sendTerminalCommand(`Debug-PSUDashboard -Id ${id}`);
    }

    debugDashboardEndpoint(id : string) {
        this.sendTerminalCommand(`Get-PSUDashboardEndpointRunspace -Id ${id} | Debug-Runspace`);
    }
}