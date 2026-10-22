$ErrorActionPreference = 'Stop'
Write-Host "=== 1. Direct Backend Checks (Port 8000) ==="
$health8000 = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/health" -Method Get -UseBasicParsing
Write-Host "GET :8000/api/health ->" ($health8000 | ConvertTo-Json -Compress)

$incidents8000 = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/incidents" -Method Get -UseBasicParsing
Write-Host ("GET :8000/api/v1/incidents -> count: " + $incidents8000.Count + ", first id: " + $incidents8000[0].id)

Write-Host "=== 2. Frontend & Reverse Proxy Checks (Port 3000) ==="
$frontendHtml = Invoke-WebRequest -Uri "http://localhost:3000/" -Method Get -UseBasicParsing
Write-Host "GET :3000/ Status:" $frontendHtml.StatusCode "Content-Length:" $frontendHtml.Content.Length

$healthProxy = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get -UseBasicParsing
Write-Host "GET :3000/api/health ->" ($healthProxy | ConvertTo-Json -Compress)

$incidentsProxy = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/incidents" -Method Get -UseBasicParsing
Write-Host ("GET :3000/api/v1/incidents -> count: " + $incidentsProxy.Count + ", first id: " + $incidentsProxy[0].id)

$addressProxy = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/addresses/search?q=Queen" -Method Get -UseBasicParsing
Write-Host ("GET :3000/api/v1/addresses/search?q=Queen -> count: " + $addressProxy.Count)

Write-Host "=== 3. Official Auth & Incident Export (Port 3000) ==="
$loginBody = @{ email = "official@taumataarowai.govt.nz"; password = "OfficialWater#2026" } | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -UseBasicParsing
Write-Host "Official login successful, role:" $loginResp.role "token type:" $loginResp.token_type

$headers = @{ Authorization = ("Bearer " + $loginResp.access_token) }
$exportResp = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/incidents/export" -Headers $headers -Method Get -UseBasicParsing
Write-Host "CSV Export StatusCode:" $exportResp.StatusCode "ContentType:" $exportResp.Headers["Content-Type"]
$firstLine = $exportResp.Content.Split([char]10)[0].Trim()
Write-Host "CSV Header Preview:" $firstLine
Write-Host "ALL VERIFICATION CHECKS PASSED!"
