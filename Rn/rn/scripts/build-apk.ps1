# APK构建脚本
# 使用方法: .\scripts\build-apk.ps1 [debug|release]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("debug", "release")]
    [string]$BuildType = "release"
)

Write-Host "开始构建 $BuildType APK..." -ForegroundColor Green

# 检查是否在项目根目录
if (-not (Test-Path "android")) {
    Write-Host "错误: 请在项目根目录运行此脚本" -ForegroundColor Red
    exit 1
}

# 检查证书文件
if ($BuildType -eq "release" -and -not (Test-Path "android/app/release.keystore")) {
    Write-Host "错误: 未找到release.keystore文件，请先生成签名证书" -ForegroundColor Red
    exit 1
}

# 清理之前的构建
Write-Host "清理之前的构建..." -ForegroundColor Yellow
if (Test-Path "android/app/build") {
    Remove-Item -Recurse -Force "android/app/build"
}

# 进入android目录
Set-Location android

# 构建APK
Write-Host "开始构建..." -ForegroundColor Yellow
if ($BuildType -eq "debug") {
    .\gradlew assembleDebug
} else {
    .\gradlew assembleRelease
}

# 检查构建结果
if ($LASTEXITCODE -eq 0) {
    Write-Host "构建成功!" -ForegroundColor Green
    
    # 查找生成的APK文件
    $apkPath = ""
    if ($BuildType -eq "debug") {
        $apkPath = Get-ChildItem -Path "app/build/outputs/apk/debug" -Filter "*.apk" | Select-Object -First 1
    } else {
        $apkPath = Get-ChildItem -Path "app/build/outputs/apk/release" -Filter "*.apk" | Select-Object -First 1
    }
    
    if ($apkPath) {
        Write-Host "APK文件位置: $($apkPath.FullName)" -ForegroundColor Green
        Write-Host "文件大小: $([math]::Round($apkPath.Length / 1MB, 2)) MB" -ForegroundColor Green
        
        # 复制到项目根目录
        $targetPath = "..\myApp-$BuildType.apk"
        Copy-Item $apkPath.FullName $targetPath
        Write-Host "APK已复制到: $targetPath" -ForegroundColor Green
    }
} else {
    Write-Host "构建失败!" -ForegroundColor Red
    exit 1
}

# 返回项目根目录
Set-Location ..
Write-Host "构建完成!" -ForegroundColor Green
