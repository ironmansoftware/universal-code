import * as vscode from 'vscode';
import { Dashboard, DashboardDiagnostics, Settings, Endpoint, Script, Job, ScriptParameter, JobPagedViewModel, JobLog, FileSystemItem, DashboardPage, Terminal, TerminalInstance } from './types';
import axios, { AxiosPromise } from 'axios';
import { load, SetAppToken, SetUrl } from './settings';
import { Container } from './container';
const https = require('https');

export class Universal {
    private context: vscode.ExtensionContext;
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    hasConnection(): boolean {
        const settings = load();
        if (settings.appToken === '' && settings.connections.length === 0) {
            return false;
        }
        return true;
    }

    request(path: string, method: any, data: any = null, contentType = 'application/json'): AxiosPromise<any> | undefined {

        const settings = load();
        const connectionName = this.context.globalState.get("universal.connection");

        if (!this.hasConnection()) {
            return;
        }

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

        https.globalAgent.options.rejectUnauthorized = true;
        const agent = new https.Agent({
            rejectUnauthorized
        });

        return axios({
            url: `${url}${path}`,
            method,
            headers: {
                authorization: windowsAuth ? null : `Bearer ${appToken}`,
                'Content-Type': contentType
            },
            data: data,
            httpsAgent: agent
        });
    }

    getVersion(): Promise<string> {
        return new Promise((resolve) => {
            this.request('/api/v1/version', 'GET')?.then(x => resolve(x.data)).catch(x => {
                resolve("failed");
            })
        })
    }

    async getReleasedVersion() {
        const response = await axios.get("https://imsreleases.blob.core.windows.net/universal/production/version.txt");
        return response?.data;
    }

    async installAndLoadModule() {
        try {
            const settings = load();
            if (settings.checkModules) {
                const version = await Container.universal.getVersion();

                var appToken = settings.appToken;
                var url = settings.url;
                const connectionName = this.context.globalState.get("universal.connection");

                if (connectionName && connectionName !== 'Default') {
                    const connection = settings.connections.find(m => m.name === connectionName);
                    if (connection) {
                        appToken = connection.appToken;
                        url = connection.url;
                    }
                }

                Container.universal.sendTerminalCommand(`Import-Module (Join-Path '${__dirname}' 'Universal.VSCode.psm1')`);
                Container.universal.sendTerminalCommand(`Install-UniversalModule -Version '${version}'`);
                Container.universal.sendTerminalCommand(`Connect-PSUServer -ComputerName '${url}' -AppToken '${appToken}'`);
                Container.connected = true;
            }
        }
        catch
        {

        }
    }

    async isAlive(url: string) {
        try {
            await axios({
                url: `${url}/api/v1/alive`,
                method: "get"
            });
            return true;
        } catch { }
        return false;
    }

    async waitForAlive() {
        const settings = load();


        var retries = 0;

        const connectionName = this.context.globalState.get("universal.connection");
        var url = settings.url;

        if (connectionName && connectionName !== 'Default') {
            const connection = settings.connections.find(m => m.name === connectionName);
            if (connection) {
                url = connection.url;
            }
        }

        let disposable = vscode.window.setStatusBarMessage(`Attempting to connect to PowerShell Universal at ${url}`);

        while (retries < 60) {
            if (await this.isAlive(url)) {
                disposable.dispose();
                return true;
            }
            retries++;
        }

        vscode.window.showWarningMessage(`Failed to connect to PowerShell Universal. Ensure that the server is running on ${settings.url}.`);

        disposable.dispose();
        return false;
    }

    async grantAppToken(): Promise<boolean> {
        const settings = load();

        const connectionName = this.context.globalState.get("universal.connection");
        var url = settings.url;

        if (connectionName && connectionName !== 'Default') {
            const connection = settings.connections.find(m => m.name === connectionName);
            if (connection) {
                url = connection.url;
            }
        }

        const transport = axios.create({
            withCredentials: true
        });

        var response = await transport.post(`${url}/api/v1/signin`, {
            username: 'admin',
            password: 'admin'
        });

        if (response.data.errorMessage && response.data.errorMessage !== '') {
            var result = await vscode.window.showErrorMessage("We couldn't generate an App Token automatically. You will have to do it manually.", "View Admin Console");
            if (result === "View Admin Console") {
                vscode.env.openExternal(vscode.Uri.parse(`${url}/admin/settings/security`))
            }
            return false;
        }

        const [cookie] = response.headers["set-cookie"];

        transport.defaults.headers.Cookie = cookie;

        const appToken = await transport.get(`${url}/api/v1/appToken/grant`, {
            headers: {
                Cookie: cookie
            }
        });

        await SetAppToken(appToken.data.token);

        return true;
    }

