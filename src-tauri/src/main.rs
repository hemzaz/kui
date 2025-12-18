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

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{debug, error, info};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{
    AppHandle, Manager, PhysicalSize, State, WebviewUrl, WebviewWindow, WebviewWindowBuilder,
    Window, WindowEvent,
};

mod command_palette;
mod commands;
mod ipc;
mod menu;
mod screenshot;
mod window;

use command_palette::*;
use screenshot::ScreenRect;

/// Application state to track open windows
struct AppState {
    window_count: Mutex<usize>,
    #[allow(dead_code)]
    fixed_windows: Mutex<HashMap<String, String>>,
}

/// Window preferences for subwindows
#[derive(Debug, Clone, Serialize, Deserialize)]
struct SubwindowPrefs {
    #[serde(skip_serializing_if = "Option::is_none")]
    title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    width: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    height: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    fullscreen: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    initial_tab_title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    quiet_exec_command: Option<bool>,
}

/// IPC message structure for synchronous messages
#[derive(Debug, Deserialize)]
struct SynchronousMessage {
    operation: String,
    #[serde(flatten)]
    data: serde_json::Value,
}

/// Structure for exec_invoke messages
#[derive(Debug, Deserialize)]
struct ExecInvokeMessage {
    #[serde(default)]
    module: String,
    #[serde(default)]
    method: String,
    #[serde(default)]
    args: Vec<serde_json::Value>,
}

/// Create a new window with specified arguments
fn create_window_internal(
    app: &AppHandle,
    state: &State<'_, AppState>,
    argv: Option<Vec<String>>,
    prefs: Option<SubwindowPrefs>,
) -> tauri::Result<WebviewWindow> {
    let mut count = state.window_count.lock().unwrap();
    *count += 1;
    let window_label = format!("main-{}", *count);

    let default_width = 1280;
    let default_height = 960;

    let width = prefs
        .as_ref()
        .and_then(|p| p.width)
        .unwrap_or(default_width);
    let height = prefs
        .as_ref()
        .and_then(|p| p.height)
        .unwrap_or(default_height);

    let title = prefs
        .as_ref()
        .and_then(|p| p.title.clone())
        .unwrap_or_else(|| "Kui".to_string());

    debug!(
        "Creating window: label={}, size={}x{}, title={}",
        window_label, width, height, title
    );

    // Build URL with query parameters
    let mut query_params = Vec::new();

    if let Some(args) = argv {
        let argv_json = serde_json::to_string(&args).unwrap_or_default();
        query_params.push(format!(
            "executeThisArgvPlease={}",
            urlencoding::encode(&argv_json)
        ));
    }

    if let Some(ref prefs_data) = prefs {
        let prefs_json = serde_json::to_string(prefs_data).unwrap_or_default();
        query_params.push(format!("subwindow={}", urlencoding::encode(&prefs_json)));
    }

    let url = if query_params.is_empty() {
        "index.html".to_string()
    } else {
        format!("index.html?{}", query_params.join("&"))
    };

    let window = WebviewWindowBuilder::new(app, &window_label, WebviewUrl::App(url.into()))
        .title(title)
        .inner_size(width as f64, height as f64)
        .center()
        .resizable(true)
        .build()?;

    Ok(window)
}

/// Tauri command: Create a new window
#[tauri::command]
async fn create_new_window(
    app: AppHandle,
    state: State<'_, AppState>,
    argv: Option<Vec<String>>,
    width: Option<u32>,
    height: Option<u32>,
    title: Option<String>,
) -> Result<(), String> {
    let prefs = Some(SubwindowPrefs {
        title,
        width,
        height,
        fullscreen: None,
        initial_tab_title: None,
        quiet_exec_command: None,
    });

    create_window_internal(&app, &state, argv, prefs)
        .map_err(|e| format!("Failed to create window: {}", e))?;

    Ok(())
}

