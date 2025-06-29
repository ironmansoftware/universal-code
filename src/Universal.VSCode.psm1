function Install-UniversalModule {
    param($Version)

    if ($Version -contains "beta") {
        Write-Warning "This feature is not supported for beta versions"
        return
    }

    $Parameters = @{
        Name            = "Universal"
        RequiredVersion = $Version
    }

    $Universal = Import-Module @Parameters -ErrorAction SilentlyContinue -PassThru
    if ($null -eq $Universal) {
        Install-Module @Parameters -Scope CurrentUser -Force -AllowClobber -ErrorAction SilentlyContinue
        Import-Module @Parameters -ErrorAction SilentlyContinue
    }
}

function Import-LocalDevelopmentModule {
    param($Version, $Port)

    $ModulePath = [IO.Path]::Combine($ENV:USERPROFILE, ".psu", $Version, "Modules", "Universal", "Universal.psd1")
    Import-Module $ModulePath

    Connect-PSUServer -Url "http://localhost:$Port" -Credential (New-Object System.Management.Automation.PSCredential("admin", (ConvertTo-SecureString "admin" -AsPlainText -Force)))
}