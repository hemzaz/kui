# Kui Documentation Structure and Consolidation Recommendations

**Status**: Documentation Review and Optimization
**Date**: 2025-12-17
**Purpose**: Organize and streamline Kui documentation for better maintainability

## Current Documentation Inventory

### Root Level Documentation

| File | Purpose | Status | Action |
|------|---------|--------|--------|
| `README.md` | Main project introduction | ✅ Updated | Keep, maintain |
| `CLAUDE.md` | AI assistant development guide | ✅ Updated | Keep, enhance |
| `CHANGELOG.md` | Version history | ✅ Active | Keep, maintain |
| `CONTRIBUTING.md` | Contribution guidelines | ⚠️ Needs update | Update with Tauri info |
| `TAURI_USER_GUIDE.md` | End-user guide (NEW) | ✅ Complete | Keep |
| `TAURI_DEVELOPER_GUIDE.md` | Developer guide (NEW) | ✅ Complete | Keep |
| `TAURI_MIGRATION.md` | Technical migration details | ✅ Complete | Archive to docs/ |
| `TAURI_MIGRATION_COMPLETE.md` | Migration completion report | ⚠️ Archive | Move to docs/archive/ |
| `TAURI_NEXT_STEPS.md` | Next steps (outdated) | ❌ Outdated | Delete or archive |
| `TAURI-IPC-MIGRATION-COMPLETE.md` | IPC migration report | ⚠️ Archive | Move to docs/archive/ |
| `TAURI_TEST_REPORT.md` | Test report | ⚠️ Archive | Move to docs/archive/ |
| `TAURI_TEST_VALIDATION_SUMMARY.md` | Test validation | ⚠️ Archive | Move to docs/archive/ |
| `PLUGIN_TEST_GUIDE.md` | Plugin testing guide | ✅ Keep | Keep |
| `SUMMARY.md` | Project summary | ⚠️ Needs update | Update or remove |

### docs/ Directory

| File | Purpose | Status | Action |
|------|---------|--------|--------|
| `docs/README.md` | Documentation index | ⚠️ Needs update | Update with new structure |
| `docs/TAURI-BRIDGE-USAGE.md` | IPC documentation | ✅ Complete | Keep |
| `docs/MIGRATING_TO_TAURI.md` | User migration guide | ✅ Complete | Keep |
| `docs/DUAL-RUNTIME-PLUGINS.md` | Plugin compatibility | ✅ Complete | Keep |
| `docs/api/` | API documentation | ✅ Active | Keep, maintain |
| `docs/features/` | Feature documentation | ✅ Active | Keep, maintain |
| `docs/presentations/` | Presentations | ✅ Historical | Keep |
| `docs/readme/` | Images and assets | ✅ Active | Keep |

### src-tauri/ Documentation

| File | Purpose | Status | Action |
|------|---------|--------|--------|
| `src-tauri/README.md` | Rust backend overview | ⚠️ Needs creation | Create |
| `src-tauri/DEPENDENCY_UPDATE.md` | Dependency report | ⚠️ Archive | Move to docs/archive/ |
| `src-tauri/MENU_SYSTEM_COMPLETE.md` | Menu implementation | ⚠️ Archive | Move to docs/archive/ |
| `src-tauri/MENU_IMPLEMENTATION_SUMMARY.md` | Menu summary | ⚠️ Archive | Move to docs/archive/ |
| `src-tauri/FRONTEND_MENU_INTEGRATION.md` | Menu integration | ⚠️ Archive | Move to docs/archive/ |
| `src-tauri/SCREENSHOT_IMPLEMENTATION.md` | Screenshot tech docs | ⚠️ Archive | Move to docs/archive/ |
| `src-tauri/SCREENSHOT_SUMMARY.md` | Screenshot summary | ⚠️ Archive | Move to docs/archive/ |
| `src-tauri/SCREENSHOT_TEST.md` | Screenshot testing | ⚠️ Archive | Move to docs/archive/ |

## Recommended Documentation Structure

### Proposed Organization

