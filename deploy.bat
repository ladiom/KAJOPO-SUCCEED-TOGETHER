@echo off
setlocal enabledelayedexpansion

REM Kájọpọ̀ Connect Deployment Script for Windows
REM This script helps deploy the application to various hosting platforms

echo 🚀 Kájọpọ̀ Connect Deployment Script
echo =====================================
echo.

REM Function to check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js from https://nodejs.org
    echo    Node.js is required for most deployment tools.
    pause
    exit /b 1
)

REM Function to deploy to Netlify
:deploy_netlify
echo 📡 Deploying to Netlify...
echo.

REM Check if Netlify CLI is installed
npx netlify --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Netlify CLI not found. Installing...
    npm install -g netlify-cli
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Netlify CLI
        pause
        exit /b 1
    )
)

echo 🔐 Please login to Netlify if not already logged in:
npx netlify login

echo 🚀 Deploying to production...
npx netlify deploy --prod --dir .

if %errorlevel% equ 0 (
    echo ✅ Deployment to Netlify completed!
) else (
    echo ❌ Deployment failed
)
goto :end

REM Function to deploy to Vercel
:deploy_vercel
echo ⚡ Deploying to Vercel...
echo.

REM Check if Vercel CLI is installed
npx vercel --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Vercel CLI not found. Installing...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Vercel CLI
        pause
        exit /b 1
    )
)

echo 🔐 Please login to Vercel if not already logged in:
npx vercel login

echo 🚀 Deploying to production...
npx vercel --prod

if %errorlevel% equ 0 (
    echo ✅ Deployment to Vercel completed!
) else (
    echo ❌ Deployment failed
)
goto :end

REM Function to deploy to Surge.sh
:deploy_surge
echo 🌊 Deploying to Surge.sh...
echo.

REM Check if Surge CLI is installed
npx surge --version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Surge CLI not found. Installing...
    npm install -g surge
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Surge CLI
        pause
        exit /b 1
    )
)

echo 🚀 Deploying to surge...
npx surge . kajopo-connect.surge.sh

if %errorlevel% equ 0 (
    echo ✅ Deployment to Surge completed!
    echo 🌐 Your app is live at: https://kajopo-connect.surge.sh
) else (
    echo ❌ Deployment failed
)
goto :end

REM Function to prepare for GitHub Pages
:prepare_github_pages
echo 📚 Preparing for GitHub Pages deployment...
echo.
echo To deploy to GitHub Pages:
echo 1. Push this code to a GitHub repository
echo 2. Go to repository Settings ^> Pages
echo 3. Select 'Deploy from a branch'
echo 4. Choose 'main' branch and '/ (root)'
echo 5. Your site will be available at: https://username.github.io/repository-name
echo.
echo 📋 GitHub Pages deployment guide prepared!
goto :end

REM Function to create a deployment package
:create_package
echo 📦 Creating deployment package...
echo.

REM Create a timestamp for the package
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "TIMESTAMP=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
set "PACKAGE_NAME=kajopo-connect_%TIMESTAMP%.zip"

REM Check if PowerShell is available for compression
powershell -command "Get-Command Compress-Archive" >nul 2>nul
if %errorlevel% equ 0 (
    echo Creating zip package using PowerShell...
    powershell -command "Compress-Archive -Path '.\*' -DestinationPath '.\%PACKAGE_NAME%' -Exclude '*.git*','node_modules','*.log','deploy.bat','deploy.sh','*.md'"
    if %errorlevel% equ 0 (
        echo ✅ Package created: %PACKAGE_NAME%
        echo 📤 You can upload this package to any static hosting service
    ) else (
        echo ❌ Failed to create package
    )
) else (
    echo ❌ PowerShell Compress-Archive not available.
    echo 📝 Please manually create a zip file with all project files
    echo    (excluding .git, node_modules, *.log, deploy files, and *.md files)
)
goto :end

REM Main menu
:main_menu
echo.
echo Please select a deployment option:
echo 1^) Deploy to Netlify (Recommended)
echo 2^) Deploy to Vercel
echo 3^) Deploy to Surge.sh
echo 4^) Prepare for GitHub Pages
echo 5^) Create deployment package
echo 6^) Exit
echo.

set /p choice=Enter your choice (1-6): 

if "%choice%"=="1" goto :deploy_netlify
if "%choice%"=="2" goto :deploy_vercel
if "%choice%"=="3" goto :deploy_surge
if "%choice%"=="4" goto :prepare_github_pages
if "%choice%"=="5" goto :create_package
if "%choice%"=="6" goto :exit_script

echo ❌ Invalid option. Please try again.
goto :main_menu

:exit_script
echo 👋 Goodbye!
exit /b 0

:end
echo.
echo 🎉 Deployment process completed!
echo 📱 Don't forget to test your deployed application
echo 🔗 Share your live URL with users for testing
echo.
pause
exit /b 0