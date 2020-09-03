import * as vscode from 'vscode';
import { Dashboard, DashboardDiagnostics, Settings, Endpoint } from './types';
import axios, { AxiosPromise } from 'axios';
var path = require('path');
import {load, SetAppToken} from './settings';

export class Universal {
    private context : vscode.ExtensionContext;
    constructor(context : vscode.ExtensionContext) {
        this.context = context;
    }

    request(path : string, method: any) : AxiosPromise<any> | undefined {

        const settings = load();

        if (settings.appToken == null || settings.computerName == null) 
        {
            vscode.window.showErrorMessage("Not connected");
            return;
        }

        let address = settings.computerName;
        if (!address.toLocaleLowerCase().startsWith('http'))
        {
            address = `http://${address}`;
        }

        return axios({ 
            url: `${address}:${settings.port}${path}`,
            method,
            headers : {
                authorization: `Bearer ${settings.appToken}`
            }
        });
    }

    load() {
    }

    async getVersion() {
        const response = await this.request("/api/v1/version", "get");
        return response?.data;
    }

    async waitForAlive() {
        const settings = load();

        let address = settings.computerName;
        if (!address.toLocaleLowerCase().startsWith('http'))
        {
            address = `http://${address}`;
        }

        while(true) {
            try 
            {
                await axios({ 
                    url: `${address}:${settings.port}/api/v1/alive`,
                    method: "get"
                });

                break;
            }
            catch {}
        }
    }

    async grantAppToken() {
        const settings = load();

        let address = settings.computerName;
        if (!address.toLocaleLowerCase().startsWith('http'))
        {
            address = `http://${address}`;
        }

        const transport = axios.create({
            withCredentials: true
        })

        var response = await transport.post(`${address}:${settings.port}/api/v1/signin`, {
            username: 'admin',
            password: 'any'
        });

        const [cookie] = response.headers["set-cookie"];

        transport.defaults.headers.Cookie = cookie;

        const appToken = await transport.get(`${address}:${settings.port}/api/v1/appToken/grant`, {
            headers: {
                Cookie: cookie
            }
        });

        SetAppToken(appToken.data.token);
    }

    connect(computerName : string, appToken : string) {
        // this.context.globalState.update(COMPUTER_NAME, computerName);
        // this.context.globalState.update(APPTOKEN, appToken);

        // this.computerName = computerName;
        // this.appToken = appToken;

        // this.sendTerminalCommand(`Connect-UAServer -ComputerName '${computerName}' -AppToken ${appToken}`);
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

    getDashboards() : Promise<Array<Dashboard>> {
        return new Promise((resolve, reject) => {
            this.request('/api/v1/dashboard', 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject('Failed to query dashboards.');
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

    getSettings() : Promise<Settings> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/settings`, 'GET')?.then(x => resolve(x.data[0])).catch(x => {
                reject('Failed to query settings.');
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