    addDashboard(): Promise<Dashboard> {
        return new Promise((resolve, reject) => {
            this.request('/api/v1/dashboard', 'POST')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    addDashboardPage(dashboardId: number, page: DashboardPage): Promise<DashboardPage> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${dashboardId}/page`, 'POST', page)?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    deleteDashboardPage(dashboardId: number, pageId: number): Promise<any> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${dashboardId}/page/${pageId}`, 'DELETE')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    startDashboard(id: number): Promise<Dashboard> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}/status`, 'PUT')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    stopDashboard(id: number): Promise<Dashboard> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}/status`, 'DELETE')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getDashboard(id: number): Promise<Dashboard> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getDashboardPages(id: number): Promise<Array<DashboardPage>> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}/page`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getDashboardPage(dashboardId: number, id: number): Promise<DashboardPage> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${dashboardId}/page/${id}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getDashboardDiagnostics(id: number): Promise<DashboardDiagnostics> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}/diagnostics`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getDashboardLog(name: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/logging/log/file?feature=app&resource=${name}&take=1000`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getDashboards(): Promise<Array<Dashboard>> {
        return new Promise((resolve, reject) => {
            if (!this.hasConnection()) {
                resolve([]);
            }
            this.request('/api/v1/dashboard', 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    saveDashboard(id: number, dashboard: Dashboard) {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}`, 'PUT', dashboard)?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    saveDashboardPage(id: number, dashboardId: number, page: DashboardPage) {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${dashboardId}/page/${id}`, 'PUT', page)?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    executeDashboardTerminal(dashboardId: number, sessionId: string, pageId: string, command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${dashboardId}/terminal/${sessionId}/${pageId}`, 'POST', {
                command
            })?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getDiagnostics(id: number): Promise<DashboardDiagnostics> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/dashboard/${id}/diagnostics`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getEndpoints(): Promise<Array<Endpoint>> {
        return new Promise((resolve, reject) => {
            if (!this.hasConnection()) {
                resolve([]);
            }
            this.request('/api/v1/endpoint', 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getJob(id: number): Promise<Job> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/job/${id}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getJobLog(id: number): Promise<JobLog> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/job/${id}/log`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getScripts(): Promise<Array<Script>> {
        return new Promise((resolve, reject) => {
            if (!this.hasConnection()) {
                resolve([]);
            }
            this.request('/api/v1/script', 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    newTerminalInstance(terminal: Terminal): Promise<TerminalInstance> {
        return new Promise((resolve, reject) => {
            this.request('/api/v1/terminal/instance', 'POST', terminal)?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    stopTerminalInstance(terminalInstanceId: number): Promise<TerminalInstance> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/terminal/instance/${terminalInstanceId}`, 'DELETE')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    executeTerminalCommand(terminalInstanceId: number, command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/terminal/instance/${terminalInstanceId}`, 'POST', JSON.stringify(command))?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }


    getTerminals(): Promise<Array<Terminal>> {
        return new Promise((resolve, reject) => {
            if (!this.hasConnection()) {
                resolve([]);
            }
            this.request('/api/v1/terminal', 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getTerminalInstances(): Promise<Array<TerminalInstance>> {
        return new Promise((resolve, reject) => {
            if (!this.hasConnection()) {
                resolve([]);
            }
            this.request(`/api/v1/terminal/instance`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getJobs(): Promise<JobPagedViewModel> {
        return new Promise((resolve, reject) => {
            if (!this.hasConnection()) {
                resolve({
                    page: []
                });
            }

            this.request('/api/v1/job?take=50&orderBy=Id&orderDirection=Descending', 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getScript(id: number): Promise<Script> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/script/${id}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getScriptFilePath(filePath: string): Promise<Script> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/script/path/${filePath}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    saveScript(script: Script): Promise<Script> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/script/`, 'PUT', script)?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getScriptParameters(id: number): Promise<Array<ScriptParameter>> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/script/${id}/parameter`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    runScript(id: number): Promise<number> {
        return new Promise((resolve, reject) => {
            const jobContext = {}
            this.request(`/api/v1/script/${id}`, 'POST', jobContext)?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    refreshConfig(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration`, 'POST')?.then(() => resolve(null)).catch(x => {
                reject(x.message);
            })
        })
    }

    getSettings(): Promise<Settings> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/settings`, 'GET')?.then(x => resolve(x.data[0])).catch(x => {
                reject(x.message);
            })
        })
    }

    getConfigurations(): Promise<Array<string>> {
        return new Promise((resolve, reject) => {
            if (!this.hasConnection()) {
                resolve([]);
            }

            this.request(`/api/v1/configuration/list`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getEndpoint(endpoint: Endpoint): Promise<Endpoint> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/endpoint/${endpoint.id}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject();
            })
        })
    }

    saveEndpoint(endpoint: Endpoint): Promise<Endpoint> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/endpoint/${endpoint.id}`, 'PUT', endpoint)?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }


    getConfiguration(fileName: string): Promise<string> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration/${fileName}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                resolve('');
            })
        })
    }

    saveConfiguration(fileName: string, data: string) {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration/${fileName}`, 'PUT', data)?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    saveFileContent(fileName: string, data: string) {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration/content/${fileName}`, 'PUT', {
                content: data
            })?.then(x => resolve(x.data)).catch(x => {
                reject(x.message);
            })
        })
    }

    getFileContent(fileName: string): Promise<FileSystemItem> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration/content/${fileName}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x);
            })
        })
    }


    getFiles(fileName: string): Promise<Array<FileSystemItem>> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration/list/${fileName}`, 'GET')?.then(x => resolve(x.data)).catch(x => {
                reject(x);
            })
        })
    }

    newFile(fileName: string): Promise<Array<FileSystemItem>> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration/item/`, 'POST', {
                fullName: fileName,
                isLeaf: true
            })?.then(x => resolve(x.data)).catch(x => {
                reject(x);
            })
        })
    }


    newFolder(folderName: string): Promise<Array<FileSystemItem>> {
        return new Promise((resolve, reject) => {
            this.request(`/api/v1/configuration/item/`, 'POST', {
                fullName: folderName,
                isLeaf: false
            })?.then(x => resolve(x.data)).catch(x => {
                reject(x);
            })
        })
    }

    sendTerminalCommand(command: string) {
        var terminal = vscode.window.terminals.find(x => x.name === "PowerShell Extension");
        if (terminal == null) {
            vscode.window.showErrorMessage("PowerShell Terminal is missing!");
        }
        terminal?.sendText(command, true);
    }

    connectDashboard(id: number) {
        this.sendTerminalCommand(`Debug-PSUDashboard -Id ${id}`);
    }

    debugDashboardEndpoint(id: string) {
        this.sendTerminalCommand(`Get-PSUDashboardEndpointRunspace -Id ${id} | Debug-Runspace`);
    }

    connectUniversal(url: string) {
        axios.get(url).then(x => {
            SetUrl(x.data.url);
            SetAppToken(x.data.appToken);
            vscode.window.showInformationMessage(`You are connected to ${x.data.url}`);

            Container.connected = false;
            vscode.commands.executeCommand('powershell-universal.refreshAllTreeViews');
        }).catch(() => {
            vscode.window.showErrorMessage('Failed to connect to Universal.');
        })
    }

    async showConnectionError(message: string) {
        const result = await vscode.window.showErrorMessage(message + " This is a connection error. Click Settings to adjust your connection settings or App Tokens to generate a new token.", "Settings", "App Tokens");
        if (result === 'Settings') {
            vscode.commands.executeCommand('workbench.action.openSettings', "PowerShell Universal");
        }

        if (result === 'App Tokens') {
            const settings = load();
            const connectionName = this.context.globalState.get("universal.connection");

            var url = settings.url;

            if (connectionName && connectionName !== 'Default') {
                const connection = settings.connections.find(m => m.name === connectionName);
                if (connection) {
                    url = connection.url;
                }
            }

            vscode.env.openExternal(vscode.Uri.parse(`${url}/admin/security/tokens`));
        }
    }
}
