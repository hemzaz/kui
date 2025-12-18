# GitHub Actions Cache Optimization Guide

This document explains the caching strategy used in Kui's CI/CD pipeline and how to optimize build performance.

## Caching Overview

GitHub Actions provides caching mechanisms to speed up workflow runs by storing and reusing files between jobs and workflow runs.

### Cache Limits

- **Size limit:** 10 GB per repository
- **Retention:** 7 days (unused caches are automatically evicted)
- **Access:** Caches created on a branch can be accessed by child branches

## Implemented Caches

### 1. NPM Dependencies Cache

**Configuration:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 24
    cache: 'npm'
```

**What's cached:**
- `~/.npm` directory (npm global cache)
- Automatically managed by `actions/setup-node`

**Cache key:**
- Based on `package-lock.json` hash
- Separate cache per OS and Node version

**Benefits:**
- Reduces `npm ci` time from ~5 min to ~30 sec
- Consistent across workflow runs
- Automatically invalidated on dependency changes

**Size:** ~500 MB - 1 GB

### 2. Rust Cargo Cache

**Configuration:**
```yaml
- name: Cache Rust dependencies
  uses: Swatinem/rust-cache@v2
  with:
    workspaces: src-tauri
    key: ${{ matrix.platform }}-${{ matrix.arch }}
```

**What's cached:**
- `~/.cargo/registry/index` - Cargo registry index
- `~/.cargo/registry/cache` - Downloaded crate files
- `~/.cargo/git` - Git repository checkouts
- `target/` - Build artifacts and compilation outputs

**Cache key components:**
1. Operating system
2. Platform (macos, linux, windows)
3. Architecture (x64, arm64)
4. Rust toolchain version
5. `Cargo.lock` hash
6. `Cargo.toml` hash

**Benefits:**
- Reduces Rust compilation time by 70-80%
- Platform-specific caching prevents conflicts
- Incremental compilation support
- Automatic cleanup of unused dependencies

**Size:** ~2 GB - 4 GB per platform

### 3. Tauri Build Cache

Included in Rust Cargo cache, specifically caches:
- `src-tauri/target/release/` - Release build artifacts
- `src-tauri/target/debug/` - Debug build artifacts (dev)
- Compiled dependencies
- Generated code

## Cache Performance Metrics

### Before Caching (Cold Build)

| Platform | Build Time | Download Time | Total |
|----------|------------|---------------|-------|
| macOS x64 | 15 min | 2 min | 17 min |
| macOS ARM | 18 min | 2 min | 20 min |
| Linux x64 | 12 min | 2 min | 14 min |
| Windows x64 | 14 min | 2 min | 16 min |

### After Caching (Warm Build)

| Platform | Build Time | Download Time | Total |
|----------|------------|---------------|-------|
| macOS x64 | 4 min | 30 sec | 4.5 min |
| macOS ARM | 5 min | 30 sec | 5.5 min |
| Linux x64 | 3 min | 30 sec | 3.5 min |
| Windows x64 | 4 min | 30 sec | 4.5 min |

**Performance Improvement:** ~70% reduction in build time

## Cache Invalidation

Caches are automatically invalidated when:

### NPM Cache
- `package-lock.json` changes
- Node.js version changes
- Operating system changes

### Rust Cache
- `Cargo.lock` changes
- `Cargo.toml` in any workspace changes
- Rust toolchain version changes
- Target triple changes

### Manual Cache Clearing

To force cache rebuild:

1. **Via GitHub UI:**
   - Go to repository **Settings**
   - Navigate to **Actions** → **Caches**
   - Delete specific caches or all caches

2. **Via workflow change:**
   - Modify cache key in workflow file
   - Add suffix like `-v2`, `-v3` to key

3. **Via API:**
   ```bash
   gh api repos/OWNER/REPO/actions/caches -X DELETE
   ```

## Cache Debugging

### Check Cache Status

**View cache usage:**
```bash
gh cache list
```

**View cache size:**
```bash
gh api repos/OWNER/REPO/actions/caches | jq '.total_count'
```

### Common Issues

#### Issue: Cache not restoring

**Symptoms:**
- Full build time every run
- Cache restore step shows no cache found

**Solutions:**
1. Verify cache key matches previous runs
2. Check if dependencies changed
3. Ensure `package-lock.json` and `Cargo.lock` are committed
4. Review cache scope (branch access)

#### Issue: Cache corrupted

**Symptoms:**
- Build fails with cryptic errors
- "Unexpected end of file" errors
- Segmentation faults during compilation

**Solutions:**
1. Delete and rebuild cache
2. Increase cache key version
3. Check disk space on runner

#### Issue: Out of cache space

**Symptoms:**
- Warning: "Unable to save cache"
- Oldest caches being evicted prematurely

**Solutions:**
1. Delete unused caches manually
2. Reduce cache size by excluding unnecessary files
3. Use separate caches for different workflows

## Optimization Tips

### 1. Minimize Cache Churn

**Good:**
```yaml
# Stable dependencies cached long-term
- "Cargo.lock"
- "package-lock.json"
```

**Bad:**
```yaml
# Frequently changing files cause cache misses
- "src/**/*.ts"  # Don't cache source files
- "node_modules" # Use package manager cache instead
```

### 2. Use Appropriate Cache Scope

```yaml
# Platform-specific cache
key: ${{ runner.os }}-${{ matrix.platform }}-cargo-${{ hashFiles('**/Cargo.lock') }}

