# Auto-Update Configuration for Kui Tauri

**Purpose**: Configure and manage automatic updates for Kui Tauri applications
**Status**: Production Ready
**Last Updated**: 2025-12-17

## Table of Contents

1. [Overview](#overview)
2. [How Auto-Update Works](#how-auto-update-works)
3. [Configuration](#configuration)
4. [Update Manifest](#update-manifest)
5. [Signing & Security](#signing--security)
6. [Update Channels](#update-channels)
7. [User Experience](#user-experience)
8. [Troubleshooting](#troubleshooting)

---

## Overview

Kui uses Tauri's built-in auto-update system to deliver seamless updates to users. Updates are:
- **Secure**: Cryptographically signed and verified
- **Efficient**: Only downloads necessary changes
- **User-Friendly**: Non-intrusive with clear notifications
- **Reliable**: Automatic rollback on failure

### Benefits

- **No manual downloads**: Users automatically get latest version
- **Security patches**: Critical updates deployed rapidly
- **Better adoption**: Users stay up-to-date effortlessly
- **Telemetry**: Track update success/failure rates

---

## How Auto-Update Works

### Update Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. App checks for updates                              │
│     • On startup (if last check > 24h)                  │
│     • Background check every 24h                        │
│     • Manual check via menu                             │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  2. Fetch update manifest from server                   │
│     • GET https://releases.kui-shell.org/update.json    │
│     • Compare current version vs available version      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
            ┌──────────────┐
            │ Update       │
            │ available?   │
            └──┬────────┬──┘
               │        │
               No      Yes
               │        │
               ▼        ▼
    ┌──────────────┐ ┌─────────────────────────────────┐
    │  No action   │ │  3. Notify user                 │
    └──────────────┘ │     • Release notes shown       │
                     │     • User confirms update      │
                     └──────────────┬──────────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────────┐
                     │  4. Download update             │
                     │     • Progress shown            │
                     │     • Signature verified        │
                     └──────────────┬──────────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────────┐
                     │  5. Install update              │
                     │     • On next restart (default) │
                     │     • Or immediately (optional) │
                     └──────────────┬──────────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────────┐
                     │  6. Verify installation         │
                     │     • App launches correctly    │
                     │     • Version updated           │
                     │     • Telemetry sent            │
                     └─────────────────────────────────┘
```

### Update Mechanism

**macOS**:
- DMG files with signed app bundles
- Installs via macOS Installer API
- Preserves settings and data

**Linux**:
- AppImage: Self-updating via integrated updater
- DEB: System package manager handles updates
- Manual download fallback

**Windows**:
- MSI installer with Windows Installer API
- Silent update in background
- Elevation prompt if needed

---

## Configuration

### Tauri Configuration

File: `/Users/elad/PROJ/kui/src-tauri/tauri.conf.json`

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://releases.kui-shell.org/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY_HERE",
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

### Configuration Options

#### `active` (boolean)
- **Default**: `true`
- **Description**: Enable/disable auto-update system
- **Production**: `true`
- **Development**: `false` (set via environment variable)

#### `endpoints` (array of strings)
- **Description**: URLs to check for updates
- **Variables**:
  - `{{target}}`: Platform target (e.g., `darwin-x86_64`, `linux-x86_64`)
  - `{{current_version}}`: Currently installed version
  - `{{arch}}`: Architecture (x86_64, aarch64)
- **Example**:
  ```
  https://releases.kui-shell.org/darwin-x86_64/13.0.5
  ```

#### `dialog` (boolean)
- **Default**: `true`
- **Description**: Show dialog when update available
- **Options**:
  - `true`: User confirms update (recommended)
  - `false`: Update silently (not recommended)

#### `pubkey` (string)
- **Description**: Public key for signature verification
- **Required**: Yes (for security)
- **Format**: Base64-encoded Ed25519 public key
- **Generation**: See [Signing & Security](#signing--security)

#### `windows.installMode` (string)
- **Options**:
  - `"passive"`: Background install, minimal UI
  - `"quiet"`: Completely silent
  - `"interactive"`: Full installer UI
- **Recommended**: `"passive"`

### Environment Variables

Control auto-update behavior at runtime:

```bash
# Disable auto-update (development)
export TAURI_SKIP_UPDATER_CHECK=1

# Use custom update server
export TAURI_UPDATER_ENDPOINTS=https://staging.kui-shell.org/updates

# Force update check on startup
export TAURI_FORCE_UPDATE_CHECK=1
```

### User Preferences

File: `~/.config/org.kui-shell.kui/preferences.json`

```json
{
  "updates": {
    "autoCheck": true,
    "autoDownload": true,
    "channel": "stable",
    "notifyOnAvailable": true
  }
}
```

---

## Update Manifest

### Manifest Format

File: `update.json` (served by update server)

```json
{
  "version": "13.1.0",
  "notes": "Release notes in markdown format...",
  "pub_date": "2025-12-17T10:00:00Z",
  "platforms": {
    "darwin-x86_64": {
      "signature": "BASE64_SIGNATURE_HERE",
      "url": "https://github.com/IBM/kui/releases/download/v13.1.0/Kui-13.1.0-macos-x64.dmg",
      "with_elevated_task": false
    },
    "darwin-aarch64": {
      "signature": "BASE64_SIGNATURE_HERE",
      "url": "https://github.com/IBM/kui/releases/download/v13.1.0/Kui-13.1.0-macos-arm64.dmg",
      "with_elevated_task": false
    },
    "linux-x86_64": {
      "signature": "BASE64_SIGNATURE_HERE",
      "url": "https://github.com/IBM/kui/releases/download/v13.1.0/Kui-13.1.0-linux-x64.AppImage",
      "with_elevated_task": false
    },
    "windows-x86_64": {
      "signature": "BASE64_SIGNATURE_HERE",
      "url": "https://github.com/IBM/kui/releases/download/v13.1.0/Kui-13.1.0-windows-x64.msi",
      "with_elevated_task": true
    }
  }
}
```

### Field Descriptions

#### `version` (string, required)
- Semantic version of the update
- Must be greater than current version
- Example: `"13.1.0"`, `"13.2.0-beta.1"`

#### `notes` (string, optional)
- Release notes shown to user
- Supports markdown formatting
- Keep concise (< 500 words)

#### `pub_date` (string, required)
- Publication date in ISO 8601 format
- UTC timezone
- Example: `"2025-12-17T10:00:00Z"`

#### `platforms` (object, required)
- Platform-specific update information
- Keys: `darwin-x86_64`, `darwin-aarch64`, `linux-x86_64`, `windows-x86_64`

#### `platforms.<target>.signature` (string, required)
- Cryptographic signature of the update file
- Base64-encoded Ed25519 signature
- Verified before installation
- See [Signing & Security](#signing--security)

#### `platforms.<target>.url` (string, required)
- Direct download URL for update
- Must be HTTPS
- Should support range requests for resume

#### `platforms.<target>.with_elevated_task` (boolean, optional)
- Whether update requires elevated privileges
- `true`: Request admin/sudo
- `false`: User-level install (default)

### Generating Manifests

#### Manual Generation

```bash
# Generate manifest template
cat > update.json << 'EOF'
{
  "version": "13.1.0",
  "notes": "See release notes at...",
  "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "platforms": {}
}
EOF

# Add platform-specific entries
# See signature generation below
```

#### Automated Generation

Add to `.github/workflows/tauri-release.yml`:

```yaml
- name: Generate update manifest
  run: |
    VERSION="${{ needs.validate.outputs.version }}"

    # Create manifest
    cat > update-manifest.json << EOF
    {
      "version": "$VERSION",
      "notes": "Release $VERSION - see https://github.com/IBM/kui/releases/tag/v$VERSION",
      "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
      "platforms": {
        "darwin-x86_64": {
          "signature": "$(cat release-artifacts/Kui-$VERSION-macos-x64.dmg.sig)",
          "url": "https://github.com/IBM/kui/releases/download/v$VERSION/Kui-$VERSION-macos-x64.dmg"
        },
        "darwin-aarch64": {
          "signature": "$(cat release-artifacts/Kui-$VERSION-macos-arm64.dmg.sig)",
          "url": "https://github.com/IBM/kui/releases/download/v$VERSION/Kui-$VERSION-macos-arm64.dmg"
        },
        "linux-x86_64": {
          "signature": "$(cat release-artifacts/Kui-$VERSION-linux-x64.AppImage.sig)",
          "url": "https://github.com/IBM/kui/releases/download/v$VERSION/Kui-$VERSION-linux-x64.AppImage"
        },
        "windows-x86_64": {
          "signature": "$(cat release-artifacts/Kui-$VERSION-windows-x64.msi.sig)",
          "url": "https://github.com/IBM/kui/releases/download/v$VERSION/Kui-$VERSION-windows-x64.msi"
        }
      }
    }
    EOF

- name: Upload manifest to update server
  run: |
    # Upload to S3, CDN, or static hosting
    aws s3 cp update-manifest.json s3://kui-updates/latest.json
```

---

## Signing & Security

### Key Generation

**Generate signing key pair** (one-time setup):

```bash
# Install Tauri CLI if not already installed
cargo install tauri-cli

# Generate key pair
cd src-tauri
cargo tauri signer generate -w ~/.tauri/kui-signing-key

# Output:
# Private key saved to: ~/.tauri/kui-signing-key
# Public key: dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEU4N...
```

**Store keys securely**:

```bash
# Private key (NEVER commit to git!)
export TAURI_PRIVATE_KEY=$(cat ~/.tauri/kui-signing-key)
export TAURI_KEY_PASSWORD="your-strong-password"

# Add to GitHub Secrets:
# TAURI_PRIVATE_KEY: [private key content]
# TAURI_KEY_PASSWORD: [password]

# Public key (add to tauri.conf.json)
# Copy the "Public key:" output to updater.pubkey
```

### Signing Update Files

**During build** (automatic):

Tauri automatically signs bundles during `cargo tauri build` if keys are configured.

**Manual signing** (if needed):

```bash
# Sign a bundle
cargo tauri signer sign \
  -k ~/.tauri/kui-signing-key \
  -p "your-password" \
  release-artifacts/Kui-13.1.0-macos-x64.dmg

# Output: Kui-13.1.0-macos-x64.dmg.sig
```

### Signature Verification

**Automatic** (by Tauri updater):
- Downloads update file
- Downloads signature
- Verifies signature using public key in config
- Rejects if signature invalid

**Manual verification**:

```bash
# Verify signature
cargo tauri signer verify \
  -k "PUBLIC_KEY_HERE" \
  -s release-artifacts/Kui-13.1.0-macos-x64.dmg.sig \
  release-artifacts/Kui-13.1.0-macos-x64.dmg

# Output: "Signature is valid" or error
```

### Security Best Practices

1. **Never commit private keys**
   - Store in GitHub Secrets or secure vault
   - Never in source code
   - Use environment variables

2. **Rotate keys periodically**
   - Generate new key pair annually
   - Gradual migration with both keys active
   - Deprecate old key after transition

3. **Use strong passwords**
   - Private key should be password-protected
   - Use password manager
   - Unique, complex password

4. **Secure update server**
   - HTTPS only
   - DDoS protection
   - Rate limiting
   - Access logging

5. **Monitor for compromises**
   - Alert on signature verification failures
   - Track unusual update patterns
   - Security audit logs

---

## Update Channels

### Channel Types

| Channel | Version Format | Audience | Update Frequency |
|---------|----------------|----------|------------------|
| **stable** | X.Y.Z | All users | Monthly/Quarterly |
| **beta** | X.Y.Z-beta.N | Opt-in testers | Bi-weekly |
| **alpha** | X.Y.Z-alpha.N | Developers | Weekly |
| **nightly** | X.Y.Z-nightly.DATE | Early adopters | Daily |

### Channel Configuration

#### Server-Side

Serve different manifests per channel:

```
https://releases.kui-shell.org/stable/update.json
https://releases.kui-shell.org/beta/update.json
https://releases.kui-shell.org/alpha/update.json
```

Update `tauri.conf.json` endpoints:

```json
{
  "updater": {
    "endpoints": [
      "https://releases.kui-shell.org/{{channel}}/{{target}}/{{current_version}}"
    ]
  }
}
```

#### Client-Side

User selects channel in preferences:

```typescript
// src/settings/UpdateSettings.tsx
import { setUpdateChannel } from '@kui-shell/core/updater'

function UpdateSettings() {
  const [channel, setChannel] = useState('stable')

  const handleChannelChange = (newChannel: string) => {
    setChannel(newChannel)
    setUpdateChannel(newChannel)
    // Trigger update check with new channel
  }

  return (
    <select value={channel} onChange={(e) => handleChannelChange(e.target.value)}>
      <option value="stable">Stable (Recommended)</option>
      <option value="beta">Beta (Early Access)</option>
      <option value="alpha">Alpha (Experimental)</option>
    </select>
  )
}
```

### Channel Migration

**Upgrading channel** (stable → beta):
- User opts in
- Check for beta updates
- Download and install beta version
- User can revert to stable anytime

**Downgrading channel** (beta → stable):
- User opts back to stable
- Check for stable updates
- If current version > latest stable, stay on current
- Next stable release will auto-update

---

## User Experience

### Update Notification

**Default Dialog**:
```
┌─────────────────────────────────────────────┐
│  Update Available                           │
│                                             │
│  Kui v13.1.0 is now available.              │
│  You are currently using v13.0.5.           │
│                                             │
│  What's New:                                │
│  • 10x smaller bundle size                  │
│  • 4x faster startup                        │
│  • 50% less memory usage                    │
│  • Bug fixes and improvements               │
│                                             │
│  [ View Release Notes ]                     │
│                                             │
│  [  Later  ]  [  Download & Install  ]      │
└─────────────────────────────────────────────┘
```

**Custom Dialog** (optional):

```typescript
// src/main/updater.ts
import { listen } from '@tauri-apps/api/event'
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'

listen('tauri://update-available', (event) => {
  // Custom notification
  showUpdateNotification({
    version: event.payload.version,
    notes: event.payload.body,
    onInstall: () => installUpdate(),
    onDismiss: () => {}
  })
})
```

### Menu Integration

Add to application menu:

```rust
// src-tauri/src/menu.rs
use tauri::menu::{Menu, MenuItem};

pub fn setup_menu(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let menu = Menu::with_items(app, &[
        &Submenu::with_items(app, "Help", true, &[
            &MenuItem::with_id(app, "check-updates", "Check for Updates...", true, None::<&str>)?,
            // ...
        ])?
    ])?;

    app.set_menu(menu)?;
    Ok(())
}
```

Handle menu action:

```rust
// src-tauri/src/main.rs
app.on_menu_event(|app, event| {
    if event.id == "check-updates" {
        // Trigger update check
        tauri::async_runtime::spawn(async move {
            match tauri::updater::builder(app.clone()).check().await {
                Ok(update) => {
                    if update.is_update_available() {
                        update.download_and_install().await.ok();
                    } else {
                        // Show "You're up to date" dialog
                    }
                }
                Err(e) => eprintln!("Update check failed: {}", e),
            }
        });
    }
});
```

### Progress Indication

```typescript
// src/main/updater.ts
import { listen } from '@tauri-apps/api/event'

listen('tauri://update-download-progress', (event) => {
  const { chunkLength, contentLength } = event.payload
  const progress = (chunkLength / contentLength) * 100

  // Update progress bar
  updateProgressBar(progress)
})

listen('tauri://update-status', (event) => {
  console.log('Update status:', event.payload)
  // PENDING, DOWNLOADING, DOWNLOADED, ERROR
})
```

---

## Troubleshooting

### Common Issues

#### Update Check Fails

**Symptom**: "Failed to check for updates"

**Causes**:
1. Network connectivity issue
2. Update server down
3. Invalid manifest URL
4. Firewall/proxy blocking

**Solutions**:
```bash
# Check network
ping releases.kui-shell.org

# Test manifest URL
curl https://releases.kui-shell.org/stable/update.json

# Check logs
tail -f ~/Library/Logs/org.kui-shell.kui/updater.log  # macOS
tail -f ~/.local/share/org.kui-shell.kui/logs/updater.log  # Linux
```

#### Signature Verification Fails

**Symptom**: "Update signature invalid"

**Causes**:
1. Public key mismatch
2. Corrupted download
3. Man-in-the-middle attack
4. Unsigned bundle

**Solutions**:
```bash
# Verify public key in tauri.conf.json matches signing key
cat src-tauri/tauri.conf.json | grep pubkey

# Re-download update
rm -rf ~/Library/Caches/org.kui-shell.kui/updates/*

# Check for MITM (network interception)
# Use VPN or different network
```

#### Install Fails

**Symptom**: "Failed to install update"

**Causes**:
1. Insufficient permissions
2. Disk full
3. Corrupted installer
4. Conflicting process

**Solutions**:
```bash
# Check disk space
df -h

# Check permissions (macOS)
ls -la /Applications/Kui.app

# Kill conflicting processes
killall Kui

# Try manual install
# Download from GitHub Releases
```

#### Update Loop

**Symptom**: Update installs but version doesn't change

**Causes**:
1. Version number not updated in binary
2. Manifest version incorrect
3. Cache issue

**Solutions**:
```bash
# Check installed version
/Applications/Kui.app/Contents/MacOS/kui --version

# Clear update cache
rm -rf ~/Library/Caches/org.kui-shell.kui/updates/*

# Reinstall manually
```

### Debug Mode

Enable debug logging:

```bash
# Environment variable
export RUST_LOG=tauri::updater=debug

# Launch app
/Applications/Kui.app/Contents/MacOS/kui

# Logs location:
# macOS: ~/Library/Logs/org.kui-shell.kui/
# Linux: ~/.local/share/org.kui-shell.kui/logs/
# Windows: %APPDATA%\org.kui-shell.kui\logs\
```

### Testing Updates

#### Local Testing

1. **Set up local update server**:
   ```bash
   # Serve manifest locally
   cd test-updates
   python -m http.server 8080
   ```

2. **Update tauri.conf.json**:
   ```json
   {
     "updater": {
       "endpoints": ["http://localhost:8080/update.json"]
     }
   }
   ```

3. **Create test manifest**:
   ```json
   {
     "version": "13.99.0",
     "notes": "Test update",
     "pub_date": "2025-12-17T00:00:00Z",
     "platforms": {
       "darwin-x86_64": {
         "signature": "...",
         "url": "http://localhost:8080/Kui-test.dmg"
       }
     }
   }
   ```

4. **Test update flow**:
   - Launch app (v13.1.0)
   - Check for updates
   - Should detect v13.99.0
   - Download and install
   - Verify installation

#### Staging Environment

```bash
# Use staging update server
export TAURI_UPDATER_ENDPOINTS=https://staging.kui-shell.org/updates

# Launch app
npm run open
```

---

## Reference

### Tauri Updater API

```typescript
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater'
import { relaunch } from '@tauri-apps/api/process'

// Check for updates
const update = await checkUpdate()

if (update.shouldUpdate) {
  console.log(`Update available: ${update.manifest.version}`)

  // Download and install
  await installUpdate()

  // Restart app
  await relaunch()
}
```

### Configuration Files

| File | Purpose |
|------|---------|
| `src-tauri/tauri.conf.json` | Updater configuration |
| `update.json` | Update manifest (server) |
| `~/.tauri/kui-signing-key` | Private signing key |
| `~/.config/org.kui-shell.kui/preferences.json` | User preferences |

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `TAURI_SKIP_UPDATER_CHECK` | Disable updates | `1` |
| `TAURI_UPDATER_ENDPOINTS` | Custom update URL | `https://...` |
| `TAURI_PRIVATE_KEY` | Signing key | `[base64]` |
| `TAURI_KEY_PASSWORD` | Key password | `secret` |
| `RUST_LOG` | Debug logging | `tauri::updater=debug` |

### Resources

- [Tauri Updater Guide](https://tauri.app/v1/guides/distribution/updater)
- [Tauri Updater API](https://tauri.app/v1/api/js/updater)
- [Code Signing Best Practices](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-17 | Initial auto-update documentation |

---

**Questions or Issues?**
- GitHub Issues: https://github.com/IBM/kui/issues
- Discussions: https://github.com/IBM/kui/discussions
