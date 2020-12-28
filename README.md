# PowerShell Universal 

PowerShell Universal is the ultimate platform for building web-based IT tools. This extension helps in the development of tools using PowerShell Universal. 

- [Documentation](https://docs.ironmansoftware.com)
- [Forums](https://forums.universaldashboard.io)
- [Purchasing](https://ironmansoftware.com/pricing/powershell-universal)

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

### Samples 

Automatically insert samples from the [PowerShell Universal Sample Repository](https://github.com/ironmansoftware/universal-samples)

### Auto-import modules

The dashboard will automatically import modules for a dashboard so that IntelliSense works properly.

## Requirements

- Windows, Linux or Mac
- PowerShell v5.1 or later
- Modern Web Browser

## Extension Settings

This extension contributes the following settings:

* `powershellUniversal.url`: The URL to your PowerShell Universal server.
* `powershellUniversal.appToken`: An app token for communicating with the Universal REST API. An app token will be granted the first time the extension starts up. 
* `powershellUniversal.serverPath`: The path to the binaries for the Universal server. This defaults to %AppData%\PowerShellUniversal
* `powershellUniversal.startServer`: Whether to start the PowerShell Universal server when the extension is activated. This defaults to true.