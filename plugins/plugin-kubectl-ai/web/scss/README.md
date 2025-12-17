# AI Plugin Styles

This directory contains SCSS styling for the kubectl AI plugin components.

## Overview

The styling system follows Kui's design patterns and integrates with PatternFly components. All styles support both light and dark themes automatically through CSS custom properties.

## Directory Structure

```
web/scss/
└── components/
    └── AI/
        ├── _index.scss           # Main entry point (import this)
        ├── _variables.scss       # Color scheme, spacing, typography
        ├── _mixins.scss          # Reusable styling patterns
        ├── AIChatSidebar.scss    # Chat sidebar interface
        ├── MessageList.scss      # Message bubbles and markdown
        ├── ContextPanel.scss     # Context display panel
        └── AISettings.scss       # Settings form styling
```

## Usage in Components

Import the styles directly in your React component files:

```typescript
// In AIChatSidebar.tsx
import '../../../web/scss/components/AI/AIChatSidebar.scss'

// Or import all AI styles
import '../../../web/scss/components/AI/_index.scss'
```

## Theme Support

All styles automatically adapt to light and dark themes using Kui's theme variables:

```scss
// Light theme
body[kui-theme-style='light'] {
  --kui-ai-bg-primary: var(--color-base00);
  --kui-ai-text-primary: var(--color-text-01);
}

// Dark theme
body[kui-theme-style='dark'] {
  --kui-ai-bg-primary: var(--color-base00);
  --kui-ai-text-primary: var(--color-text-01);
}
```

## Available CSS Classes

### AIChatSidebar

```tsx
<div className="kui--ai-chat-sidebar expanded">
  <div className="sidebar-header">
    <div className="header-title">
      <span className="header-icon">🤖</span>
      AI Assistant
    </div>
    <div className="header-actions">
      <button>⚙️</button>
    </div>
  </div>

  <div className="sidebar-content">
    <div className="messages-container">{/* Messages here */}</div>
  </div>

  <div className="sidebar-footer">
    <div className="input-container">
      <div className="input-wrapper">
        <textarea placeholder="Ask me anything..."></textarea>
        <button className="send-button">Send</button>
      </div>
    </div>
  </div>
</div>
```

### MessageList

```tsx
<div className="kui--ai-message-list">
  <div className="message user">
    <div className="message-avatar">👤</div>
    <div className="message-content">
      <div className="message-bubble">
        <div className="message-markdown">How do I list all pods?</div>
      </div>
    </div>
  </div>

  <div className="message assistant">
    <div className="message-avatar">🤖</div>
    <div className="message-content">
      <div className="message-bubble streaming">
        <div className="message-markdown">
          You can list all pods with: <code>kubectl get pods</code>
        </div>
      </div>
      <div className="message-actions">
        <button>📋 Copy</button>
        <button>♻️ Regenerate</button>
      </div>
    </div>
  </div>

  {/* Typing indicator */}
  <div className="typing-indicator">
    <div className="message-avatar">🤖</div>
    <div className="typing-bubble">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
    </div>
  </div>
</div>
```

### ContextPanel

```tsx
<div className="kui--ai-context-panel">
  <div className="context-panel-header">
    <div className="header-title">
      <span className="icon">📦</span>
      Context
    </div>
  </div>

  <div className="context-panel-content">
    <div className="context-section">
      <div className="collapsible-header">
        <div className="section-title">
          <span className="section-icon">🎯</span>
          Resources
          <span className="section-count">3</span>
        </div>
        <span className="toggle-icon">▶</span>
      </div>
      <div className="collapsible-content expanded">
        <div className="context-items">
          <div className="context-item resource-context-item">
            <div className="resource-header">
              <span className="resource-kind">Pod</span>
              <span className="resource-name">my-app-123</span>
            </div>
            <div className="resource-details">
              <span className="detail-label">Status:</span>
              <span className="detail-value">Running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### AISettings

```tsx
<div className="kui--ai-settings">
  <div className="settings-header">
    <div className="header-title">
      <span className="icon">⚙️</span>
      AI Settings
    </div>
  </div>

  <div className="settings-content">
    <div className="settings-section">
      <div className="section-header">
        <span className="section-icon">🔌</span>
        <span className="section-title">Connection</span>
      </div>

      <div className="section-content">
        <div className="form-group">
          <label className="form-label">
            API Endpoint <span className="required">*</span>
          </label>
          <input type="url" placeholder="https://api.openai.com/v1" />
          <span className="form-description">Enter your AI service endpoint URL</span>
        </div>

        <div className="form-group">
          <label className="form-label">API Key</label>
          <div className="api-key-input">
            <input type="password" />
            <button className="toggle-visibility">👁️</button>
          </div>
        </div>

        <div className="connection-status connected">
          <span className="status-icon">✓</span>
          Connected
        </div>
      </div>
    </div>

    <div className="settings-section">
      <div className="section-header">
        <span className="section-icon">🎛️</span>
        <span className="section-title">Model Selection</span>
      </div>

      <div className="model-selector">
        <div className="model-option selected">
          <input type="radio" name="model" checked />
          <div className="model-info">
            <div className="model-name">GPT-4</div>
            <div className="model-description">Most capable model for complex tasks</div>
            <div className="model-badges">
              <span className="badge">Fast</span>
              <span className="badge">Accurate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div className="settings-footer">
    <span className="footer-info">Changes saved automatically</span>
    <div className="footer-actions">
      <button className="btn-secondary">Reset</button>
      <button className="btn-primary">Save</button>
    </div>
  </div>
