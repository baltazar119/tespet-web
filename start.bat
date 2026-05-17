@echo off
echo Tespet - Gelistirme Ortami Baslatiliyor...

echo.
echo [1/3] Backend bagimliliklari yukleniyor...
cd backend
C:\Users\Abdulgazi\AppData\Local\Programs\Python\Python313\python.exe -m pip install -r requirements.txt -q --no-warn-script-location

echo.
echo [2/3] Demo verisi yukleniyor...
C:\Users\Abdulgazi\AppData\Local\Programs\Python\Python313\python.exe seed_data.py

echo.
echo [3/3] Backend baslatiliyor (http://localhost:8000)...
start "Tespet Backend" cmd /k "C:\Users\Abdulgazi\AppData\Local\Programs\Python\Python313\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

cd ..\frontend
echo.
echo Frontend baslatiliyor (http://localhost:3000)...
start "Tespet Frontend" cmd /k "npm run dev"

echo.
echo Her iki sunucu baslatildi!
echo   Backend : http://localhost:8000/docs
echo   Frontend: http://localhost:3000
pause