```
kui/
├── README.md                          # Main entry point (KEEP)
├── CHANGELOG.md                       # Version history (KEEP)
├── CONTRIBUTING.md                    # Contribution guide (UPDATE)
├── CLAUDE.md                          # AI development guide (KEEP)
├── LICENSE                            # License file (KEEP)
│
├── docs/                              # Main documentation directory
│   ├── README.md                      # Documentation index (UPDATE)
│   │
│   ├── user/                          # End-user documentation
│   │   ├── README.md                  # User docs index
│   │   ├── installation.md            # Installation guide
│   │   ├── getting-started.md         # Quick start
│   │   ├── user-guide.md              # Complete user guide (link to TAURI_USER_GUIDE.md)
│   │   ├── troubleshooting.md         # Troubleshooting
│   │   └── faq.md                     # FAQ
│   │
│   ├── developer/                     # Developer documentation
│   │   ├── README.md                  # Developer docs index
│   │   ├── setup.md                   # Development setup
│   │   ├── architecture.md            # Architecture overview
│   │   ├── developer-guide.md         # Complete dev guide (link to TAURI_DEVELOPER_GUIDE.md)
│   │   ├── building.md                # Building from source
│   │   ├── testing.md                 # Testing guide
│   │   ├── contributing.md            # Contribution workflow
│   │   └── plugin-development.md      # Plugin development guide
│   │
│   ├── technical/                     # Technical documentation
│   │   ├── README.md                  # Technical docs index
│   │   ├── tauri-architecture.md      # Tauri architecture
│   │   ├── tauri-bridge.md            # IPC bridge (link to TAURI-BRIDGE-USAGE.md)
│   │   ├── tauri-migration.md         # Migration details (link to TAURI_MIGRATION.md)
│   │   ├── dual-runtime.md            # Dual runtime support (link to DUAL-RUNTIME-PLUGINS.md)
│   │   ├── performance.md             # Performance characteristics
│   │   └── security.md                # Security model
│   │
│   ├── api/                           # API documentation (KEEP)
│   │   ├── README.md                  # API index
│   │   └── ...                        # Existing API docs
│   │
│   ├── features/                      # Feature documentation (KEEP)
│   │   ├── README.md                  # Features index
│   │   └── ...                        # Feature-specific docs
│   │
│   ├── guides/                        # How-to guides
│   │   ├── README.md                  # Guides index
│   │   ├── migration-from-electron.md # Migration guide (link to MIGRATING_TO_TAURI.md)
│   │   ├── kubernetes-setup.md        # K8s setup guide
│   │   ├── custom-themes.md           # Theme customization
│   │   └── plugin-installation.md     # Installing plugins
│   │
│   ├── archive/                       # Archived documentation
│   │   ├── README.md                  # Archive index
│   │   ├── migration-reports/         # Migration completion reports
│   │   ├── implementation-reports/    # Feature implementation reports
│   │   └── test-reports/              # Historical test reports
│   │
│   └── presentations/                 # Presentations (KEEP)
│       └── ...                        # Existing presentations
│
├── src-tauri/                         # Rust backend
│   ├── README.md                      # Backend overview (CREATE)
│   ├── Cargo.toml                     # Rust dependencies
│   ├── src/                           # Source code
│   │   └── *.rs                       # Inline documentation
│   └── target/                        # Build artifacts
│
└── ...                                # Other project files
```

## Action Plan

### Phase 1: Create New Structure (Immediate)

1. **Create directory structure:**
   ```bash
   mkdir -p docs/user
   mkdir -p docs/developer
   mkdir -p docs/technical
   mkdir -p docs/guides
   mkdir -p docs/archive/{migration-reports,implementation-reports,test-reports}
   ```

2. **Move user documentation:**
   - Move `TAURI_USER_GUIDE.md` to `docs/user/user-guide.md`
   - Create `docs/user/README.md` as index
   - Link from main README.md

3. **Move developer documentation:**
   - Move `TAURI_DEVELOPER_GUIDE.md` to `docs/developer/developer-guide.md`
   - Create `docs/developer/README.md` as index
   - Link from CLAUDE.md

4. **Move technical documentation:**
   - Move `TAURI_MIGRATION.md` to `docs/technical/tauri-migration.md`
   - Link existing `docs/TAURI-BRIDGE-USAGE.md` to `docs/technical/tauri-bridge.md`
   - Link existing `docs/DUAL-RUNTIME-PLUGINS.md` to `docs/technical/dual-runtime.md`

