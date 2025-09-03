# PowerShell Universal 

PowerShell Universal is a single of pane of glass to manage your automation environment. This extension helps in the development of tools using PowerShell Universal. 

- [Documentation](https://docs.powershelluniversal.com)
- [Forums](https://forums.ironmansoftware.com)
- [Pricing](https://powershelluniversal.com/pricing)

## Issues 

Please open issues on the [PowerShell Universal issue repository](https://github.com/ironmansoftware/powershell-universal).

## Features

### APIs

![](https://github.com/ironmansoftware/universal-code/raw/master/images/apis.png)

- View APIs
- Automatically insert `Invoke-RestMethod` to call APIs
- Edit APIs

### Dashboards

![](https://github.com/ironmansoftware/universal-code/raw/master/images/dashboards.png)

- View dashboards 
- Open Dashboard scripts
- Restart Dashboards
- View Dashboard log
- Debug Dashboard Process

### Scripts 

![](https://github.com/ironmansoftware/universal-code/raw/master/images/scripts.png)

- View scripts
- Edit scripts
- Run scripts and receive notifications on job status

### Configuration 

![](https://github.com/ironmansoftware/universal-code/raw/master/images/config.png)

- Edit configuration scripts

## Requirements

- Windows, Linux or Mac
- PowerShell v5.1 or later
- Modern Web Browser

## Extension Configuration

This extension requires an app token generated in PowerShell Universal before using it. You can do so by navigating to your PowerShell Universal admin console and logging in.

Next, click your user name in the top right corner and select Tokens. Create a new token with the role you wish to grant to the token. Tokens with the Administrator role will have access to all features of the platform. Once created, copy the contents of the token.

Within Visual Studio Code, open the command palette (Ctrl+Shift+P) and type "Preferences: Open Settings (UI)". Search for PowerShell Universal and fill in the following values:

- App Token - The contents of the token you created in PowerShell Universal.
- URL - The URL to your PowerShell Universal server (e.g. http://localhost:5000)

Once connected, click the PowerShell Universal icon in the Activity Bar on the left side of the window. You can now start using the extension.

For more information, visit the [PowerShell Universal documentation](https://docs.powershelluniversal.com/development/visual-studio-code-extension).

## Extension Settings

This extension contributes the following settings:

* `powershellUniversal.appToken`: An app token for communicating with the Universal REST API. An app token will be granted the first time the extension starts up. 
* `powershellUniversal.url`: The URL to your PowerShell Universal server.
* `powershellUniversal.localEditing`: Whether to edit local configuration files or using the REST API
* `powershellUniversal.connections`: An array of connections.
* `powershellUniversal.checkModules`: Ensure that the latest version of the PowerShell Universal module is installed.
