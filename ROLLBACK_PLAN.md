# Kui Tauri Rollback Plan

**Purpose**: Emergency procedures for reverting to Electron version if critical issues arise
**Status**: Active
**Last Updated**: 2025-12-17

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Rollback Triggers](#rollback-triggers)
3. [Rollback Procedures](#rollback-procedures)
4. [Platform-Specific Instructions](#platform-specific-instructions)
5. [Communication Plan](#communication-plan)
6. [Post-Rollback Actions](#post-rollback-actions)
7. [Prevention & Mitigation](#prevention--mitigation)

---

## Executive Summary

This document provides comprehensive procedures for rolling back from the Tauri version of Kui to the legacy Electron version in case of critical issues that cannot be quickly resolved.

### Key Points

- **Dual Runtime Support**: Both Electron and Tauri versions coexist during transition period (v13.1.x - v13.9.x)
- **No Data Loss**: User settings and configurations are preserved during rollback
- **Rapid Response**: Rollback can be executed within 1-4 hours depending on scope
- **Clear Triggers**: Specific criteria define when rollback is necessary

### Rollback Scope Options

| Scope | Description | Timeline | Complexity |
|-------|-------------|----------|------------|
| **Individual User** | Single user reverts to Electron | 5-10 minutes | Low |
| **Team/Enterprise** | Organization-wide rollback | 2-4 hours | Medium |
| **Public Release** | Pull Tauri release, restore Electron | 1-2 hours | High |
| **Emergency Hotfix** | Critical patch while maintaining Tauri | 30 minutes | Low |

---

## Rollback Triggers

### Critical Triggers (Immediate Rollback Required)

These issues require immediate rollback within 1 hour:

1. **Data Loss or Corruption**
   - User data deleted or corrupted
   - Settings lost permanently
   - Kubernetes credentials compromised

2. **Security Vulnerability**
   - Remote code execution vulnerability discovered
   - Privilege escalation exploit
   - Data exfiltration risk

3. **Widespread Crashes**
   - Crash rate > 10% on any platform
   - Application fails to launch for majority of users
   - Critical functionality completely broken

4. **System Damage**
   - Application damages system files
   - Uninstall leaves system in broken state
   - Conflicts with critical system services

### High Priority Triggers (Rollback within 24 hours)

These issues require rollback within 24 hours:

1. **High Crash Rate**
   - Crash rate 5-10% on any platform
   - Specific workflows cause consistent crashes
   - Memory leaks cause system instability

2. **Performance Regression**
   - Startup time > 5s (10x worse than target)
   - Memory usage > 300 MB (3x worse than target)
   - UI freezes or hangs frequently

3. **Data Integrity Issues**
   - Settings occasionally lost
   - Configuration corruption (recoverable)
   - Command history intermittently missing

4. **Platform-Specific Failure**
   - Complete failure on one major platform (e.g., all macOS users affected)
   - Critical feature broken on one platform

### Medium Priority Triggers (Consider Rollback within 7 days)

These issues may warrant rollback if not resolved quickly:

1. **Moderate Crash Rate**
   - Crash rate 2-5% on any platform
   - Specific features cause crashes

2. **Feature Regression**
   - Critical feature missing or broken
   - Plugin compatibility issues
   - Workflow disruption

3. **User Adoption Issues**
   - Negative feedback from > 30% of users
   - High uninstall rate
   - Support ticket spike

4. **Performance Issues**
   - Not meeting performance targets but usable
   - Specific operations slower than Electron

### Low Priority (Monitor, No Immediate Rollback)

These issues don't warrant rollback:

1. **Minor Bugs**
   - UI glitches
   - Non-critical feature issues
   - Edge case problems

2. **Performance Variations**
   - Performance matches Electron (no regression)
   - Minor deviations from targets

3. **Individual Reports**
   - Isolated incidents
   - User configuration issues
   - Platform-specific quirks

---

## Rollback Procedures

### Decision Tree

```
┌─────────────────────────────────────────┐
│  Issue Detected                         │
└───────────┬─────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│  Assess Severity                        │
│  - Data loss?                           │
│  - Security issue?                      │
│  - Crash rate?                          │
│  - User impact?                         │
└───────────┬─────────────────────────────┘
            │
            ▼
      Critical? ───Yes──> Immediate Rollback
            │
            No
            │
            ▼
      High Priority? ───Yes──> 24h Rollback
            │
            No
            │
            ▼
      Medium Priority? ───Yes──> Evaluate Fix Timeline
            │                    ├─> Fix possible in 7 days? -> Fix
            │                    └─> Not fixable quickly? -> Rollback
            No
            │
            ▼
┌─────────────────────────────────────────┐
│  Monitor & Fix                          │
│  (No rollback needed)                   │
└─────────────────────────────────────────┘
```

### Procedure 1: Individual User Rollback

**Timeline**: 5-10 minutes
**Complexity**: Low

**When to Use**:
- Single user experiencing issues
- User preference for Electron
- Testing/validation purposes

**Steps**:

1. **Backup Current Settings** (Optional but recommended)
   ```bash
   # macOS
   cp -r ~/Library/Application\ Support/org.kui-shell.kui ~/Library/Application\ Support/org.kui-shell.kui.backup

   # Linux
   cp -r ~/.config/org.kui-shell.kui ~/.config/org.kui-shell.kui.backup

   # Windows
   xcopy %APPDATA%\org.kui-shell.kui %APPDATA%\org.kui-shell.kui.backup /E /I
   ```

2. **Uninstall Tauri Version**

   **macOS**:
   ```bash
   # Remove application
   rm -rf /Applications/Kui.app

   # Remove via Homebrew if installed that way
   brew uninstall kui
   ```

   **Linux**:
   ```bash
   # DEB package
   sudo apt remove kui

   # AppImage (just delete the file)
   rm ~/Kui-*.AppImage
   ```

   **Windows**:
   ```powershell
   # Uninstall via Settings > Apps > Kui > Uninstall
   # Or via PowerShell
   $app = Get-WmiObject -Class Win32_Product | Where-Object { $_.Name -eq "Kui" }
   $app.Uninstall()
   ```

3. **Install Electron Version**

   Download from GitHub Releases:
   - Go to: https://github.com/IBM/kui/releases
   - Find latest v13.0.x release (pre-Tauri)
   - Download appropriate installer for your platform
   - Install normally

4. **Verify Settings Migrated**
   ```bash
   # Launch Kui
   open /Applications/Kui.app  # macOS
   # Check that your theme, history, and settings are present
   ```

5. **Report Issue** (Optional but encouraged)
   - Open GitHub issue: https://github.com/IBM/kui/issues
   - Include: OS, Kui version, issue description, steps to reproduce

**Verification**:
- [ ] Electron version launches successfully
- [ ] Settings and preferences preserved
- [ ] Command history intact
- [ ] Kubernetes contexts working
- [ ] All features functional

---

### Procedure 2: Team/Enterprise Rollback

**Timeline**: 2-4 hours
**Complexity**: Medium

**When to Use**:
- Organization-wide issues
- Multiple users affected
- Coordinated rollback needed

**Prerequisites**:
- Access to distribution channels
- Communication channels ready
- Rollback approval from stakeholders

**Steps**:

1. **Decision & Approval** (15 minutes)
   - [ ] Assess issue severity
   - [ ] Get approval from technical lead
   - [ ] Notify stakeholders
   - [ ] Prepare communication

2. **Disable Auto-Updates** (15 minutes)
   ```bash
   # If you have a custom update server
   # Update manifest to stop serving Tauri version

   # Or communicate to users to disable auto-updates
   # macOS: Preferences > Updates > Uncheck "Automatically check for updates"
   # Windows: Settings > Updates > Disable auto-update
   ```

3. **Prepare Electron Distribution** (30 minutes)
   - [ ] Download latest stable Electron version (v13.0.x)
   - [ ] Test installer on each platform
   - [ ] Prepare installation instructions
   - [ ] Update internal documentation

4. **Communicate to Users** (30 minutes)
   - [ ] Email announcement
   - [ ] Slack/Teams notification
   - [ ] Internal wiki update
   - [ ] Support team briefing

   **Email Template**:
   ```
   Subject: Important: Kui Rollback Instructions

   Team,

   We've identified an issue with the latest Kui Tauri release that affects
   [describe impact]. To ensure uninterrupted work, we're rolling back to
   the previous Electron-based version.

   ACTION REQUIRED:
   1. Uninstall current Kui version
   2. Install Electron version from: [internal distribution link]
   3. Verify your settings are intact
   4. Report any issues to [support contact]

   Your data and settings will be preserved during this rollback.

   Timeline: Please complete by [deadline]

   Questions? Contact [support contact]

   Thank you,
   [Your IT Team]
   ```

5. **Distribute Electron Version** (1-2 hours)
   - [ ] Internal software center/portal
   - [ ] Network share/download server
   - [ ] Package management system (SCCM, Jamf, etc.)
   - [ ] Direct distribution for remote workers

6. **Monitor Rollback** (1-2 hours)
   - [ ] Track rollback completion rate
   - [ ] Monitor for rollback issues
   - [ ] Support team ready for questions
   - [ ] Collect feedback

7. **Verify Success** (30 minutes)
   - [ ] Confirm > 90% of users rolled back
   - [ ] No new issues reported
   - [ ] Critical workflows operational
   - [ ] Document lessons learned

**Success Criteria**:
- [ ] All users successfully rolled back
- [ ] No data loss reported
- [ ] System stability restored
- [ ] Support ticket volume normalized

---

### Procedure 3: Public Release Rollback

**Timeline**: 1-2 hours
**Complexity**: High

**When to Use**:
- Critical issue affecting public release
- Need to prevent new downloads
- Emergency hotfix required

**Prerequisites**:
- GitHub repository admin access
- Release management permissions
- Communication channels ready
- Stakeholder approval

**Steps**:

1. **Emergency Response Team Assembly** (5 minutes)
   - [ ] Notify on-call team
   - [ ] Start incident bridge/call
   - [ ] Assign roles (coordinator, technical, communications)

2. **Mark Tauri Release as Problematic** (10 minutes)

   **Option A: Hide Release (Recommended)**
   ```bash
   # Via GitHub CLI
   gh release edit v13.1.0 --draft

   # This marks the release as draft, hiding it from public view
   ```

   **Option B: Add Warning to Release**
   - Edit release notes to add prominent warning
   - Update with link to previous stable release

   **Option C: Delete Release (Last Resort)**
   ```bash
   # Only if absolutely necessary
   gh release delete v13.1.0 --yes
   git push --delete origin v13.1.0
   ```

3. **Pin Previous Stable Release** (10 minutes)
   ```bash
   # Make sure v13.0.5 (or latest Electron) is marked as latest
   gh release edit v13.0.5 --latest

   # Update README.md to point to this version
   ```

4. **Update Auto-Update Manifest** (10 minutes)
   - Point auto-update server to previous version
   - Disable Tauri version from update feed
   - Test that existing users won't receive bad update

5. **Disable Distribution Channels** (30 minutes)

   **Homebrew**:
   ```bash
   # If formula was updated, revert the formula
   # File issue to homebrew-core requesting rollback
   ```

   **Package Managers**:
   - Debian/Ubuntu: Mark package as problematic
   - Chocolatey: Unlist package version
   - Winget: Remove manifest or add warning

6. **Public Communication** (30 minutes)

   **GitHub Issue**:
   - Create pinned issue explaining the situation
   - Link to previous stable release
   - Provide rollback instructions

   **Blog Post**:
   ```markdown
   # Important Notice: Kui v13.1.0 Temporary Rollback

   We've identified a critical issue in Kui v13.1.0 (Tauri edition)
   affecting [specific issue]. Out of an abundance of caution, we're
   temporarily rolling back to v13.0.5 while we address this issue.

   ## If You've Already Installed v13.1.0

   Please follow these rollback instructions: [link]

   ## If You Haven't Updated Yet

   Please continue using your current version. We'll announce when
   the Tauri edition is ready.

   ## Timeline

   We expect to resolve this within [timeframe] and will provide
   updates every [frequency].

   ## Questions?

   Please see our [GitHub Discussions](link) or open an issue.

   Thank you for your patience.
   ```

   **Social Media**:
   - Twitter/X announcement
   - Reddit post (r/kubernetes)
   - Kubernetes Slack channels

7. **Monitor Situation** (Ongoing)
   - Track issue reports
   - Monitor rollback completion
   - Watch for additional issues
   - Keep stakeholders updated

8. **Hotfix or Re-Release** (Variable timeline)

   **Option A: Emergency Hotfix**
   - Fix critical issue immediately
   - Fast-track testing
   - Release as v13.1.1
   - Resume distribution

   **Option B: Return to Beta**
   - Pull stable release
   - Re-release as beta
   - Extended testing period
   - Gradual re-rollout

   **Option C: Delay Stable Release**
   - Continue with Electron for now
   - Fix issues thoroughly
   - Plan future Tauri release (v13.2.0)

**Incident Communication Template**:

```
INCIDENT UPDATE #X - [Timestamp]

Status: [Investigating / Identified / Resolving / Resolved]

Summary:
[Brief description of issue and impact]

Actions Taken:
- [List of steps completed]

Current Status:
[What's happening now]

Next Steps:
[Planned actions]

Timeline:
[Expected resolution time]

User Impact:
[How many users affected, what's broken]

Workaround:
[If available]

Next Update:
[When to expect next update]
```

---

### Procedure 4: Emergency Hotfix (No Full Rollback)

**Timeline**: 30 minutes to 2 hours
**Complexity**: Low to Medium

**When to Use**:
- Issue is fixable quickly
- Rollback would cause more disruption
- Hotfix can be deployed rapidly

**Steps**:

1. **Assess Fix Feasibility** (15 minutes)
   - [ ] Identify root cause
   - [ ] Estimate fix time
   - [ ] Determine if hotfix is viable
   - [ ] Get approval for hotfix approach

2. **Implement Fix** (30 minutes to 1 hour)
   - [ ] Write fix
   - [ ] Test fix locally
   - [ ] Code review (fast-track)
   - [ ] Update version to v13.1.1

3. **Fast-Track CI/CD** (30 minutes)
   - [ ] Build hotfix release
   - [ ] Run critical tests only
   - [ ] Manual testing on affected platforms
   - [ ] Generate installers

4. **Deploy Hotfix** (15 minutes)
   - [ ] Create GitHub release (v13.1.1)
   - [ ] Mark as "Important Security/Bug Fix Update"
   - [ ] Update auto-update manifest
   - [ ] Notify users via in-app notification if possible

5. **Verify Fix** (30 minutes)
   - [ ] Test hotfix on affected platforms
   - [ ] Monitor crash reports
   - [ ] Collect user feedback
   - [ ] Confirm issue resolved

**Decision Criteria**:

| Factor | Hotfix | Full Rollback |
|--------|--------|---------------|
| **Fix Time** | < 2 hours | > 4 hours |
| **Confidence** | High (>90%) | Low (<70%) |
| **User Impact** | Moderate | Severe |
| **Risk** | Low | High |
| **Data Loss** | No | Yes |

---

## Platform-Specific Instructions

### macOS Rollback

**Tauri Location**:
- Application: `/Applications/Kui.app`
- Settings: `~/Library/Application Support/org.kui-shell.kui/`
- Logs: `~/Library/Logs/org.kui-shell.kui/`

**Electron Location**:
- Application: `/Applications/Kui.app` (same)
- Settings: `~/Library/Application Support/kui/` (or same as Tauri)

**Uninstall Tauri**:
```bash
# Remove application
rm -rf /Applications/Kui.app

# Remove via Homebrew if applicable
brew uninstall kui

# Optional: Remove settings (not recommended, data preserved for rollback)
# rm -rf ~/Library/Application\ Support/org.kui-shell.kui
```

**Install Electron**:
```bash
# Download DMG from GitHub Releases
curl -LO https://github.com/IBM/kui/releases/download/v13.0.5/Kui-13.0.5-macos.dmg

# Mount and install
hdiutil attach Kui-13.0.5-macos.dmg
cp -R /Volumes/Kui/Kui.app /Applications/
hdiutil detach /Volumes/Kui

# Or via Homebrew (if available)
brew install kui@13.0.5
```

**Verification**:
```bash
# Launch Kui
open /Applications/Kui.app

# Check version (should be < 13.1.0)
```

---

### Linux Rollback

**Tauri Location**:
- Settings: `~/.config/org.kui-shell.kui/`
- Logs: `~/.local/share/org.kui-shell.kui/logs/`

**Uninstall Tauri**:

**DEB Package**:
```bash
sudo apt remove kui
sudo apt autoremove
```

**AppImage**:
```bash
# Simply delete the file
rm ~/Applications/Kui-*.AppImage
# Or wherever you stored it
```

**Install Electron**:

**DEB Package**:
```bash
# Download DEB
wget https://github.com/IBM/kui/releases/download/v13.0.5/Kui-13.0.5-linux-amd64.deb

# Install
sudo apt install ./Kui-13.0.5-linux-amd64.deb
```

**AppImage**:
```bash
# Download AppImage
wget https://github.com/IBM/kui/releases/download/v13.0.5/Kui-13.0.5-linux-x86_64.AppImage

# Make executable
chmod +x Kui-13.0.5-linux-x86_64.AppImage

# Run
./Kui-13.0.5-linux-x86_64.AppImage
```

**Verification**:
```bash
# Launch Kui
kui # or ./Kui-*.AppImage

# Check version
kui version
```

---

### Windows Rollback

**Tauri Location**:
- Installation: `C:\Program Files\Kui\`
- Settings: `%APPDATA%\org.kui-shell.kui\`
- Logs: `%APPDATA%\org.kui-shell.kui\logs\`

**Uninstall Tauri**:

**Via Settings**:
1. Settings > Apps > Kui > Uninstall

**Via PowerShell**:
```powershell
# Uninstall via MSI
$app = Get-WmiObject -Class Win32_Product | Where-Object { $_.Name -eq "Kui" }
$app.Uninstall()

# Or via Chocolatey if applicable
choco uninstall kui
```

**Install Electron**:

**MSI Installer**:
```powershell
# Download MSI
Invoke-WebRequest -Uri "https://github.com/IBM/kui/releases/download/v13.0.5/Kui-13.0.5-windows-x64.msi" -OutFile "Kui-13.0.5.msi"

# Install
Start-Process msiexec.exe -ArgumentList "/i Kui-13.0.5.msi /quiet" -Wait
```

**Via Chocolatey**:
```powershell
choco install kui --version 13.0.5
```

**Verification**:
```powershell
# Launch Kui
Start-Process "C:\Program Files\Kui\Kui.exe"

# Check version
kui version
```

---

## Communication Plan

### Internal Communication (Team)

**Immediate Notification** (0-5 minutes):
- Slack: #kui-emergency channel
- Email: Emergency distribution list
- Phone: On-call engineer

**Status Updates** (Every 30 minutes):
- Incident status dashboard
- Slack updates in #kui-emergency
- Email summary to stakeholders

**Post-Resolution**:
- Post-mortem meeting scheduled
- Incident report published
- Lessons learned documented

---

### External Communication (Users)

**Notification Channels**:
1. **GitHub**:
   - Create pinned issue
   - Update release notes
   - Post in Discussions

2. **Website/Blog**:
   - Prominent banner notification
   - Blog post explaining situation
   - Link to rollback instructions

3. **Social Media**:
   - Twitter/X announcement
   - Reddit post
   - Kubernetes Slack

4. **In-App Notification** (if possible):
   - Warning dialog on launch
   - Link to rollback guide

**Message Template**:

```markdown
# Important Notice: Kui v13.1.0 Rollback

We've identified an issue with Kui v13.1.0 that affects [description].
We're working to resolve it, but in the meantime, we recommend rolling
back to v13.0.5.

## What You Need to Do

1. Follow our rollback guide: [link]
2. Your data and settings will be preserved
3. You can safely continue working with v13.0.5

## Timeline

- Issue discovered: [timestamp]
- Rollback initiated: [timestamp]
- Expected resolution: [timeframe]

## Questions?

- GitHub Issues: [link]
- Discussions: [link]
- Support: [email/link]

We apologize for the inconvenience and appreciate your patience.
```

---

## Post-Rollback Actions

### Immediate (Within 24 hours)

1. **Incident Post-Mortem**
   - [ ] Schedule meeting within 24 hours
   - [ ] Identify root cause
   - [ ] Document timeline
   - [ ] Identify what went wrong

2. **User Communication**
   - [ ] Thank users for patience
   - [ ] Explain situation and resolution plan
   - [ ] Set expectations for future release

3. **Data Collection**
   - [ ] Gather all crash reports
   - [ ] Collect user feedback
   - [ ] Analyze metrics before/during/after
   - [ ] Document user impact

### Short-Term (Within 1 week)

1. **Root Cause Analysis**
   - [ ] Complete technical investigation
   - [ ] Identify all contributing factors
   - [ ] Determine how issue escaped testing
   - [ ] Document findings

2. **Fix Implementation**
   - [ ] Develop comprehensive fix
   - [ ] Enhanced testing for this scenario
   - [ ] Code review with focus on this issue
   - [ ] Validation on all platforms

3. **Process Improvements**
   - [ ] Update testing procedures
   - [ ] Enhance monitoring/alerting
   - [ ] Improve rollback procedures
   - [ ] Update documentation

### Long-Term (Within 1 month)

1. **Release Plan Update**
   - [ ] Revise release timeline
   - [ ] Enhanced beta testing period
   - [ ] Additional validation gates
   - [ ] Improved rollout strategy

2. **Documentation**
   - [ ] Update deployment plan
   - [ ] Enhance rollback procedures
   - [ ] Improve incident response
   - [ ] Share lessons learned

3. **System Improvements**
   - [ ] Better telemetry/monitoring
   - [ ] Improved auto-update mechanism
   - [ ] Canary deployment capability
   - [ ] Faster hotfix pipeline

---

## Prevention & Mitigation

### Pre-Release Prevention

1. **Enhanced Testing**
   - Multi-platform testing matrix
   - Extended beta period
   - Larger alpha/beta user base
   - Automated crash reporting

2. **Gradual Rollout**
   - Phased release (10% → 25% → 50% → 100%)
   - Platform-specific staging
   - Early warning system
   - Quick rollback capability

3. **Monitoring & Alerts**
   - Real-time crash monitoring
   - Performance regression alerts
   - User feedback monitoring
   - Automated health checks

### Rollback Mitigation

1. **Dual Runtime Support**
   - Maintain Electron builds
   - Document coexistence
   - Test migration paths
   - Ensure compatibility

2. **Data Protection**
   - Automatic settings backup
   - Configuration versioning
   - Migration validation
   - Recovery procedures

3. **Fast Response**
   - On-call rotation
   - Incident response procedures
   - Fast-track CI/CD for hotfixes
   - Clear escalation paths

---

## Appendix: Quick Reference

### Rollback Decision Matrix

| Issue Severity | Crash Rate | Response Time | Action |
|----------------|------------|---------------|--------|
| **Critical** | >10% | Immediate | Full rollback |
| **High** | 5-10% | 24 hours | Rollback or hotfix |
| **Medium** | 2-5% | 7 days | Evaluate options |
| **Low** | <2% | Monitor | Fix in next release |

### Emergency Contacts

- **On-Call Engineer**: [Contact Info]
- **Engineering Manager**: [Contact Info]
- **Product Manager**: [Contact Info]
- **DevOps Lead**: [Contact Info]

### Key Links

- GitHub Releases: https://github.com/IBM/kui/releases
- Issue Tracker: https://github.com/IBM/kui/issues
- Discussions: https://github.com/IBM/kui/discussions
- Documentation: https://github.com/IBM/kui/tree/master/docs

### Rollback Time Estimates

| Scope | Preparation | Execution | Verification | Total |
|-------|-------------|-----------|--------------|-------|
| Individual | 0 min | 5-10 min | 5 min | 10-15 min |
| Team | 30 min | 2 hours | 1 hour | 3.5 hours |
| Public | 30 min | 1 hour | 30 min | 2 hours |
| Hotfix | 15 min | 1-2 hours | 30 min | 2-3 hours |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-17 | Deployment Team | Initial rollback plan |

---

**This is a living document. Update after each incident or significant change.**
