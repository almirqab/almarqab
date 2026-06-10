@echo off
cd /d "%~dp0"
echo Deploying almarqab.vercel.app...
npx vercel --prod
