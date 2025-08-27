import { Container } from "./container";
import { JobStatus } from "./types";
import * as vscode from 'vscode';
import { load } from './settings';

export const trackJob = (id: number) => {

    var lastStatus = JobStatus.Queued;

    const token = setInterval(async () => {
        const job = await Container.universal.getJob(id);

        var result: any = '';
        if (job.status === JobStatus.Canceled) {
            clearInterval(token);
            result = await vscode.window.showWarningMessage(`Job ${id} canceled.`, "View Job");
        }

        if (job.status === JobStatus.Failed) {
            clearInterval(token);
            result = await vscode.window.showErrorMessage(`Job ${id} failed.`, "View Job");
        }

        if (job.status === JobStatus.Completed) {
            clearInterval(token);
            result = await vscode.window.showInformationMessage(`Job ${id} succeeded.`, "View Job");
        }

        if (job.status === JobStatus.WaitingOnFeedback && lastStatus != JobStatus.WaitingOnFeedback) {
            result = await vscode.window.showInformationMessage(`Job ${id} is waiting on feedback.`, "View Job");
        }

        if (result === "View Job") {
            const settings = load();
            const connectionName = Container.context.globalState.get("universal.connection");

            var url = settings.url;

            if (connectionName && connectionName !== 'Default') {
                const connection = settings.connections.find(m => m.name === connectionName);
                if (connection) {
                    url = connection.url;
                }
            }

            vscode.env.openExternal(vscode.Uri.parse(`${url}/admin/automation/jobs/${id}`));
        }

        lastStatus = job.status;
    }, 1000);
}