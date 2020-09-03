export type Dashboard = {
    id : number;
    name : string;
    dashboardFramework : DashboardFramework;
    baseUrl : string;
    status: DashboardStatus;
    processId : number;
    filePath : string;
    dashboardComponents : Array<DashboardComponent>
}

export enum DashboardStatus
{
    Stopped, 
    Started,
    StartFailed,
    Starting,
    Debugging
}


export type DashboardComponent = {
    id : number;
    name : string;
    version : string;
    path : string;
}

export type DashboardFramework = {
    id : number;
    name : string;
    version : string;
    path : string;
}

export type DashboardEndpoint = {
    id : string;
}

export type DashboardSession = {
    id : string;
    lastTouched : string;
    userName : string; 
    endpoints : Array<DashboardEndpoint>;
}

export type DashboardDiagnostics = {
    memory : number;
    cpu : number; 
    sessions : Array<DashboardSession>;
    endpoints : Array<DashboardEndpoint>;
}

export type Endpoint = {
    id : number;
    url : string;
    method: string;
    authentication : boolean;
}

export type Settings = {
    repositoryPath : string;
}