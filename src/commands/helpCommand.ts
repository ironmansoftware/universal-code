import * as vscode from 'vscode';

const help = () => {
    return vscode.commands.registerCommand('powershell-universal.help', async (item : vscode.TreeItem) => {

        let url = '';
        switch(item.label) {
            case "Documentation":
                url = "https://docs.ironmansoftware.com"
                break;
            case "Forums":
                url = "https://forums.universaldashboard.com"
                break;
            case "Issues":
                url = "mailto:support@ironmansoftware.com"
                break;
            case "Pricing":
                url = "https://www.ironmansoftware.com/pricing/powershell-universal"
                break;
        }

        if (url !== '')
        {
            vscode.env.openExternal(vscode.Uri.parse(url))
        }
	});
}

export default help;
