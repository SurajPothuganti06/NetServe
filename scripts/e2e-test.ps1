# ╔══════════════════════════════════════════════════════════════════╗
# ║     NetServe — End-to-End Smoke Test (PowerShell)              ║
# ║  Run: .\scripts\e2e-test.ps1                                  ║
# ║  Requires: the full stack running via docker compose up        ║
# ╚══════════════════════════════════════════════════════════════════╝

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:8080"
$pass = 0
$fail = 0
$results = @()

function Test-Step {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )

    Write-Host "`n─── $Name ───" -ForegroundColor Cyan

    try {
        $params = @{
            Uri             = $Url
            Method          = $Method
            ContentType     = "application/json"
            Headers         = $Headers
            ErrorAction     = "Stop"
        }
        if ($Body) { $params["Body"] = $Body }

        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue

        if ($status -eq $ExpectedStatus -or ($status -ge 200 -and $status -lt 300)) {
            Write-Host "  ✔ $status" -ForegroundColor Green
            $script:pass++
            $script:results += [PSCustomObject]@{ Step = $Name; Status = "PASS"; Code = $status }
        } else {
            Write-Host "  ✘ Expected $ExpectedStatus, got $status" -ForegroundColor Red
            $script:fail++
            $script:results += [PSCustomObject]@{ Step = $Name; Status = "FAIL"; Code = $status }
        }

        return $content
    }
    catch {
        $errorStatus = $_.Exception.Response.StatusCode.value__
        Write-Host "  ✘ Error: $($_.Exception.Message) (Status: $errorStatus)" -ForegroundColor Red
        $script:fail++
        $script:results += [PSCustomObject]@{ Step = $Name; Status = "FAIL"; Code = $errorStatus }
        return $null
    }
}

# ═══════════════════════════════════════════════════════════════
# 0. Wait for API Gateway
# ═══════════════════════════════════════════════════════════════
Write-Host "`n═══ Waiting for API Gateway at $baseUrl ═══" -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "$baseUrl/actuator/health" -TimeoutSec 3 -ErrorAction Stop
        $ready = $true
        break
    } catch {
        Write-Host "  Waiting... ($($i+1)/30)" -ForegroundColor DarkGray
        Start-Sleep -Seconds 5
    }
}
if (-not $ready) {
    Write-Host "`n✘ Gateway not reachable after 150s. Is docker compose up?" -ForegroundColor Red
    exit 1
}
Write-Host "  ✔ Gateway is up!" -ForegroundColor Green

# ═══════════════════════════════════════════════════════════════
# 1. Register a test user
# ═══════════════════════════════════════════════════════════════
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "e2e-$timestamp@test.com"
$password = "Test1234!"

$regBody = @{
    email     = $email
    password  = $password
    firstName = "E2E"
    lastName  = "Tester"
} | ConvertTo-Json

Test-Step -Name "Register User" -Method "POST" -Url "$baseUrl/api/auth/register" -Body $regBody -ExpectedStatus 201

# ═══════════════════════════════════════════════════════════════
# 2. Login
# ═══════════════════════════════════════════════════════════════
$loginBody = @{
    email    = $email
    password = $password
} | ConvertTo-Json

$loginResult = Test-Step -Name "Login" -Method "POST" -Url "$baseUrl/api/auth/login" -Body $loginBody

# Extract JWT
$token = $null
if ($loginResult) {
    $token = $loginResult.data.accessToken
    if (-not $token) { $token = $loginResult.data.token }
    if ($token) { Write-Host "  JWT: $($token.Substring(0, [Math]::Min(30, $token.Length)))..." -ForegroundColor DarkGray }
}

$authHeaders = @{ Authorization = "Bearer $token" }

# ═══════════════════════════════════════════════════════════════
# 3. Get Profile
# ═══════════════════════════════════════════════════════════════
Test-Step -Name "Get Profile" -Method "GET" -Url "$baseUrl/api/auth/profile" -Headers $authHeaders

# ═══════════════════════════════════════════════════════════════
# 4. Forgot Password
# ═══════════════════════════════════════════════════════════════
$fpBody = @{ email = $email } | ConvertTo-Json
$fpResult = Test-Step -Name "Forgot Password" -Method "POST" -Url "$baseUrl/api/auth/forgot-password" -Body $fpBody