5. **Move guides:**
   - Link existing `docs/MIGRATING_TO_TAURI.md` to `docs/guides/migration-from-electron.md`

### Phase 2: Archive Outdated Documentation

1. **Archive completion reports:**
   ```bash
   mv TAURI_MIGRATION_COMPLETE.md docs/archive/migration-reports/
   mv TAURI-IPC-MIGRATION-COMPLETE.md docs/archive/migration-reports/
   mv TAURI_TEST_REPORT.md docs/archive/test-reports/
   mv TAURI_TEST_VALIDATION_SUMMARY.md docs/archive/test-reports/
   ```

2. **Archive implementation reports:**
   ```bash
   mv src-tauri/DEPENDENCY_UPDATE.md docs/archive/implementation-reports/
   mv src-tauri/MENU_SYSTEM_COMPLETE.md docs/archive/implementation-reports/
   mv src-tauri/MENU_IMPLEMENTATION_SUMMARY.md docs/archive/implementation-reports/
   mv src-tauri/FRONTEND_MENU_INTEGRATION.md docs/archive/implementation-reports/
   mv src-tauri/SCREENSHOT_IMPLEMENTATION.md docs/archive/implementation-reports/
   mv src-tauri/SCREENSHOT_SUMMARY.md docs/archive/implementation-reports/
   mv src-tauri/SCREENSHOT_TEST.md docs/archive/implementation-reports/
   ```

3. **Create archive README:**
   ```bash
   echo "# Archived Documentation

   Historical documentation from the Tauri migration project.
   These documents are preserved for reference but may be outdated.

   For current documentation, see the main docs/ directory.
   " > docs/archive/README.md
   ```

### Phase 3: Update Index Documents

1. **Update docs/README.md:**
   - Add links to new structure
   - Categorize by audience (user, developer, technical)
   - Add quick links section

2. **Create docs/user/README.md:**
   - Overview of user documentation
   - Links to installation, getting started, user guide
   - FAQ and troubleshooting links

3. **Create docs/developer/README.md:**
   - Overview of developer documentation
   - Links to setup, architecture, developer guide
   - Testing and contributing links

4. **Create docs/technical/README.md:**
   - Overview of technical documentation
   - Links to architecture, IPC, migration details
   - Performance and security documentation

### Phase 4: Update References

1. **Update README.md:**
   - Update documentation links
   - Add quick links section
   - Reference new structure

2. **Update CLAUDE.md:**
   - Update resources section
   - Reference new documentation structure
   - Update file paths

3. **Update CONTRIBUTING.md:**
   - Add Tauri-specific contribution guidelines
   - Reference developer guide
   - Update testing instructions

### Phase 5: Create Missing Documentation

1. **Create src-tauri/README.md:**
   - Overview of Rust backend
   - Building instructions
   - Architecture overview
   - Link to full developer guide

2. **Split TAURI_USER_GUIDE.md (optional):**
   - `docs/user/installation.md` - Installation section
   - `docs/user/getting-started.md` - First run section
   - `docs/user/troubleshooting.md` - Troubleshooting section
   - Keep full guide as single document too

3. **Create additional guides:**
   - Kubernetes setup guide
   - Custom theme development
   - Plugin installation guide

## Documentation Maintenance Guidelines

### General Principles

1. **Single Source of Truth:**
   - No duplicate documentation
   - Use links instead of copying content
   - Keep related docs in same location

2. **Audience-Specific:**
   - User docs: Focus on "how to use"
   - Developer docs: Focus on "how to build"
   - Technical docs: Focus on "how it works"

3. **Keep Updated:**
   - Update docs with code changes
   - Review quarterly for accuracy
   - Archive outdated content, don't delete

4. **Easy to Find:**
   - Clear directory structure
   - Comprehensive index files
   - Good search keywords

### Documentation Standards

**File Naming:**
- Use lowercase with hyphens: `user-guide.md`
- Be descriptive: `tauri-bridge-usage.md` not `bridge.md`
- Group related docs: `feature-x.md`, `feature-x-api.md`

