# Quick Test Checklist

## Pre-Release Testing Checklist

### ✅ Development Build (Visual Studio)
- [ ] Launch app in Visual Studio Debug mode
- [ ] Verify "My QA Project" appears in sidebar
- [ ] Create a new project via "+ New Project" button
- [ ] Verify new project appears immediately in sidebar
- [ ] Click on project to verify content loads
- [ ] Close and relaunch app
- [ ] Verify all projects still appear
- [ ] Check Visual Studio Output window for any errors

### ✅ Packaged .exe (GitHub Actions Build)
- [ ] Extract the .exe from GitHub Actions artifacts
- [ ] Run the .exe
- [ ] Go to Settings → Diagnostics section
- [ ] **Note the Data Storage Path** shown (should show folder path)
- [ ] Verify the path is in `AppData\Roaming\QAssistant` or `AppData\Local\QAssistant`
- [ ] Verify "My QA Project" appears in sidebar
- [ ] Create a new project via "+ New Project" button
- [ ] Verify new project appears in sidebar after creation dialog closes
- [ ] Click on the new project to verify it loads correctly
- [ ] Close the app completely
- [ ] Re-launch the app
- [ ] Verify all projects (including the new one) appear in sidebar
- [ ] Open the log file (Settings → Diagnostics → Open Log File button)
- [ ] Search log for "SaveProjectsAsync succeeded" messages
- [ ] Verify no error messages appear in log

### ✅ File System Verification
- [ ] Navigate to the path shown in Diagnostics
- [ ] Verify `projects.json` file exists
- [ ] Open `projects.json` in a text editor
- [ ] Verify it's valid JSON
- [ ] Verify your created projects are listed in the JSON
- [ ] Check file timestamp is recent (within seconds of when you created the project)

### ✅ Error Scenarios
- [ ] **(If data not persisting)** Check folder permissions on the QAssistant folder
- [ ] **(If projects.json not created)** Check if user has write access to AppData folder
- [ ] **(If projects visible but blank)** Close app, delete projects.json, restart
- [ ] **(If crash on startup)** Check that projects.json contains valid JSON

### ✅ Multi-Project Testing
- [ ] Create 5+ new projects with different names
- [ ] Verify all appear in sidebar
- [ ] Close and relaunch app
- [ ] Verify all 5+ projects still appear
- [ ] Verify correct project is initially selected (first in list)
- [ ] Click each project and verify different content loads for each

### ✅ Long-Term Persistence
- [ ] Create projects on Day 1
- [ ] Close app
- [ ] Wait 24+ hours (simulate real-world usage gap)
- [ ] Relaunch app
- [ ] Verify projects from Day 1 still appear

---

## Debug Output to Look For

### Success Indicators in Output Window:
```
RefreshProjectList called. Projects count: 1
ItemsSource set to 1 projects
Selected project: My QA Project
MainViewModel.InitializeAsync completed. Projects: 1, Selected: My QA Project
```

### Success Indicators in Log File (`storage.log`):
```
[TIMESTAMP] StorageService initialized. Data path: C:\Users\...\AppData\Roaming\QAssistant\projects.json
[TIMESTAMP] SaveProjectsAsync called with 1 projects
[TIMESTAMP] Serialization successful. Content length: 1234
[TIMESTAMP] File write successful: C:\Users\...\projects.json
[TIMESTAMP] File verified. Size: 1234 bytes
[TIMESTAMP] SaveProjectsAsync succeeded. Saved 1 projects to ...
```

### Error Indicators to Watch For:
```
ERROR: Directory does not exist and could not be created
Access denied writing to
IO error writing to
JSON deserialization failed
ERROR: File was not created after write operation
```

---

## Testing in Different Windows Configurations

### Test Configurations:
- [ ] **Admin User**: Full permissions to AppData
- [ ] **Limited User**: Restricted permissions
- [ ] **Packaged App**: Via .msix if available, or standalone .exe
- [ ] **OneDrive Sync**: AppData folder synced with OneDrive
- [ ] **Network Drive**: If AppData is on network

---

## Regression Testing

Ensure these still work after the changes:
- [ ] **Notes Tab**: Create and save notes
- [ ] **Tasks Tab**: Create and save tasks
- [ ] **Files Tab**: Upload and manage files
- [ ] **Links Tab**: Add and manage links
- [ ] **Linear Mode**: Fetch and display Linear issues
- [ ] **Settings**: Save API keys
- [ ] **Search**: Find notes and tasks across projects
- [ ] **Drag to Reorder**: Reorder projects in sidebar
- [ ] **Double-click Edit**: Edit project names and colors
- [ ] **Delete Project**: Delete and confirm

---

## Sign-Off Checklist

Before marking as ready for release:
- [ ] All development tests pass
- [ ] All packaged .exe tests pass
- [ ] File system verification passes
- [ ] No error messages in logs
- [ ] Projects persist across app restarts
- [ ] No regression in other features
- [ ] Diagnostics section is visible and functional
- [ ] Documentation updated (IMPLEMENTATION_SUMMARY.md and DIAGNOSTICS_GUIDE.md)
- [ ] Code reviewed by team member