# ═══════════════════════════════════════════════════════════════
# 5. Reset Password (using dev token)
# ═══════════════════════════════════════════════════════════════
if ($fpResult -and $fpResult.data.resetToken) {
    $rpBody = @{
        token       = $fpResult.data.resetToken
        newPassword = "NewPass123!"
    } | ConvertTo-Json
    Test-Step -Name "Reset Password" -Method "PUT" -Url "$baseUrl/api/auth/reset-password" -Body $rpBody
} else {
    Write-Host "`n─── Reset Password ───" -ForegroundColor Cyan
    Write-Host "  ⊘ Skipped (no reset token from forgot-password)" -ForegroundColor DarkYellow
}

# ═══════════════════════════════════════════════════════════════
# 6. Create Customer
# ═══════════════════════════════════════════════════════════════
$custBody = @{
    firstName  = "Jane"
    lastName   = "Doe"
    email      = "jane-$timestamp@test.com"
    phone      = "+1-555-0100"
    address    = "123 Test St"
} | ConvertTo-Json

$custResult = Test-Step -Name "Create Customer" -Method "POST" -Url "$baseUrl/api/customers" -Headers $authHeaders -Body $custBody -ExpectedStatus 201
$customerId = if ($custResult) { $custResult.data.id } else { $null }

# ═══════════════════════════════════════════════════════════════
# 7. List Customers
# ═══════════════════════════════════════════════════════════════
Test-Step -Name "List Customers" -Method "GET" -Url "$baseUrl/api/customers" -Headers $authHeaders

# ═══════════════════════════════════════════════════════════════
# 8. List Plans
# ═══════════════════════════════════════════════════════════════
Test-Step -Name "List Plans" -Method "GET" -Url "$baseUrl/api/plans" -Headers $authHeaders

# ═══════════════════════════════════════════════════════════════
# 9. List Invoices
# ═══════════════════════════════════════════════════════════════
Test-Step -Name "List Invoices" -Method "GET" -Url "$baseUrl/api/invoices" -Headers $authHeaders

# ═══════════════════════════════════════════════════════════════
# 10. List Payments
# ═══════════════════════════════════════════════════════════════
Test-Step -Name "List Payments" -Method "GET" -Url "$baseUrl/api/payments" -Headers $authHeaders

# ═══════════════════════════════════════════════════════════════
# 11. List Devices
# ═══════════════════════════════════════════════════════════════
Test-Step -Name "List Devices" -Method "GET" -Url "$baseUrl/api/devices" -Headers $authHeaders

# ═══════════════════════════════════════════════════════════════
# 12. List Tickets
# ═══════════════════════════════════════════════════════════════
Test-Step -Name "List Tickets" -Method "GET" -Url "$baseUrl/api/tickets" -Headers $authHeaders

# ═══════════════════════════════════════════════════════════════
# 13. Create Support Ticket
# ═══════════════════════════════════════════════════════════════
$ticketBody = @{
    subject     = "E2E Test Ticket"
    description = "Automated test ticket from e2e-test.ps1"
    category    = "TECHNICAL"
    priority    = "MEDIUM"
} | ConvertTo-Json

Test-Step -Name "Create Ticket" -Method "POST" -Url "$baseUrl/api/tickets" -Headers $authHeaders -Body $ticketBody -ExpectedStatus 201

# ═══════════════════════════════════════════════════════════════
# 14. List Notifications
# ═══════════════════════════════════════════════════════════════
Test-Step -Name "List Notifications" -Method "GET" -Url "$baseUrl/api/notifications" -Headers $authHeaders

# ═══════════════════════════════════════════════════════════════
# 15. Frontend Health
# ═══════════════════════════════════════════════════════════════
Test-Step -Name "Frontend Reachable" -Method "GET" -Url "http://localhost:3000"

# ═══════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════
Write-Host "`n"
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "            E2E TEST SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
$results | Format-Table -AutoSize
Write-Host "  Passed: $pass   Failed: $fail   Total: $($pass + $fail)" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($fail -gt 0) { exit 1 } else { exit 0 }