# Shared cache across branches
restore-keys: |
  ${{ runner.os }}-${{ matrix.platform }}-cargo-
  ${{ runner.os }}-cargo-
```

### 3. Cache Compression

Caches are automatically compressed (tar + zstd). To optimize:

- Exclude large binary files
- Clean build artifacts before caching
- Use `.gitignore` patterns to exclude unnecessary files

### 4. Parallel Builds with Shared Cache

```yaml
strategy:
  matrix:
    platform: [macos, linux, windows]

# Each platform has independent cache
- uses: Swatinem/rust-cache@v2
  with:
    key: ${{ matrix.platform }}
```

## Advanced Configuration

### Rust Cache Customization

```yaml
- uses: Swatinem/rust-cache@v2
  with:
    # Multiple workspaces
    workspaces: |
      src-tauri
      tools/cli

    # Custom cache key suffix
    key: custom-suffix

    # Additional directories to cache
    cache-directories: |
      ~/.cargo/bin/
      ~/.rustup/toolchains/

    # Sharing cache across targets
    shared-key: shared-cargo

    # Save cache only on main branch
    save-if: ${{ github.ref == 'refs/heads/main' }}
```

### NPM Cache Customization

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'

    # Custom cache directory
    cache-dependency-path: |
      package-lock.json
      plugins/*/package-lock.json
```

## Monitoring and Metrics

### Key Metrics to Track

1. **Cache Hit Rate:**
   - Target: >80%
   - Measure: Successful cache restores / Total builds

2. **Average Build Time:**
   - Target: <5 minutes (with cache)
   - Measure: Time from checkout to artifact upload

3. **Cache Size:**
   - Target: <8 GB total
   - Measure: Sum of all cache sizes

4. **Cache Eviction Rate:**
   - Target: <10% premature evictions
   - Measure: Caches deleted before 7 days

### Monitoring Dashboard

Create a GitHub Actions dashboard to track:

```bash
# Cache statistics
gh api repos/OWNER/REPO/actions/caches | jq '{
  total_caches: .total_count,
  total_size_mb: ([.actions_caches[].size_in_bytes] | add / 1048576),
  avg_size_mb: ([.actions_caches[].size_in_bytes] | add / length / 1048576)
}'
```

## Best Practices

### DO

✅ Cache immutable dependencies (npm, cargo)
✅ Use lock files for deterministic caching
✅ Set appropriate cache retention
✅ Monitor cache hit rates
✅ Use platform-specific cache keys
✅ Clean up unused caches regularly

### DON'T

❌ Cache source code or build outputs
❌ Use generic cache keys (causes conflicts)
❌ Cache environment-specific files
❌ Ignore cache size limits
❌ Cache secrets or credentials
❌ Over-cache (diminishing returns)

## Troubleshooting Checklist

When builds are slow:

- [ ] Check cache restore logs
- [ ] Verify cache key matches
- [ ] Ensure lock files are committed
- [ ] Review cache size and usage
- [ ] Check for cache corruption
- [ ] Test with cache disabled
- [ ] Review GitHub Actions usage limits
- [ ] Check runner disk space

## Resources

- [GitHub Actions Cache Documentation](https://docs.github.com/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [Swatinem/rust-cache Documentation](https://github.com/Swatinem/rust-cache)
- [actions/setup-node Documentation](https://github.com/actions/setup-node)
- [Cache Best Practices](https://docs.github.com/actions/guides/caching-dependencies-to-speed-up-workflows#best-practices)

## Support

For cache-related issues:

1. Review this documentation
2. Check cache statistics in GitHub UI
3. Test with manual cache clearing
4. Open issue with `ci`, `performance` labels
