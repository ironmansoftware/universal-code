# PowerShell Universal 

PowerShell Universal is a single of pane of glass to manage your automation environment. This extension helps in the development of tools using PowerShell Universal. 

- [Documentation](https://docs.ironmansoftware.com)
- [Forums](https://forums.ironmansoftware.com)
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

## Requirements

- Windows, Linux or Mac
- PowerShell v5.1 or later
- Modern Web Browser

## Extension Settings

This extension contributes the following settings:

* `powershellUniversal.appToken`: An app token for communicating with the Universal REST API. An app token will be granted the first time the extension starts up. 
* `powershellUniversal.url`: The URL to your PowerShell Universal server.
* `powershellUniversal.samplesDirectory`: Directory for samples. 
* `powershellUniversal.syncSamples`: Whether to synchronize samples from GitHub.
* `powershellUniversal.localEditing`: Whether to edit local configuration files or using the REST API
* `powershellUniversal.connections`: An array of connections.