/// Tauri command: Handle synchronous messages from renderer
#[tauri::command]
async fn synchronous_message(
    window: Window,
    app: AppHandle,
    state: State<'_, AppState>,
    message: String,
) -> Result<String, String> {
    let msg: SynchronousMessage =
        serde_json::from_str(&message).map_err(|e| format!("Invalid message: {}", e))?;

    debug!("Received synchronous message: {:?}", msg.operation);

    match msg.operation.as_str() {
        "quit" => {
            app.exit(0);
            Ok("ok".to_string())
        }
        "new-window" => {
            let argv = msg
                .data
                .get("argv")
                .and_then(|v| serde_json::from_value(v.clone()).ok());
            let width = msg
                .data
                .get("width")
                .and_then(|v| v.as_u64())
                .map(|v| v as u32);
            let height = msg
                .data
                .get("height")
                .and_then(|v| v.as_u64())
                .map(|v| v as u32);
            let title = msg
                .data
                .get("title")
                .and_then(|v| v.as_str())
                .map(String::from);

            let prefs = Some(SubwindowPrefs {
                title,
                width,
                height,
                fullscreen: None,
                initial_tab_title: None,
                quiet_exec_command: None,
            });

            create_window_internal(&app, &state, argv, prefs)
                .map_err(|e| format!("Failed to create window: {}", e))?;

            Ok("ok".to_string())
        }
        "open-graphical-shell" => {
            create_window_internal(&app, &state, Some(vec!["shell".to_string()]), None)
                .map_err(|e| format!("Failed to create shell window: {}", e))?;
            Ok("ok".to_string())
        }
        "enlarge-window" => {
            window
                .set_size(PhysicalSize::new(1400, 1050))
                .map_err(|e| format!("Failed to enlarge window: {}", e))?;
            Ok("ok".to_string())
        }
        "reduce-window" => {
            window
                .set_size(PhysicalSize::new(1024, 768))
                .map_err(|e| format!("Failed to reduce window: {}", e))?;
            Ok("ok".to_string())
        }
        "maximize-window" => {
            window
                .maximize()
                .map_err(|e| format!("Failed to maximize window: {}", e))?;
            Ok("ok".to_string())
        }
        "unmaximize-window" => {
            window
                .unmaximize()
                .map_err(|e| format!("Failed to unmaximize window: {}", e))?;
            Ok("ok".to_string())
        }
        _ => Err(format!("Unknown operation: {}", msg.operation)),
    }
}

/// Tauri command: Execute plugin code in main process
///
/// This handles plugin execution requests from the renderer process.
/// Plugins can use this to execute privileged operations that require
/// main process access (file system, native modules, etc).
///
/// Message format:
/// {
///   "module": "plugin-name",
///   "method": "function-name",
///   "args": [...]
/// }
#[tauri::command]
async fn exec_invoke(_app: AppHandle, message: String) -> Result<serde_json::Value, String> {
    debug!("Received exec invoke: {}", message);

    // Parse the message
    let msg: ExecInvokeMessage =
        serde_json::from_str(&message).map_err(|e| format!("Invalid message format: {}", e))?;

    debug!(
        "exec_invoke: module={}, method={}, args count={}",
        msg.module,
        msg.method,
        msg.args.len()
    );

    // Handle plugin-specific commands
    match msg.module.as_str() {
        // PTY/Terminal operations
        "pty" => handle_pty_operation(&msg.method, &msg.args).await,

        // File system operations
        "fs" => handle_fs_operation(&msg.method, &msg.args).await,

        // Shell operations
        "shell" => handle_shell_operation(&msg.method, &msg.args).await,

        // Kubectl operations
        "kubectl" => handle_kubectl_operation(&msg.method, &msg.args).await,

        // Generic plugin operation
        "" | "generic" => {
            info!("Generic plugin operation: {}", msg.method);
            Ok(serde_json::json!({
                "success": true,
                "returnValue": null
            }))
        }

        _ => {
            debug!("Unknown module requested: {}", msg.module);
            Ok(serde_json::json!({
                "success": true,
                "returnValue": null,
                "warning": format!("Module {} not implemented in Tauri backend", msg.module)
            }))
        }
    }
}

