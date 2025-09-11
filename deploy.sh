#!/bin/bash

# Kájọpọ̀ Connect Deployment Script
# This script helps deploy the application to various hosting platforms

set -e  # Exit on any error

echo "🚀 Kájọpọ̀ Connect Deployment Script"
echo "====================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy to Netlify
deploy_netlify() {
    echo "📡 Deploying to Netlify..."
    
    if ! command_exists netlify; then
        echo "❌ Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi
    
    echo "🔐 Please login to Netlify if not already logged in:"
    netlify login
    
    echo "🚀 Deploying to production..."
    netlify deploy --prod --dir .
    
    echo "✅ Deployment to Netlify completed!"
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "⚡ Deploying to Vercel..."
    
    if ! command_exists vercel; then
        echo "❌ Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    echo "🔐 Please login to Vercel if not already logged in:"
    vercel login
    
    echo "🚀 Deploying to production..."
    vercel --prod
    
    echo "✅ Deployment to Vercel completed!"
}

# Function to deploy to Surge.sh
deploy_surge() {
    echo "🌊 Deploying to Surge.sh..."
    
    if ! command_exists surge; then
        echo "❌ Surge CLI not found. Installing..."
        npm install -g surge
    fi
    
    echo "🚀 Deploying to surge..."
    surge . kajopo-connect.surge.sh
    
    echo "✅ Deployment to Surge completed!"
    echo "🌐 Your app is live at: https://kajopo-connect.surge.sh"
}

# Function to prepare for GitHub Pages
prepare_github_pages() {
    echo "📚 Preparing for GitHub Pages deployment..."
    echo ""
    echo "To deploy to GitHub Pages:"
    echo "1. Push this code to a GitHub repository"
    echo "2. Go to repository Settings > Pages"
    echo "3. Select 'Deploy from a branch'"
    echo "4. Choose 'main' branch and '/ (root)'"
    echo "5. Your site will be available at: https://username.github.io/repository-name"
    echo ""
    echo "📋 GitHub Pages deployment guide prepared!"
}

# Function to create a deployment package
create_package() {
    echo "📦 Creating deployment package..."
    
    # Create a timestamp for the package
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    PACKAGE_NAME="kajopo-connect_${TIMESTAMP}.zip"
    
    # Create zip package (excluding development files)
    if command_exists zip; then
        zip -r "$PACKAGE_NAME" . -x "*.git*" "node_modules/*" "*.log" "deploy.sh" "*.md"
        echo "✅ Package created: $PACKAGE_NAME"
        echo "📤 You can upload this package to any static hosting service"
    else
        echo "❌ zip command not found. Please install zip utility or manually create the package."
    fi
}

# Main menu
echo ""
echo "Please select a deployment option:"
echo "1) Deploy to Netlify (Recommended)"
echo "2) Deploy to Vercel"
echo "3) Deploy to Surge.sh"
echo "4) Prepare for GitHub Pages"
echo "5) Create deployment package"
echo "6) Exit"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        deploy_netlify
        ;;
    2)
        deploy_vercel
        ;;
    3)
        deploy_surge
        ;;
    4)
        prepare_github_pages
        ;;
    5)
        create_package
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo "📱 Don't forget to test your deployed application"
echo "🔗 Share your live URL with users for testing"