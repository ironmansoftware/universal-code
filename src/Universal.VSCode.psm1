function Install-UniversalModule {
    Write-Host 'Checking Universal module version...'

    $Universal = Get-Module -Name 'Universal' -ListAvailable -ErrorAction SilentlyContinue
    if ($null -eq $Universal) {
        Write-Host 'Installing Universal module...'
        Install-Module -Name 'Universal' -Scope CurrentUser -Force -AllowClobber -ErrorAction SilentlyContinue
    }
    else {
        $UniversalOnline = Find-Module 'Universal' | Select-Object -First 1

        if ($UniversalOnline.Version -gt $Universal.Version) {
            Write-Host "Updating Universal module to $($UniversalOnline.Version)..."
            Update-Module -Name 'Universal'
        }
    }
}

Install-UniversalModule