**Content Structure:**
- Start with overview/summary
- Include table of contents for long docs
- Use clear headings and sections
- Add examples and code snippets
- Include troubleshooting section

**Markdown Style:**
- Use ATX-style headers (`#` not underlines)
- Use fenced code blocks with language
- Use relative links for internal docs
- Include alt text for images

**Code Examples:**
- Show complete, working examples
- Include error handling
- Add comments for clarity
- Test examples before committing

### Review Process

1. **New Documentation:**
   - Create PR with docs
   - Request review from docs team
   - Verify all links work
   - Check for typos and clarity

2. **Updates:**
   - Update with related code changes
   - Note breaking changes
   - Update version information
   - Test examples still work

3. **Quarterly Review:**
   - Check for outdated information
   - Update version numbers
   - Verify links still work
   - Archive obsolete content

## Migration Commands

### Quick Migration Script

```bash
#!/bin/bash
# migrate-docs.sh - Reorganize documentation

set -e

echo "Creating documentation structure..."
mkdir -p docs/{user,developer,technical,guides,archive/{migration-reports,implementation-reports,test-reports}}

echo "Moving user documentation..."
[ -f TAURI_USER_GUIDE.md ] && mv TAURI_USER_GUIDE.md docs/user/user-guide.md

echo "Moving developer documentation..."
[ -f TAURI_DEVELOPER_GUIDE.md ] && mv TAURI_DEVELOPER_GUIDE.md docs/developer/developer-guide.md

echo "Moving technical documentation..."
[ -f TAURI_MIGRATION.md ] && mv TAURI_MIGRATION.md docs/technical/tauri-migration.md

echo "Archiving completion reports..."
[ -f TAURI_MIGRATION_COMPLETE.md ] && mv TAURI_MIGRATION_COMPLETE.md docs/archive/migration-reports/
[ -f TAURI-IPC-MIGRATION-COMPLETE.md ] && mv TAURI-IPC-MIGRATION-COMPLETE.md docs/archive/migration-reports/
[ -f TAURI_TEST_REPORT.md ] && mv TAURI_TEST_REPORT.md docs/archive/test-reports/
[ -f TAURI_TEST_VALIDATION_SUMMARY.md ] && mv TAURI_TEST_VALIDATION_SUMMARY.md docs/archive/test-reports/

echo "Archiving implementation reports from src-tauri..."
for file in src-tauri/{DEPENDENCY_UPDATE,MENU_SYSTEM_COMPLETE,MENU_IMPLEMENTATION_SUMMARY,FRONTEND_MENU_INTEGRATION,SCREENSHOT_IMPLEMENTATION,SCREENSHOT_SUMMARY,SCREENSHOT_TEST}.md; do
    [ -f "$file" ] && mv "$file" docs/archive/implementation-reports/
done

echo "Removing outdated documentation..."
[ -f TAURI_NEXT_STEPS.md ] && rm TAURI_NEXT_STEPS.md

echo "Creating index files..."
cat > docs/user/README.md << 'EOF'
# User Documentation

Documentation for end users of Kui.

## Getting Started

- [Installation](../guides/migration-from-electron.md#installation)
- [First Run](user-guide.md#first-run)
- [Basic Usage](user-guide.md#using-kui)

## Complete Guides

- [User Guide](user-guide.md) - Complete guide for using Kui
- [Troubleshooting](user-guide.md#troubleshooting) - Common issues and solutions
- [FAQ](user-guide.md#faq) - Frequently asked questions

## Additional Resources

- [Migrating from Electron](../guides/migration-from-electron.md)
- [API Documentation](../api/README.md)
EOF

cat > docs/developer/README.md << 'EOF'
# Developer Documentation

Documentation for developers contributing to Kui.

## Getting Started

- [Development Setup](developer-guide.md#development-setup)
- [Architecture Overview](developer-guide.md#architecture-overview)
- [Building and Testing](developer-guide.md#building-and-testing)

## Complete Guides

- [Developer Guide](developer-guide.md) - Complete guide for developing Kui
- [Contributing Guidelines](developer-guide.md#contributing-guidelines)
- [Testing Strategy](developer-guide.md#testing-strategy)

## Technical References

- [Tauri Bridge](../technical/tauri-bridge.md) - IPC communication
- [Tauri Architecture](../technical/tauri-migration.md) - Technical details
- [API Documentation](../api/README.md) - API reference

## Additional Resources

- [CLAUDE.md](../../CLAUDE.md) - AI assistant guide
- [Plugin Development](developer-guide.md#adding-features)
EOF

cat > docs/technical/README.md << 'EOF'
# Technical Documentation

Technical documentation about Kui's architecture and implementation.

## Architecture

- [Tauri Architecture](tauri-migration.md) - Complete technical details
- [Tauri Bridge](tauri-bridge.md) - IPC communication layer
- [Dual Runtime Support](dual-runtime.md) - Tauri and Electron compatibility

## Migration

- [Tauri Migration](tauri-migration.md) - Technical migration details
- [User Migration Guide](../guides/migration-from-electron.md) - For end users

## Performance and Security

- [Performance Characteristics](tauri-migration.md#performance-improvements)
- [Security Model](tauri-migration.md#security-enhancements)

## Historical Documentation

- [Archive](../archive/README.md) - Historical reports and documentation
EOF

cat > docs/archive/README.md << 'EOF'
# Archived Documentation

Historical documentation from the Tauri migration project and other past initiatives.

**Note:** These documents are preserved for reference but may be outdated.
For current documentation, see the main docs/ directory.

## Migration Reports

Reports documenting the completion of the Tauri migration:

- Migration completion reports
- Implementation summaries
- Test validation reports

## Implementation Reports

Detailed implementation reports for specific features:

- Dependency updates
- Menu system implementation
- Screenshot functionality
- IPC migration

## Test Reports

Historical test reports and validation summaries.

---

**Last Updated:** 2025-12-17
**Archive Created:** As part of documentation reorganization
EOF

echo "Documentation migration complete!"
echo ""
echo "Next steps:"
echo "1. Review moved files and update internal links"
echo "2. Update main README.md with new structure"
echo "3. Update CLAUDE.md references"
echo "4. Commit changes"
```

