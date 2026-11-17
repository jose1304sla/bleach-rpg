$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$portable = Get-ChildItem -Path (Join-Path $PSScriptRoot '.runtime') -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.FullName 'node.exe') } | Select-Object -First 1
if ($portable) { $env:Path = $portable.FullName + ';' + $env:Path }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Instale Node.js 24+ de https://nodejs.org/en/download e execute novamente.' }
if (-not (Test-Path -LiteralPath 'node_modules')) { & npm.cmd install; if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar dependencias.' } }
& npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Falha ao compilar.' }
Write-Host 'Abra http://127.0.0.1:3001 no navegador. Ctrl+C para encerrar.'
& npm.cmd start
