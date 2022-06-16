export type Dashboard = {
    id: number;
    name: string;
    dashboardFramework: DashboardFramework;
    baseUrl: string;
    status: DashboardStatus;
    processId: number;
    filePath: string;
    content: string;
    dashboardComponents: Array<DashboardComponent>
}

export type DashboardLog = {
    log: string;
}

export type DashboardLogItem = {
    Data: string;
    Timestamp: string;
}

export enum DashboardStatus {
    Stopped,
    Started,
    StartFailed,
    Starting,
    Debugging
}


export type DashboardComponent = {
    id: number;
    name: string;
    version: string;
    path: string;
}

export type DashboardFramework = {
    id: number;
    name: string;
    version: string;
    path: string;
}

export type DashboardEndpoint = {
    id: string;
}

export type DashboardSession = {
    id: string;
    lastTouched: string;
    userName: string;
    endpoints: Array<DashboardEndpoint>;
}

export type DashboardDiagnostics = {
    memory: number;
    cpu: number;
    sessions: Array<DashboardSession>;
    endpoints: Array<DashboardEndpoint>;
}

export type Endpoint = {
    id: number;
    url: string;
    method: string | Array<string>;
    authentication: boolean;
    scriptBlock: string;
}

export type Job = {
    id: number;
    status: JobStatus;
    script: Script;
    scriptFullPath: string;
}

export type JobLog = {
    log: string;
}

export type JobPagedViewModel = {
    page: Array<Job>;
}

export enum JobStatus {
    Queued,
    Running,
    Completed,
    Failed,
    WaitingOnFeedback,
    Canceled,
    Canceling,
    Historical,
    Active
}

export type Script = {
    id: number;
    name: string;
    fullPath: string;
    content: string;
}

export type ScriptParameter = {
    id: number;
}

export type Settings = {
    repositoryPath: string;
}

export class SampleFolder {
    public name: string;
    public path: string;

    constructor(name: string, path: string) {
        this.name = name;
        this.path = path;
    }
}

export class Sample {
    public title: string;
    public description: string;
    public version: string;
    public files: Array<SampleFile>;
    public url: string;

    constructor(title: string, description: string, version: string, files: Array<SampleFile>, url: string) {
        this.title = title;
        this.description = description;
        this.version = version;
        this.files = files;
        this.url = url;
    }
}

export class SampleFile {
    constructor(file: string, content: string) {
        this.fileName = file;
        this.content = content;
    }

    public fileName: string;
    public content: string;
}

export type FileSystemItem = {
    name: string;
    fullName: string;
    items: Array<FileSystemItem>;
    isLeaf: boolean;
    content: string;
}