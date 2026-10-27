param([switch]$InitializeSigning)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot
$package = Get-Content package.json -Raw | ConvertFrom-Json
if ($package.version -notmatch '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$') { throw 'A stable major.minor.patch version is required.' }
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $projectRoot '.android-sdk' }
if (!(Test-Path "$sdk/platforms/android-36/android.jar")) { throw 'Android SDK platform 36 is missing. See docs/ANDROID-RELEASE.md.' }
$env:ANDROID_HOME = $sdk
$env:GRADLE_USER_HOME = Join-Path $projectRoot '.gradle-local'
$keyDirectory = Join-Path $projectRoot '.signing'
$keyFile = Join-Path $keyDirectory 'obligo-release.jks'
$passwordFile = Join-Path $keyDirectory 'credentials.json'
if ($InitializeSigning) {
    if ((Test-Path $keyFile) -or (Test-Path $passwordFile)) { throw 'Signing material already exists. Never overwrite the release key.' }
    New-Item -ItemType Directory -Path $keyDirectory -Force | Out-Null
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    & icacls.exe $keyDirectory /inheritance:r /grant:r "${identity}:(OI)(CI)F" 'SYSTEM:(OI)(CI)F' | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Could not restrict access to signing directory.' }
    $bytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes); $rng.Dispose()
    $env:OBLIGO_STORE_PASSWORD = [Convert]::ToBase64String($bytes)
    $env:OBLIGO_KEY_PASSWORD = $env:OBLIGO_STORE_PASSWORD
    & "$env:JAVA_HOME/bin/keytool.exe" -genkeypair -keystore $keyFile -storetype JKS -alias obligo -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Obligo, O=Validacore' -storepass:env OBLIGO_STORE_PASSWORD -keypass:env OBLIGO_KEY_PASSWORD
    if ($LASTEXITCODE -ne 0) { throw 'Signing key generation failed.' }
    @{ storePassword = $env:OBLIGO_STORE_PASSWORD; keyPassword = $env:OBLIGO_KEY_PASSWORD } | ConvertTo-Json | Set-Content -LiteralPath $passwordFile
}
if (!(Test-Path $keyFile) -or !(Test-Path $passwordFile)) { throw 'Signing key missing. For the FIRST release only, run with -InitializeSigning. For updates, restore your original .signing backup.' }
$credentials = Get-Content -LiteralPath $passwordFile -Raw | ConvertFrom-Json
$env:OBLIGO_KEYSTORE = $keyFile
$env:OBLIGO_STORE_PASSWORD = $credentials.storePassword
$env:OBLIGO_KEY_PASSWORD = $credentials.keyPassword
try {
    & node node_modules/typescript/bin/tsc -b
    if ($LASTEXITCODE -ne 0) { throw 'TypeScript failed.' }
    & node node_modules/vite/bin/vite.js build
    if ($LASTEXITCODE -ne 0) { throw 'Web build failed.' }
    & node node_modules/@capacitor/cli/bin/capacitor sync android
    if ($LASTEXITCODE -ne 0) { throw 'Android sync failed.' }
    & "$projectRoot/android/gradlew.bat" -p "$projectRoot/android" --no-daemon assembleRelease
    if ($LASTEXITCODE -ne 0) { throw 'Android release build failed.' }
    $source = Join-Path $projectRoot 'android/app/build/outputs/apk/release/app-release.apk'
    & "$sdk/build-tools/36.0.0/apksigner.bat" verify --verbose --print-certs $source
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    New-Item -ItemType Directory -Force artifacts | Out-Null
    $artifact = Join-Path $projectRoot "artifacts/obligo-$($package.version).apk"
    Copy-Item -LiteralPath $source -Destination $artifact
    $hash = (Get-FileHash -LiteralPath $artifact -Algorithm SHA256).Hash.ToLower()
    "$hash  obligo-$($package.version).apk" | Set-Content -LiteralPath "$artifact.sha256" -Encoding ascii
    Write-Host "Verified release APK: $artifact"
    Write-Host 'Back up .signing securely. Never publish the signing key or credentials.'
} finally {
    Remove-Item Env:OBLIGO_STORE_PASSWORD,Env:OBLIGO_KEY_PASSWORD,Env:OBLIGO_KEYSTORE -ErrorAction SilentlyContinue
}
