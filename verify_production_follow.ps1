# VikraHub Follow System - Production Verification
# PowerShell script for Windows users

Write-Host "🚀 VikraHub Follow System - Production Verification" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""

# Check if backend is accessible
Write-Host "📡 Testing Backend API Connection..." -ForegroundColor Blue
$BACKEND_URL = "https://vikrahub-backend.onrender.com/api/"

try {
    $response = Invoke-WebRequest -Uri "${BACKEND_URL}users/" -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
    $statusCode = $response.StatusCode
    
    if ($statusCode -eq 200 -or $statusCode -eq 401) {
        Write-Host "✅ Backend API is accessible (Status: $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend API not accessible (Status: $statusCode)" -ForegroundColor Red
        Write-Host "   URL: $BACKEND_URL" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend API connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Check follow endpoint specifically
Write-Host "📡 Testing Follow Endpoint..." -ForegroundColor Blue

try {
    $headers = @{
        'Content-Type' = 'application/json'
    }
    $body = '{"user_id": 1}'
    
    $followResponse = Invoke-WebRequest -Uri "${BACKEND_URL}follow/follow/" -Method POST -Headers $headers -Body $body -UseBasicParsing -ErrorAction SilentlyContinue
    $followStatusCode = $followResponse.StatusCode
    
    if ($followStatusCode -eq 401) {
        Write-Host "✅ Follow endpoint accessible (Status: $followStatusCode - Authentication required)" -ForegroundColor Green
    } elseif ($followStatusCode -eq 400) {
        Write-Host "✅ Follow endpoint accessible (Status: $followStatusCode - Bad request expected without auth)" -ForegroundColor Green
    } else {
        Write-Host "❌ Follow endpoint issue (Status: $followStatusCode)" -ForegroundColor Red
    }
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -match "401|Unauthorized") {
        Write-Host "✅ Follow endpoint accessible (Authentication required)" -ForegroundColor Green
    } else {
        Write-Host "❌ Follow endpoint error: $errorMessage" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔍 Manual Verification Steps:" -ForegroundColor Yellow
Write-Host "1. Visit: https://vikrahub.com"
Write-Host "2. Login to your account"
Write-Host "3. Go to a user profile"
Write-Host "4. Click the Follow button"
Write-Host "5. Check browser Network tab for API calls to vikrahub-backend.onrender.com"
Write-Host ""
Write-Host "📊 Expected Results:" -ForegroundColor Yellow
Write-Host "✅ Follow button should work without 'Failed to follow user' error"
Write-Host "✅ Network tab should show successful POST to /api/follow/follow/"
Write-Host "✅ Success message should appear"
Write-Host ""

# Open the site for manual testing
Write-Host "🌐 Opening VikraHub for manual testing..." -ForegroundColor Blue
Start-Process "https://vikrahub.com"
