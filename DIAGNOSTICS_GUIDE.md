# QAssistant Projects Sidebar Diagnostics Guide

## Issue
Projects are not appearing in the sidebar when running the .exe from GitHub Actions, even after creating new projects. The app works correctly in Visual Studio.

## Root Cause
This is likely due to one of the following:
1. **File Access Permissions** - The packaged .exe may not have write permissions to the `ApplicationData` folder
2. **Data Path Difference** - The .exe might be looking in a different folder than where data is being saved
3. **Data Not Being Flushed** - The projects collection in memory isn't being properly saved to disk

## Diagnostic Features Added

### 1. Enhanced Logging in StorageService
The `StorageService` now logs detailed information about:
- Whether the directory exists and can be created
- Serialization success/failure
- File write operations with specific error types (AccessDenied, IOException)
- File verification after write

**Log Location**: `%APPDATA%\QAssistant\storage.log`

### 2. Settings Page Diagnostics
Added a new "DIAGNOSTICS" section in the Settings page that displays:
- **Data Storage Path**: Where the app is trying to save project data
- **Log File Path**: Where diagnostic logs are stored
- **Open Log File Button**: Opens the folder containing the log file

### 3. Improved Error Handling
- Added fallback from `ApplicationData` to `LocalApplicationData` folder
- Added specific error types for file operations
- Added directory existence verification before write operations

## How to Troubleshoot

### Step 1: Check the Data Path
1. Run the .exe
2. Go to Settings → Diagnostics section
3. Note the **Data Storage Path** shown
4. The path should look like: `C:\Users\[YourUsername]\AppData\Roaming\QAssistant\projects.json`

### Step 2: Check the Log File
1. Click **Open Log File** button in the Diagnostics section
2. Look at the most recent entries in `storage.log`
3. Check for any error messages

### Step 3: Verify File Permissions
1. Navigate to the folder shown in the Data Storage Path
2. Right-click → Properties → Security
3. Ensure your user account has "Modify" and "Write" permissions
4. If not, grant permissions and try again

### Step 4: Create a Test Project
1. Click "+ New Project" in the sidebar
2. Enter a project name and click "Create"
3. Check the log file to see what messages appear
4. If the log shows "SaveProjectsAsync succeeded", but the project doesn't appear, it's a UI refresh issue

### Step 5: Verify Data File
1. Open the folder from Step 2
2. Check if `projects.json` exists
3. If it exists, open it with a text editor to see if your created projects are inside
4. If they're in the file but not showing in the UI, the issue is with UI binding/refresh

## Example Log Output
```
[2024-01-15 10:30:45] StorageService initialized. Data path: C:\Users\Stefan\AppData\Roaming\QAssistant\projects.json
[2024-01-15 10:30:46] LoadProjectsAsync called. File exists: False
[2024-01-15 10:30:46] projects.json does not exist, returning empty list
[2024-01-15 10:30:46] MainViewModel.InitializeAsync completed. Projects: 1, Selected: My QA Project
[2024-01-15 10:31:20] SaveProjectsAsync called with 2 projects
[2024-01-15 10:31:20] Target path: C:\Users\Stefan\AppData\Roaming\QAssistant\projects.json
[2024-01-15 10:31:20] Serialization successful. Content length: 1234
[2024-01-15 10:31:20] File write successful: C:\Users\Stefan\AppData\Roaming\QAssistant\projects.json
[2024-01-15 10:31:20] File verified. Size: 1234 bytes
[2024-01-15 10:31:20] SaveProjectsAsync succeeded. Saved 2 projects to C:\Users\Stefan\AppData\Roaming\QAssistant\projects.json
```

## Common Issues and Solutions

### Issue: "Access denied" error in log
**Solution**: 
- Run the .exe as Administrator
- Or grant write permissions to the folder (right-click → Properties → Security)

### Issue: "SaveProjectsAsync succeeded" but projects don't appear
**Solution**: 
- This is a UI binding issue
- Try clicking another project in the sidebar and back
- Or restart the application

### Issue: Data path shows LocalApplicationData instead of ApplicationData
**Solution**: 
- This is the fallback behavior
- Ensure the primary AppData folder is accessible
- Check Windows user permissions

## Next Steps for Development

If diagnostics show everything is being saved correctly but projects aren't displaying:
1. The issue is with the `RefreshProjectList()` method or data binding
2. Check if the `Projects` ObservableCollection is being properly updated
3. Verify that the ListView in the UI is bound to the correct collection

If diagnostics show file write failures:
1. Check user account permissions on the AppData folder
2. Consider using a different default storage location for packaged apps
3. Look into Windows AppData folder access rules for packaged applications
