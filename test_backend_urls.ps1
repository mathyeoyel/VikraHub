# Test different possible backend URLs
$possibleUrls = @(
    "https://vikrahub-backend.onrender.com",
    "https://vikrahub.onrender.com",
    "https://vikrahub-api.onrender.com",
    "https://api.vikrahub.com"
)

Write-Host "🔍 Testing possible backend URLs..." -ForegroundColor Blue
Write-Host ""

foreach ($url in $possibleUrls) {
    Write-Host "Testing: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ SUCCESS: $url (Status: $($response.StatusCode))" -ForegroundColor Green
        
        # Test API endpoint
        try {
            $apiResponse = Invoke-WebRequest -Uri "$url/api/" -Method GET -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
            Write-Host "✅ API endpoint working: $url/api/ (Status: $($apiResponse.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  API endpoint issue: $url/api/ - $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ FAILED: $url - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "🔍 Checking your Render deployment..." -ForegroundColor Blue
Write-Host "Please check your Render dashboard at: https://dashboard.render.com/" -ForegroundColor Yellow
Write-Host "Look for your backend service and copy the exact URL." -ForegroundColor Yellow
