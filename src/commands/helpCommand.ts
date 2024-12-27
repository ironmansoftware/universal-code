import * as vscode from 'vscode';

const help = () => {
    return vscode.commands.registerCommand('powershell-universal.help', async (item: vscode.TreeItem) => {

        let url = '';
        switch (item.label) {
            case "Documentation":
                url = "https://docs.powershelluniversal.com";
                break;
            case "Forums":
                url = "https://forums.ironmansoftware.com";
                break;
            case "Issues":
                url = "https://github.com/ironmansoftware/powershell-universal";
                break;
            case "Pricing":
                url = "https://powershelluniversal.com/pricing";
                break;
            case "Gallery":
                url = "https://powershelluniversal.com/gallery";
                break;
        }

        if (url !== '') {
            vscode.env.openExternal(vscode.Uri.parse(url));
        }
    });
};

export default help;