## Link Update Strategy

### Internal Links to Update

After moving files, update these links:

1. **README.md:**
   - `[User Guide](TAURI_USER_GUIDE.md)` → `[User Guide](docs/user/user-guide.md)`
   - `[Developer Guide](TAURI_DEVELOPER_GUIDE.md)` → `[Developer Guide](docs/developer/developer-guide.md)`
   - `[Migration Guide](docs/MIGRATING_TO_TAURI.md)` → `[Migration Guide](docs/guides/migration-from-electron.md)`

2. **CLAUDE.md:**
   - Update resources section with new paths
   - Update quick reference with new structure

3. **docs/README.md:**
   - Update all documentation links
   - Add new structure overview

4. **Within documentation:**
   - Update cross-references between docs
   - Test all links after migration

### Link Checking

```bash
# Install markdown link checker
npm install -g markdown-link-check

# Check all markdown files
find . -name "*.md" -exec markdown-link-check {} \;

# Or use local config
markdown-link-check -c .markdown-link-check.json README.md
```

## Success Criteria

Documentation reorganization is complete when:

- [x] New directory structure created
- [ ] All files moved to appropriate locations
- [ ] All index files created
- [ ] All internal links updated and working
- [ ] README.md and CLAUDE.md updated
- [ ] No broken links (verified with link checker)
- [ ] Archive README explains historical context
- [ ] Git history preserved (use `git mv` not `mv`)

## Benefits of New Structure

1. **Better Organization:**
   - Clear separation by audience
   - Easy to find relevant docs
   - Logical grouping of related content

2. **Easier Maintenance:**
   - Know where to add new docs
   - Easy to update related docs together
   - Archive old content without deleting

3. **Better Discovery:**
   - Index files guide users
   - Clear hierarchy
   - Good for search engines

4. **Professional Appearance:**
   - Organized documentation structure
   - Easy to navigate
   - Consistent formatting

---

**Status**: Recommendation document complete
**Next Actions**: Execute migration script and update links
**Owner**: Documentation team
**Review Date**: Quarterly (next: 2025-03-17)
