# VikraHub Production API Test
Write-Host "🚀 Testing VikraHub Production API" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

$API_URL = "https://api.vikrahub.com/api/"

Write-Host "`n📡 Testing API Base URL: $API_URL" -ForegroundColor Blue

try {
    $response = Invoke-WebRequest -Uri $API_URL -Method GET -UseBasicParsing
    Write-Host "✅ API Base is accessible" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    
    $apiInfo = $response.Content | ConvertFrom-Json
    Write-Host "   Message: $($apiInfo.message)" -ForegroundColor Gray
    
} catch {
    Write-Host "❌ API Base not accessible" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nNext: Test follow functionality on https://vikrahub.com" -ForegroundColor Yellow
