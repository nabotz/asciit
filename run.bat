@echo off
setlocal
rem ------------------------------------------------------------------
rem  ASCIIt - jalankan di Windows
rem  Klik dua kali file ini, atau dari terminal:  run.bat [port]
rem  Butuh Python 3. Tutup jendela atau tekan Ctrl+C untuk berhenti.
rem ------------------------------------------------------------------

cd /d "%~dp0"
set "PORT=%~1"
if "%PORT%"=="" set "PORT=8123"

rem Cari Python 3: launcher "py" dulu, lalu "python", lalu "python3".
rem Alias Microsoft Store yang belum terpasang otomatis terlewati karena gagal dijalankan.
set "PY="
py -3 -c "import sys; sys.exit(sys.version_info[0] != 3)" >nul 2>&1
if not errorlevel 1 set "PY=py -3"
if defined PY goto found
python -c "import sys; sys.exit(sys.version_info[0] != 3)" >nul 2>&1
if not errorlevel 1 set "PY=python"
if defined PY goto found
python3 -c "import sys; sys.exit(sys.version_info[0] != 3)" >nul 2>&1
if not errorlevel 1 set "PY=python3"
if defined PY goto found

echo.
echo   Python 3 tidak ditemukan.
echo   Pasang dari https://www.python.org/downloads/ dan centang "Add python.exe to PATH",
echo   lalu jalankan run.bat lagi.
echo.
pause
exit /b 1

:found
echo.
echo   ASCIIt: http://localhost:%PORT%
echo   Python: %PY%
echo   Tutup jendela ini atau tekan Ctrl+C untuk berhenti.
echo.

rem Buka browser sekitar 2 detik kemudian, memberi waktu server menyala.
start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & start "" http://localhost:%PORT%/"

rem Server statis bawaan Python, tapi .js dipaksa text/javascript: di sebagian Windows
rem registry mendaftarkan .js sebagai text/plain sehingga browser menolak ES module.
%PY% -c "import mimetypes,runpy,sys;mimetypes.add_type('text/javascript','.js');sys.argv=['http.server','%PORT%','--bind','127.0.0.1'];runpy.run_module('http.server',run_name='__main__')"

echo.
echo   Server berhenti. Kalau muncul error "WinError 10048", port %PORT% sedang dipakai:
echo   jalankan "run.bat 8124" untuk memakai port lain.
echo.
pause