</div>
```

## CSS Custom Properties

All AI components use CSS custom properties for theming. You can customize these values:

### Spacing

- `--kui-ai-spacing-xs`: 0.25rem
- `--kui-ai-spacing-sm`: 0.5rem
- `--kui-ai-spacing-md`: 1rem
- `--kui-ai-spacing-lg`: 1.5rem
- `--kui-ai-spacing-xl`: 2rem

### Typography

- `--kui-ai-font-size-sm`: 0.875rem
- `--kui-ai-font-size-base`: 1rem
- `--kui-ai-font-size-lg`: 1.125rem
- `--kui-ai-line-height-tight`: 1.4
- `--kui-ai-line-height-normal`: 1.6

### Colors (adapt to theme)

- `--kui-ai-bg-primary`: Primary background
- `--kui-ai-bg-secondary`: Secondary background
- `--kui-ai-text-primary`: Primary text
- `--kui-ai-text-secondary`: Secondary text
- `--kui-ai-icon-primary`: Primary icon color
- `--kui-ai-border-primary`: Border color

### Message Bubbles

- `--kui-ai-message-user-bg`: User message background
- `--kui-ai-message-assistant-bg`: Assistant message background
- `--kui-ai-message-system-bg`: System message background
- `--kui-ai-message-error-bg`: Error message background

## Mixins

Use these mixins in your custom SCSS:

```scss
@import 'variables';
@import 'mixins';

.my-custom-component {
  @include custom-scrollbar;
  @include panel-card;
  @include smooth-transition(background, color);
}

.my-button {
  @include button-base;
}

.my-code {
  @include code-block;
}
```

### Available Mixins

- `@include custom-scrollbar` - Styled scrollbars
- `@include panel-card` - Card/panel styling
- `@include smooth-transition($props...)` - Smooth transitions
- `@include hover-effect` - Interactive hover effect
- `@include truncate-text` - Single-line truncation
- `@include truncate-multiline($lines)` - Multi-line truncation
- `@include loading-shimmer` - Loading animation
- `@include typing-indicator` - Typing dots animation
- `@include message-bubble($bg, $text)` - Message bubble styling
- `@include code-block` - Code block styling
- `@include inline-code` - Inline code styling
- `@include button-base` - Base button styling
- `@include icon-button` - Icon-only button

## Animations

Built-in animations:

- `fadeIn` - Fade in effect
- `slideInRight` - Slide from right
- `slideOutRight` - Slide to right
- `shimmer` - Loading shimmer
- `typing-bounce` - Typing indicator bounce
- `spin` - Spinner rotation
- `blink` - Cursor blink

## Accessibility

All styles include accessibility features:

- Focus visible indicators
- High contrast mode support
- Reduced motion support
- Proper color contrast ratios
- ARIA-friendly markup

```scss
// Reduced motion
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

// High contrast
@media (prefers-contrast: high) {
  border-width: 2px;
}
```

## Responsive Design

All components are responsive and mobile-friendly:

```scss
@media (max-width: 768px) {
  .kui--ai-chat-sidebar {
    width: 100%;
  }
}
```

## Development Tips

1. **Import order matters**: Always import `_variables.scss` before `_mixins.scss`
2. **Use CSS variables**: Prefer CSS custom properties over hardcoded values
3. **Test both themes**: Always test in light and dark mode
4. **Mobile first**: Design for mobile, enhance for desktop
5. **Accessibility**: Use semantic HTML and ARIA attributes

## Examples

See the component files for complete examples:

- `/src/ui/AIChatSidebar.tsx` - Sidebar implementation
- `/src/ui/MessageList.tsx` - Message list implementation
- `/src/ui/ContextPanel.tsx` - Context panel implementation
- `/src/ui/AISettings.tsx` - Settings implementation

## Resources

- [Kui Design System](../../../plugin-client-common/web/scss/)
- [PatternFly Documentation](https://www.patternfly.org/)
- [Carbon Design System](https://www.carbondesignsystem.com/)
