#!/usr/bin/env pwsh

Write-Host "Testing Error Classification System..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$baseUrl = "http://localhost:3000"
$endpoint = "$baseUrl/api/test-error-classifier"

# Test cases for different error types
$testCases = @(
    @{
        name = "Quota Exceeded Error"
        payload = @{ errorType = "quota" }
        expectedType = "QUOTA_EXCEEDED"
    },
    @{
        name = "Network Error"
        payload = @{ errorType = "network" }
        expectedType = "NETWORK_ERROR"
    },
    @{
        name = "Content Issue Error"
        payload = @{ errorType = "content" }
        expectedType = "CONTENT_ISSUE"
    },
    @{
        name = "Unknown Error"
        payload = @{ errorType = "unknown" }
        expectedType = "UNKNOWN"
    },
    @{
        name = "Custom Error with Status 429"
        payload = @{ 
            errorType = "custom"
            message = "Too many requests"
            status = 429
        }
        expectedType = "QUOTA_EXCEEDED"
    },
    @{
        name = "Custom Error with Network Code"
        payload = @{ 
            errorType = "custom"
            message = "Connection timeout"
            code = "ETIMEDOUT"
        }
        expectedType = "NETWORK_ERROR"
    }
)

$allTestsPassed = $true

foreach ($testCase in $testCases) {
    Write-Host "`nTesting: $($testCase.name)" -ForegroundColor Yellow
    Write-Host "Expected Type: $($testCase.expectedType)" -ForegroundColor Cyan
    
    try {
        $jsonPayload = $testCase.payload | ConvertTo-Json -Depth 3
        Write-Host "Payload: $jsonPayload" -ForegroundColor Gray
        
        $response = Invoke-RestMethod -Uri $endpoint -Method POST -Body $jsonPayload -ContentType "application/json"
        
        if ($response.success) {
            $actualType = $response.results.classifiedError.type
            $errorId = $response.results.classifiedError.errorId
            $userMessage = $response.results.userMessage
            
            Write-Host "✓ Classification: $actualType" -ForegroundColor Green
            Write-Host "✓ Error ID: $errorId" -ForegroundColor Green
            Write-Host "✓ User Message: $($userMessage.title)" -ForegroundColor Green
            Write-Host "✓ Action Steps: $($userMessage.actionableSteps.Count) steps provided" -ForegroundColor Green
            
            # Verify error type matches expected
            if ($actualType -eq $testCase.expectedType) {
                Write-Host "✓ PASS: Error type correctly classified" -ForegroundColor Green
            } else {
                Write-Host "✗ FAIL: Expected $($testCase.expectedType), got $actualType" -ForegroundColor Red
                $allTestsPassed = $false
            }
            
            # Verify error ID format
            if ($errorId -match "^ERR_[A-Z0-9_]+$") {
                Write-Host "✓ PASS: Error ID format is correct" -ForegroundColor Green
            } else {
                Write-Host "✗ FAIL: Error ID format is invalid: $errorId" -ForegroundColor Red
                $allTestsPassed = $false
            }
            
            # Verify user message has required fields
            if ($userMessage.title -and $userMessage.message -and $userMessage.actionableSteps -and $userMessage.actionableSteps.Count -gt 0) {
                Write-Host "✓ PASS: User message has all required fields" -ForegroundColor Green
            } else {
                Write-Host "✗ FAIL: User message missing required fields" -ForegroundColor Red
                $allTestsPassed = $false
            }
            
        } else {
            Write-Host "✗ FAIL: API returned error: $($response.error)" -ForegroundColor Red
            $allTestsPassed = $false
        }
        
    } catch {
        Write-Host "✗ FAIL: Request failed: $($_.Exception.Message)" -ForegroundColor Red
        $allTestsPassed = $false
    }
}

Write-Host "`n=====================================" -ForegroundColor Green
if ($allTestsPassed) {
    Write-Host "✓ ALL TESTS PASSED" -ForegroundColor Green
    Write-Host "Error Classification System is working correctly!" -ForegroundColor Green
} else {
    Write-Host "✗ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host "Please check the error classification implementation." -ForegroundColor Red
}
Write-Host "=====================================" -ForegroundColor Green