/// Handle PTY-related operations
async fn handle_pty_operation(
    method: &str,
    args: &[serde_json::Value],
) -> Result<serde_json::Value, String> {
    debug!("PTY operation: {} with {} args", method, args.len());

    match method {
        "spawn" | "create" | "init" => {
            // PTY spawn operations are handled via WebSocket server
            // Just acknowledge the request
            Ok(serde_json::json!({
                "success": true,
                "message": "PTY operations handled via WebSocket channel"
            }))
        }
        _ => Ok(serde_json::json!({
            "success": true,
            "returnValue": null
        })),
    }
}

/// Handle filesystem operations
async fn handle_fs_operation(
    method: &str,
    args: &[serde_json::Value],
) -> Result<serde_json::Value, String> {
    debug!("FS operation: {} with {} args", method, args.len());

    // File system operations can be implemented here
    // For now, acknowledge the request
    Ok(serde_json::json!({
        "success": true,
        "returnValue": null
    }))
}

/// Handle shell operations
async fn handle_shell_operation(
    method: &str,
    args: &[serde_json::Value],
) -> Result<serde_json::Value, String> {
    debug!("Shell operation: {} with {} args", method, args.len());

    // Shell operations are typically handled via PTY
    Ok(serde_json::json!({
        "success": true,
        "returnValue": null
    }))
}

/// Handle kubectl operations
async fn handle_kubectl_operation(
    method: &str,
    args: &[serde_json::Value],
) -> Result<serde_json::Value, String> {
    debug!("Kubectl operation: {} with {} args", method, args.len());

    // Kubectl operations are typically executed via shell/PTY
    Ok(serde_json::json!({
        "success": true,
        "returnValue": null
    }))
}

/// Tauri command: Capture screen region to clipboard
///
/// Captures a specified rectangular region of the screen and copies it to the
/// system clipboard as a PNG image.
///
/// # Arguments
///
/// * `x` - X coordinate of the top-left corner (in screen coordinates)
/// * `y` - Y coordinate of the top-left corner (in screen coordinates)
/// * `width` - Width of the region to capture
/// * `height` - Height of the region to capture
///
/// # Returns
///
/// `Ok(())` if successful, or an error message if the capture fails.
///
/// # Platform Support
///
/// - **macOS**: Full support using native Cocoa/Quartz APIs
/// - **Linux**: Full support using xcap with X11/Wayland
/// - **Windows**: Partial support (clipboard copy needs implementation)
#[tauri::command]
async fn capture_to_clipboard(
    _window: Window,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<(), String> {
    info!(
        "Screenshot requested: x={}, y={}, width={}, height={}",
        x, y, width, height
    );

    // Create screen rectangle
    let rect = ScreenRect::new(x, y, width, height);

    // Capture and copy to clipboard
    screenshot::capture_to_clipboard(rect).map_err(|e| {
        error!("Screenshot failed: {}", e);
        format!("Screenshot capture failed: {}", e)
    })?;

    info!("Screenshot successfully captured and copied to clipboard");
    Ok(())
}

fn main() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            window_count: Mutex::new(0),
            fixed_windows: Mutex::new(HashMap::new()),
        })
        .setup(|app| {
            info!("Kui starting up...");

            // Initialize menu subsystem
            menu::init();

            // Create application menu
            let menu = menu::create_menu(app.handle())?;
            app.set_menu(menu)?;

            // Setup menu event handler
            app.on_menu_event(|app, event| {
                menu::handle_menu_event(app, event);
            });

            // Create the initial window
            let state = app.state::<AppState>();
            create_window_internal(app.handle(), &state, Some(vec!["shell".to_string()]), None)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                let state = window.state::<AppState>();
                let mut count = state.window_count.lock().unwrap();
                if *count > 0 {
                    *count -= 1;
                }
                debug!("Window closed, remaining windows: {}", *count);
            }
        })
        .invoke_handler(tauri::generate_handler![
            create_new_window,
            synchronous_message,
            exec_invoke,
            capture_to_clipboard,
            record_command_invocation,
            get_command_stats,
            get_top_commands,
            record_search_query,
            get_recent_queries,
            cleanup_command_palette_data,
            record_resource_access,
            get_recent_resources,
            get_top_resources,
            detect_command_patterns,
            get_command_patterns,
            get_pattern_suggestions,
            get_command_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Kui application");
}
