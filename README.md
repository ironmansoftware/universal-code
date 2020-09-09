# PowerShell Universal 

PowerShell Universal is the ultimate platform for building web-based IT tools. This extension helps in the development of tools using PowerShell Universal. 

- [Documentation](https://docs.ironmansoftware.com)
- [Forums](https://forums.universaldashboard.io)
- [Purchasing](https://ironmansoftware.com/powershell-universal)

## Features

### Download and Install Universal

The extension can automatically download and install Universal. When the extension starts, if the binaries are present, it will start a Universal server. 

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

### Auto-import modules

The dashboard will automatically import modules for a dashboard so that IntelliSense works properly.

## Requirements

- Windows or Linux
- PowerShell v5.1 or later
- Modern Web Browser

## Extension Settings

This extension contributes the following settings:

* `powershellUniversal.port`: Port that the Universal server is listening on. Defaults to 5000.
* `powershellUniversal.computerName`: Computer that the server is running on. Defaults to localhost.
* `powershellUniversal.appToken`: An app token for communicating with the Universal REST API. An app token will be granted the first time the extension starts up. 
* `powershellUniversal.serverPath`: The path to the binaries for the Universal server. This defaults to %AppData%\PowerShellUniversal
* `powershellUniversal.startServer`: Whether to start the PowerShell Universal server when the extension is activated. This defaults to true.

## Release Notes

## [1.4.0]

### Added

- Added a setting to disable starting the PowerShell Universal server on extension activation.
- Added View Dashboard Log command 
- Added Debug Dashboard Process command

### Changed

- Extension will fail to activate after a number of retries while connecting to the Universal server.

## [1.3.0]

- Added support configuration files. 

### [1.2.0]

- Added support for scripts and jobs.

### [1.1.0]

- Added support for APIs

### [1.0.0]

- Initial release