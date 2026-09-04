# Design Specification: Fix Windows/Laragon Background Process Launcher for Import Data

## 1. Problem Statement & Confirmed Root Cause

### 1.1 The Symptom
When uploading a dataset (`DP.Proyek OSS 2024.csv` or `DP.Proyek.xlsx`), upload succeeds (HTTP 200), but immediately upon polling `/import-progress/{id}`, the modal displays:
> "Proses import gagal dimulai di latar belakang. Silakan periksa log server."

### 1.2 The Root Cause Chain
1. **Web Environment Execution (`mod_php`)**:
   In Laragon, Apache executes requests via `mod_php` (`php8apache2_4.dll`). In this environment:
   - `PHP_BINARY` resolves to `C:\laragon\bin\apache\httpd-2.4.68-260617-Win64-VS18\bin\httpd.exe`.
   - `PHP_BINDIR` evaluates to compile-time build default `C:\php`.
2. **Binary Resolver Mistake in `getPhpCliBinary()`**:
   - `basename(PHP_BINARY)` is `httpd.exe` (not `php.exe`).
   - `dirname(PHP_BINARY)` does not contain `php.exe`.
   - `getPhpCliBinary()` then checked `PHP_BINDIR` (`C:\php`), where an old standalone PHP 8.0.30 (`C:\php\php.exe`) was present on the machine.
   - It selected `C:\php\php.exe` (PHP 8.0.30) instead of Laragon's active PHP 8.3.33 (`C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe`).
3. **Execution Failure**:
   The background process was spawned with `C:\php\php.exe artisan businesses:import ...`.
   During boot, `vendor/composer/platform_check.php` verified PHP version and threw a fatal error:
   ```
   Fatal error: Composer detected issues in your platform: Your Composer dependencies require a PHP version ">= 8.3.0". You are running 8.0.30.
   ```
4. **Error Interception**:
   The diagnostic check in `DatabaseController::importProgress()` detected this fatal crash in `storage/logs/imports/import_{id}.log` and transitioned the progress status to `failed` with the error message shown in the UI.

---

## 2. Diagnostics & Answers Required Before Modification

| Diagnostic Item | Investigation Result |
|---|---|
| **Exact current launcher implementation** | `start /B "" "%s" "%s" businesses:import "%s" "%s" %s > "%s" 2>&1` invoked via `pclose(popen($cmd, 'r'))` in `DatabaseController::import()`. |
| **Resolved PHP executable** | Resolved to `C:\php\php.exe` (PHP 8.0.30) via the fallback to `PHP_BINDIR`. |
| **Generated Windows command** | `start /B "" "C:\php\php.exe" "C:\laragon\www\Map_Perizinan\artisan" businesses:import "<id>" "<file>" 1 > "storage\logs\imports\import_<id>.log" 2>&1` |
| **Why the current launcher fails** | It invoked an incompatible PHP version (8.0.30 instead of >= 8.3.0) because `PHP_BINDIR` pointed to `C:\php` where an old PHP binary resided. |
| **Whether direct CLI execution works** | **YES, 100% works.** Running `php artisan businesses:import` using Laragon's CLI PHP 8.3.33 completes imports, processes rows, updates cache, and clears temporary files without error. |
| **Exact failure point** | `DatabaseController::getPhpCliBinary()` candidate discovery and lack of version verification. |

---

## 3. Proposed Fix

### 3.1 Robust Resolution of Laragon's PHP CLI Binary (`getPhpCliBinary`)
The resolver in `DatabaseController.php` will prioritize the running PHP configuration and enforce version compatibility:
1. **If current binary is already CLI `php.exe` or `php`**, use it.
2. **Prioritize `php_ini_loaded_file()` / `get_cfg_var('cfg_file_path')`**:
   In Laragon Apache `mod_php`, `php_ini_loaded_file()` returns `C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.ini`. Its directory directly contains the matching CLI `php.exe`.
3. **Check `dirname(PHP_BINARY)`**: For CGI / FastCGI environments.
4. **Check system PATH via `where php.exe`**: In Laragon, the active PHP directory is always first in Apache's PATH.
5. **Version Verification Check**:
   Any discovered candidate is verified to satisfy the project's requirements:
   `shell_exec(sprintf('"%s" -r "echo PHP_VERSION_ID;"', $candidate)) >= 80300`.
   This ensures that even if an old binary exists elsewhere on the system, it will never be selected.

### 3.2 Command Execution & Diagnostic Logging
- Maintain `start /B "" "%s" "%s" businesses:import "%s" "%s" %s > "%s" 2>&1` with `pclose(popen($cmd, 'r'))`.
- Log the resolved PHP path and command in Laravel logs:
  `Log::info("Import background launcher [{$importId}]: PHP [{$phpBinary}], Artisan [{$artisanPath}]")`.
- In `ProcessBusinessImportCommand.php`:
  - Set `set_time_limit(0)` and `ini_set('memory_limit', '1024M')` at the beginning of `handle()` to prevent CLI timeout or memory exhaustion during large 38,000-row imports.
  - Add `$this->error($msg)` when the temporary file is missing so it appears in the log file as well.

---

## 4. Verification Plan

1. **Unit / Component Test**:
   - Query `DatabaseController::getPhpCliBinary()` under Apache web request to confirm it selects `C:\laragon\bin\php\php-8.3.33-Win32-vs16-x64\php.exe` and satisfies `version >= 8.3.0`.
2. **Detached CSV Test**:
   - Dispatch background import with sample rows from `DP.Proyek OSS 2024.csv`.
   - Verify `processed_rows` increases, speed is non-zero, and status reaches `completed`.
3. **Detached XLSX Test**:
   - Dispatch background import with `DP.Proyek.xlsx`.
   - Verify `processed_rows` increases, speed is non-zero, and status updates reliably.
4. **Code Quality & Build**:
   - `php -l` on modified files.
   - `npm run build` to ensure no frontend regressions.
