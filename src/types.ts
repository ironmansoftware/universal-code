export type Dashboard = {
    id: number;
    name: string;
    baseUrl: string;
    status: DashboardStatus;
    processId: number;
    filePath: string;
    content: string;
    moduleContent: string;
}

export type DashboardPage = {
    modelId: number;
    name: string;
    url?: string;
    content?: string;
    dashboardId: number;
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


export type DashboardEndpoint = {
    id: string;
}

export type DashboardSession = {
    id: string;
    lastTouched: string;
    userName: string;
    endpoints: Array<DashboardEndpoint>;
    pages: Array<string>;
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

export interface Identity {
    name: string;
}

export interface Module {
    id: number;
    name: string;
    version: string;
    source: ModuleSource;
    extension: boolean;
    readOnly: boolean;
    content: string;
}

export enum ModuleSource {
    Local,
    Gallery
}

export type Repository = {
    name: string;
    url: string;
};

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

export interface Terminal {
    name: string;
    description: string;
    environment: string;
}

export interface TerminalInstance {
    id: number;
    processId: number;
    identity: Identity;
    status: TerminalStatus;
}

export enum TerminalStatus {
    Connecting,
    Connected,
    Idle,
    Terminated
}

export type FileSystemItem = {
    name: string;
    fullName: string;
    items: Array<FileSystemItem>;
    isLeaf: boolean;
    content: string;
}

export type Process = {
    id: number;
    processName: string;
    description: string;
    processId: number;
    environment: Environment
};

export type Environment = {
    name: string;
    description: string;
};

export type Runspace = {
    id: number;
    runspaceId: number;
    state: string;
    availability: string;
    processId: number;
}

export type XMLHttpRequestResponseType = {}