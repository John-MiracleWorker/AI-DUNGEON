# Manual Testing Guide for Start Adventure Button Fixes

This guide provides instructions for manually testing the fixes implemented for the "Start Adventure" button functionality.

## Prerequisites

1. Ensure the backend server is running on port 3001
2. Ensure MongoDB and Redis are running (via Docker or locally)
3. Ensure the frontend is properly configured with the correct API URL
4. Make sure you have a valid OpenAI API key configured in the backend
   - If the key is missing or the service is unavailable, prompt adventures will fall back to a generic scenario

## Test Scenarios

### 1. Successful Adventure Creation

**Test Case**: Create a new prompt-based adventure

**Steps**:
1. Launch the app
2. Navigate to "New Adventure" → "Prompt Adventure"
3. Enter a valid prompt (e.g., "Create a fantasy adventure where I'm a brave knight")
4. Select any style preference and image style
5. Click "Start Adventure"

**Expected Result**:
- The button should show "Creating..." while processing
- After successful creation, you should be navigated directly to the game screen
- No error messages should appear

### 2. Empty Prompt Validation

**Test Case**: Try to create an adventure with an empty prompt

**Steps**:
1. Launch the app
2. Navigate to "New Adventure" → "Prompt Adventure"
3. Leave the prompt field empty
4. Click "Start Adventure"

**Expected Result**:
- An alert should appear with the message "Prompt Required"
- The message should be clear and actionable

### 3. Authentication Error Handling

**Test Case**: Try to create an adventure when not authenticated

**Steps**:
1. Launch the app
2. Ensure you're not logged in (or simulate this by modifying the auth state)
3. Navigate to "New Adventure" → "Prompt Adventure"
4. Enter a valid prompt
5. Click "Start Adventure"

**Expected Result**:
- An alert should appear with the message "Authentication Required"
- The message should explain that login is needed

### 4. Server Error Handling (500 series)

**Test Case**: Simulate a server error during adventure creation

**Steps**:
1. Launch the app
2. Navigate to "New Adventure" → "Prompt Adventure"
3. Enter a valid prompt
4. Temporarily shut down the backend server or modify the backend code to throw an error
5. Click "Start Adventure"

**Expected Result**:
- An alert should appear with the message "Server error. Please try again later."
- The message should be user-friendly and not expose technical details

### 5. Validation Error Handling (400 series)

**Test Case**: Send invalid data to trigger a validation error

**Steps**:
1. Launch the app
2. Navigate to "New Adventure" → "Prompt Adventure"
3. Enter a valid prompt
4. Modify the network request to send invalid data (use browser dev tools or a proxy)
5. Click "Start Adventure"

**Expected Result**:
- An alert should appear with a specific validation error message
- The message should indicate what was wrong with the request

### 6. Rate Limit Error Handling (429)

**Test Case**: Trigger rate limiting

**Steps**:
1. Launch the app
2. Navigate to "New Adventure" → "Prompt Adventure"
3. Enter a valid prompt
4. Configure the backend to return a 429 status code
5. Click "Start Adventure"

**Expected Result**:
- An alert should appear with the message "Rate limit exceeded. Please wait before trying again."
- The message should be clear about what the user should do

### 7. Navigation Failure Handling

**Test Case**: Simulate a navigation failure

**Steps**:
1. Launch the app
2. Navigate to "New Adventure" → "Prompt Adventure"
3. Enter a valid prompt
4. Temporarily modify the navigation code to throw an error
5. Click "Start Adventure"

**Expected Result**:
- The adventure should still be created successfully
- An alert should appear with the message "Adventure Created. Your adventure was created successfully. Please go to your game library to access it."
- This ensures users aren't left stranded if navigation fails

## Testing Different Adventure Types

### Custom Adventure Creation

**Steps**:
1. Launch the app
2. Navigate to "New Adventure"
3. Select "Custom Adventure"
4. Click "Create Custom Adventure"

**Expected Result**:
- Should navigate to the custom adventure creation wizard
- No errors should occur

### Template Adventure Creation

**Steps**:
1. Launch the app
2. Navigate to "New Adventure"
3. Select "Use Template"
4. Click "Start from Template" (without selecting a template)

**Expected Result**:
- Should show an alert "No Template Selected"
- Should provide clear instructions

### Preset Adventure Creation

**Steps**:
1. Launch the app
2. Navigate to "New Adventure"
3. Select "Quick Start"
4. Choose any genre, image style, and narration style
5. Click "Start Adventure"

**Expected Result**:
- Should create the adventure and navigate to the game screen
- No errors should occur

## Backend Logging Verification

**Steps**:
1. Check the backend logs while performing the above tests
2. Look for structured log entries that show:
   - Game creation start and completion
   - AI generation steps
   - Image generation attempts
   - Database save operations
   - Error conditions (when applicable)

**Expected Result**:
- Logs should be detailed and structured
- Should include correlation information (session IDs, user IDs)
- Should show timing information
- Should include error details when errors occur

## Environment Configuration Testing

### Development Environment

**Steps**:
1. Ensure `.env` file in frontend contains:
   ```
   EXPO_PUBLIC_API_URL=http://[YOUR_LOCAL_IP]:3001/api
   ```
2. Start the app and create an adventure

**Expected Result**:
- Should connect to the backend successfully
- Should create adventures without connection errors

### Production Environment

**Steps**:
1. Ensure `.env.production` file contains:
   ```
   EXPO_PUBLIC_API_URL=https://your-production-url.com/api
   ```
2. Build the app for production and test adventure creation

**Expected Result**:
- Should use the production API URL
- Should handle production-specific issues gracefully

## Troubleshooting

### If Adventures Still Don't Create

1. Check that the backend server is running:
   ```bash
   cd backend
   npm run dev
   ```

2. Check that MongoDB and Redis are running:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

3. Check the backend logs for errors:
   ```bash
   # Look for error messages in the console output
   ```

4. Verify the API URL configuration in the frontend:
   - Check `.env` file
   - Ensure the IP address matches your development machine's IP

5. Test API connectivity directly:
   ```bash
   curl http://localhost:3001/api/health
   ```

### If Navigation Still Fails

1. Check that the navigation structure in `AppNavigator.tsx` matches the expected routes
2. Verify that the `Game` screen is properly registered
3. Check for any navigation-related errors in the console

### If Error Messages Are Not Helpful

1. Check that the backend is returning detailed error information
2. Verify that the frontend is properly parsing error responses
3. Check that the error handling code is correctly categorizing different error types

## Success Criteria

All fixes are considered successful if:

1. ✅ All adventure creation buttons work for all adventure types
2. ✅ Specific, actionable error messages are shown for different error conditions
3. ✅ Navigation is reliable and doesn't fail silently
4. ✅ Backend logs provide sufficient detail for debugging
5. ✅ The fixes work in both development and production environments
6. ✅ Users are never left in a stuck state when errors occur