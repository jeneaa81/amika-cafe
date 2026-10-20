@echo off
echo Building production bundle...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    pause
    exit /b %ERRORLEVEL%
)
echo Deploying to gh-pages branch...
set GIT="C:\Users\Евгений\AppData\Local\GitHubDesktop\app-3.6.7\resources\app\git\cmd\git.exe"
cd dist
%GIT% init -b gh-pages
%GIT% add .
%GIT% commit -m "deploy: update Amika Cafe live site"
%GIT% remote add origin https://github.com/jeneaa81/amika-cafe.git
%GIT% push -f origin gh-pages
cd ..
rmdir /s /q dist\.git
echo ========================================================
echo Done! Your site is live at https://jeneaa81.github.io/amika-cafe/
echo ========================================================
pause
