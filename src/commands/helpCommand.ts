import * as vscode from 'vscode';

const help = () => {
    return vscode.commands.registerCommand('powershell-universal.help', async (item : vscode.TreeItem) => {

        let url = '';
        switch(item.label) {
            case "Documentation":
                url = "https://docs.ironmansoftware.com"
                break;
            case "Forums":
                url = "https://forums.universaldashboard.io"
                break;
            case "Issues":
                url = "https://github.com/ironmansoftware/powershell-universal"
                break;
            case "Pricing":
                url = "https://www.ironmansoftware.com/pricing"
                break;
        }

        if (url !== '')
        {
            vscode.env.openExternal(vscode.Uri.parse(url))
        }
	});
}

export default help;