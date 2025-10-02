@echo off
echo Installing required npm packages for Items Panel...
echo.

echo Installing @radix-ui/react-popover...
call npm install @radix-ui/react-popover

echo.
echo Installing @radix-ui/react-toggle-group...
call npm install @radix-ui/react-toggle-group

echo.
echo Installing cmdk (Command menu)...
call npm install cmdk

echo.
echo ✅ All packages installed successfully!
echo.
echo You can now run: npm run dev
pause
