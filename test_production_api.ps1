# VikraHub Production API Test
# Test the actual production API endpoint

Write-Host "🚀 Testing VikraHub Production API" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

$API_URL = "https://api.vikrahub.com/api/"

Write-Host "`n📡 Testing API Base URL: $API_URL" -ForegroundColor Blue

try {
    $response = Invoke-WebRequest -Uri $API_URL -Method GET -UseBasicParsing
    Write-Host "✅ API Base is accessible" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    
    # Parse the JSON response
    $apiInfo = $response.Content | ConvertFrom-Json
    Write-Host "   Message: $($apiInfo.message)" -ForegroundColor Gray
    
    if ($apiInfo.endpoints.follow) {
        Write-Host "✅ Follow endpoints available" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ API Base not accessible" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔒 Testing Follow Endpoint (expects authentication)" -ForegroundColor Blue
try {
    $followUrl = "${API_URL}follow/follow/"
    $response = Invoke-WebRequest -Uri $followUrl -Method POST -UseBasicParsing -ErrorAction SilentlyContinue
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Follow endpoint accessible (401 = needs auth)" -ForegroundColor Green
    } elseif ($statusCode -eq 400) {
        Write-Host "✅ Follow endpoint accessible (400 = validation error)" -ForegroundColor Green
    } else {
        Write-Host "❌ Follow endpoint issue (Status: $statusCode)" -ForegroundColor Yellow
    }
}

Write-Host "`n🌐 Frontend should use:" -ForegroundColor Cyan
Write-Host "   API URL: https://api.vikrahub.com/api/" -ForegroundColor White
Write-Host "   WebSocket: wss://api.vikrahub.com/ws/" -ForegroundColor White

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Wait for Render deployment (~3-5 minutes)" -ForegroundColor White
Write-Host "2. Test follow functionality on https://vikrahub.com" -ForegroundColor White
Write-Host "3. Check browser console for any remaining errors" -ForegroundColor White
