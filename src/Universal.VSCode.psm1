function Install-UniversalModule {
    param($Version)

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