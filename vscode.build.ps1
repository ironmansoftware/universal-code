task BuildExtension {
    & {
        $ErrorActionPreference = 'SilentlyContinue'
        npm install -g npm
        npm install -g typescript@latest
        npm install -g vsce
        npm install

        Remove-Item (Join-Path $PSScriptRoot "kit") -Force -Recurse -ErrorAction SilentlyContinue
        New-Item (Join-Path $PSScriptRoot "kit") -ItemType Directory

        vsce package

        Copy-Item (Join-Path $PSScriptRoot "*.vsix") (Join-Path $PSScriptRoot "kit")
    }
}

task PublishExtension {
    & {
        $ErrorActionPreference = 'SilentlyContinue'
        npm install -g vsce
        $vsix = (Get-ChildItem "$PSScriptRoot\*.vsix").FullName
        vsce publish --packagePath $vsix -p $env:MarketplaceToken
    }
}

task . BuildExtension