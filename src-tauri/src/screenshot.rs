// Copyright 2025 The Kubernetes Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

//! macOS screenshot capture functionality
//!
//! This module provides screenshot capture capabilities using native macOS APIs
//! for optimal performance and reliability.

// Allow deprecated cocoa APIs until migration to objc2 is complete
#![allow(deprecated)]
// Allow unexpected cfg conditions from objc macro
#![allow(unexpected_cfgs)]

use image::{ImageBuffer, RgbaImage};
use log::{debug, info};
use std::error::Error;
use std::fmt;

// macOS-specific imports
use cocoa::appkit::{NSPasteboard, NSPasteboardTypePNG};
use cocoa::base::{id, nil};
use cocoa::foundation::NSData;
use objc::{msg_send, sel, sel_impl};

/// Error type for screenshot operations
#[derive(Debug)]
pub enum ScreenshotError {
    /// Screen capture failed
    CaptureFailed(String),
    /// Image processing failed
    ProcessingFailed(String),
    /// Clipboard operation failed
    ClipboardFailed(String),
}

impl fmt::Display for ScreenshotError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::CaptureFailed(msg) => write!(f, "Screen capture failed: {}", msg),
            Self::ProcessingFailed(msg) => write!(f, "Image processing failed: {}", msg),
            Self::ClipboardFailed(msg) => write!(f, "Clipboard operation failed: {}", msg),
        }
    }
}

impl Error for ScreenshotError {}

/// Result type for screenshot operations
pub type ScreenshotResult<T> = Result<T, ScreenshotError>;

/// Rectangle representing a screen region
#[derive(Debug, Clone, Copy)]
pub struct ScreenRect {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

impl ScreenRect {
    /// Create a new screen rectangle
    pub fn new(x: i32, y: i32, width: u32, height: u32) -> Self {
        Self {
            x,
            y,
            width,
            height,
        }
    }
}

/// Capture a screen region to an RGBA image buffer
///
/// This function captures a specific region of the screen and returns it as
/// an RGBA image buffer using native macOS Cocoa/Quartz APIs.
///
/// # Arguments
///
/// * `rect` - The screen rectangle to capture
///
/// # Returns
///
/// An `RgbaImage` containing the captured screen region, or an error if
/// the capture fails.
pub fn capture_screen_region(rect: ScreenRect) -> ScreenshotResult<RgbaImage> {
    debug!(
        "Capturing screen region: x={}, y={}, width={}, height={}",
        rect.x, rect.y, rect.width, rect.height
    );

    capture_macos(rect)
}

/// Capture a screen region and copy it to the system clipboard
///
/// This function captures a specific region of the screen and copies the
/// resulting image directly to the system clipboard as a PNG image.
///
/// # Arguments
///
/// * `rect` - The screen rectangle to capture
///
/// # Returns
///
/// `Ok(())` if successful, or an error if capture or clipboard operation fails.
pub fn capture_to_clipboard(rect: ScreenRect) -> ScreenshotResult<()> {
    info!(
        "Capturing to clipboard: x={}, y={}, width={}, height={}",
        rect.x, rect.y, rect.width, rect.height
    );

    // Capture the screen region
    let image = capture_screen_region(rect)?;

    // Convert image to PNG bytes
    let png_bytes = encode_png(&image)?;

    // Copy to clipboard
    copy_to_clipboard_macos(&png_bytes)?;

    info!("Screenshot successfully copied to clipboard");
    Ok(())
}

/// Encode an RGBA image as PNG bytes
fn encode_png(image: &RgbaImage) -> ScreenshotResult<Vec<u8>> {
    use image::ImageFormat;
    use std::io::Cursor;

    let mut buffer = Cursor::new(Vec::new());
    image
        .write_to(&mut buffer, ImageFormat::Png)
        .map_err(|e| ScreenshotError::ProcessingFailed(format!("PNG encoding failed: {}", e)))?;

    Ok(buffer.into_inner())
}

// ============================================================================
// macOS Implementation
// ============================================================================

/// Capture screen region on macOS using CGImage APIs
fn capture_macos(rect: ScreenRect) -> ScreenshotResult<RgbaImage> {
    // Use Core Graphics to capture the screen region
    let cg_rect = core_graphics::display::CGRect::new(
        &core_graphics::geometry::CGPoint::new(rect.x as f64, rect.y as f64),
        &core_graphics::geometry::CGSize::new(rect.width as f64, rect.height as f64),
    );

    let image = core_graphics::display::CGDisplay::screenshot(
        cg_rect,
        core_graphics::display::kCGWindowListOptionOnScreenOnly,
        core_graphics::display::kCGNullWindowID,
        core_graphics::display::kCGWindowImageDefault,
    )
    .ok_or_else(|| ScreenshotError::CaptureFailed("CGDisplay screenshot failed".to_string()))?;

    // Convert CGImage to RGBA buffer
    let width = image.width() as u32;
    let height = image.height() as u32;
    let bytes_per_row = image.bytes_per_row();
    let data = image.data();
    let data_len = data.len() as usize;

    // CGImage typically uses BGRA format, convert to RGBA
    let mut rgba_buffer: Vec<u8> = Vec::with_capacity((width * height * 4) as usize);

    for y in 0..height {
        for x in 0..width {
            let offset = (y as usize * bytes_per_row) + (x as usize * 4);
            if offset + 3 < data_len {
                let b = data[offset];
                let g = data[offset + 1];
                let r = data[offset + 2];
                let a = data[offset + 3];

                rgba_buffer.push(r);
                rgba_buffer.push(g);
                rgba_buffer.push(b);
                rgba_buffer.push(a);
            }
        }
    }

    ImageBuffer::from_raw(width, height, rgba_buffer).ok_or_else(|| {
        ScreenshotError::ProcessingFailed("Failed to create image buffer".to_string())
    })
}

/// Copy PNG bytes to macOS clipboard
fn copy_to_clipboard_macos(png_bytes: &[u8]) -> ScreenshotResult<()> {
    unsafe {
        let pasteboard: id = NSPasteboard::generalPasteboard(nil);

        // Clear existing contents
        let _: () = msg_send![pasteboard, clearContents];

        // Create NSData from PNG bytes
        let data: id = NSData::dataWithBytes_length_(
            nil,
            png_bytes.as_ptr() as *const std::ffi::c_void,
            png_bytes.len() as u64,
        );

        // Set data with PNG type
        let png_type = NSPasteboardTypePNG;
        let types = cocoa::foundation::NSArray::arrayWithObject(nil, png_type);
        let _: () = msg_send![pasteboard, declareTypes:types owner:nil];

        let success: bool = msg_send![pasteboard, setData:data forType:png_type];

        if success {
            Ok(())
        } else {
            Err(ScreenshotError::ClipboardFailed(
                "Failed to set clipboard data".to_string(),
            ))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_screen_rect_creation() {
        let rect = ScreenRect::new(100, 200, 300, 400);
        assert_eq!(rect.x, 100);
        assert_eq!(rect.y, 200);
        assert_eq!(rect.width, 300);
        assert_eq!(rect.height, 400);
    }

    #[test]
    fn test_encode_png() {
        // Create a small test image
        let img = RgbaImage::new(10, 10);
        let result = encode_png(&img);
        assert!(result.is_ok());

        let png_bytes = result.unwrap();
        assert!(!png_bytes.is_empty());
        // PNG files start with the magic bytes: 137 80 78 71
        assert_eq!(&png_bytes[0..4], &[137, 80, 78, 71]);
    }
}
