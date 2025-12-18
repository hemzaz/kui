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

//! Application menu management for Kui

use log::{debug, error, info};
use tauri::{
    menu::{Menu, MenuBuilder, MenuEvent, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder},
    AppHandle, Emitter, Manager, Wry,
};

/// Create and install application menus
pub fn create_menu(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    debug!("Creating application menu");

    let menu = MenuBuilder::new(app)
        .items(&[
            &create_file_menu(app)?,
            &create_edit_menu(app)?,
            &create_view_menu(app)?,
            &create_window_menu(app)?,
            &create_help_menu(app)?,
        ])
        .build()?;

    Ok(menu)
}

/// Create File menu
fn create_file_menu(app: &AppHandle) -> tauri::Result<tauri::menu::Submenu<Wry>> {
    let new_tab = MenuItemBuilder::with_id("new_tab", "New Tab")
        .accelerator("CmdOrCtrl+T")
        .build(app)?;

    let new_window = MenuItemBuilder::with_id("new_window", "New Window")
        .accelerator("CmdOrCtrl+N")
        .build(app)?;

    let close_tab = MenuItemBuilder::with_id("close_tab", "Close Tab")
        .accelerator("CmdOrCtrl+W")
        .build(app)?;

    let quit = PredefinedMenuItem::quit(app, Some("Quit"))?;

    let file_menu = SubmenuBuilder::new(app, "File")
        .items(&[
            &new_tab,
            &new_window,
            &PredefinedMenuItem::separator(app)?,
            &close_tab,
            &PredefinedMenuItem::separator(app)?,
            &quit,
        ])
        .build()?;

    Ok(file_menu)
}

/// Create Edit menu
fn create_edit_menu(app: &AppHandle) -> tauri::Result<tauri::menu::Submenu<Wry>> {
    let undo = PredefinedMenuItem::undo(app, Some("Undo"))?;
    let redo = PredefinedMenuItem::redo(app, Some("Redo"))?;
    let cut = PredefinedMenuItem::cut(app, Some("Cut"))?;
    let copy = PredefinedMenuItem::copy(app, Some("Copy"))?;
    let paste = PredefinedMenuItem::paste(app, Some("Paste"))?;
    let select_all = PredefinedMenuItem::select_all(app, Some("Select All"))?;

    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .items(&[
            &undo,
            &redo,
            &PredefinedMenuItem::separator(app)?,
            &cut,
            &copy,
            &paste,
            &PredefinedMenuItem::separator(app)?,
            &select_all,
        ])
        .build()?;

    Ok(edit_menu)
}

/// Create View menu
fn create_view_menu(app: &AppHandle) -> tauri::Result<tauri::menu::Submenu<Wry>> {
    let toggle_devtools = MenuItemBuilder::with_id("toggle_devtools", "Toggle DevTools")
        .accelerator("F12")
        .build(app)?;

    let reload = MenuItemBuilder::with_id("reload", "Reload")
        .accelerator("CmdOrCtrl+R")
        .build(app)?;

    let zoom_in = MenuItemBuilder::with_id("zoom_in", "Zoom In")
        .accelerator("CmdOrCtrl+Plus")
        .build(app)?;

    let zoom_out = MenuItemBuilder::with_id("zoom_out", "Zoom Out")
        .accelerator("CmdOrCtrl+-")
        .build(app)?;

    let zoom_reset = MenuItemBuilder::with_id("zoom_reset", "Reset Zoom")
        .accelerator("CmdOrCtrl+0")
        .build(app)?;

    let view_menu = SubmenuBuilder::new(app, "View")
        .items(&[
            &toggle_devtools,
            &reload,
            &PredefinedMenuItem::separator(app)?,
            &zoom_in,
            &zoom_out,
            &zoom_reset,
        ])
        .build()?;

    Ok(view_menu)
}

/// Create Window menu
fn create_window_menu(app: &AppHandle) -> tauri::Result<tauri::menu::Submenu<Wry>> {
    let minimize = PredefinedMenuItem::minimize(app, Some("Minimize"))?;
    let maximize = MenuItemBuilder::with_id("maximize", "Zoom")
        .accelerator("CmdOrCtrl+Shift+F")
        .build(app)?;
    let close_window = PredefinedMenuItem::close_window(app, Some("Close Window"))?;

    let window_menu = SubmenuBuilder::new(app, "Window")
        .items(&[
            &minimize,
            &maximize,
            &PredefinedMenuItem::separator(app)?,
            &close_window,
        ])
        .build()?;

    Ok(window_menu)
}

/// Create Help menu
fn create_help_menu(app: &AppHandle) -> tauri::Result<tauri::menu::Submenu<Wry>> {
    let docs = MenuItemBuilder::with_id("docs", "Documentation").build(app)?;
    let about = MenuItemBuilder::with_id("about", "About Kui").build(app)?;

    let help_menu = SubmenuBuilder::new(app, "Help")
        .items(&[&docs, &about])
        .build()?;

    Ok(help_menu)
}

/// Handle menu events
pub fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
    let menu_id = event.id().as_ref();
    debug!("Menu event triggered: {}", menu_id);

    match menu_id {
        "new_tab" => {
            info!("New tab requested");
            // Emit event to frontend to create new tab
            if let Some(window) = app.get_webview_window("main-1") {
                window
                    .emit("menu-new-tab", ())
                    .unwrap_or_else(|e| error!("Failed to emit new-tab event: {}", e));
            }
        }
        "new_window" => {
            info!("New window requested");
            // Emit event to frontend to create new window
            if let Some(window) = app.get_webview_window("main-1") {
                window
                    .emit("menu-new-window", ())
                    .unwrap_or_else(|e| error!("Failed to emit new-window event: {}", e));
            }
        }
        "close_tab" => {
            info!("Close tab requested");
            // Emit event to frontend to close current tab
            if let Some(window) = app.get_webview_window("main-1") {
                window
                    .emit("menu-close-tab", ())
                    .unwrap_or_else(|e| error!("Failed to emit close-tab event: {}", e));
            }
        }
        "toggle_devtools" => {
            info!("Toggle DevTools requested");
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main-1") {
                    if window.is_devtools_open() {
                        window.close_devtools();
                    } else {
                        window.open_devtools();
                    }
                }
            }
        }
        "reload" => {
            info!("Reload requested");
            if let Some(window) = app.get_webview_window("main-1") {
                window
                    .eval("location.reload()")
                    .unwrap_or_else(|e| error!("Failed to reload window: {}", e));
            }
        }
        "zoom_in" => {
            info!("Zoom in requested");
            if let Some(window) = app.get_webview_window("main-1") {
                window
                    .emit("menu-zoom-in", ())
                    .unwrap_or_else(|e| error!("Failed to emit zoom-in event: {}", e));
            }
        }
        "zoom_out" => {
            info!("Zoom out requested");
            if let Some(window) = app.get_webview_window("main-1") {
                window
                    .emit("menu-zoom-out", ())
                    .unwrap_or_else(|e| error!("Failed to emit zoom-out event: {}", e));
            }
        }
        "zoom_reset" => {
            info!("Zoom reset requested");
            if let Some(window) = app.get_webview_window("main-1") {
                window
                    .emit("menu-zoom-reset", ())
                    .unwrap_or_else(|e| error!("Failed to emit zoom-reset event: {}", e));
            }
        }
        "maximize" => {
            info!("Maximize requested");
            if let Some(window) = app.get_webview_window("main-1") {
                if window.is_maximized().unwrap_or(false) {
                    window
                        .unmaximize()
                        .unwrap_or_else(|e| error!("Failed to unmaximize window: {}", e));
                } else {
                    window
                        .maximize()
                        .unwrap_or_else(|e| error!("Failed to maximize window: {}", e));
                }
            }
        }
        "docs" => {
            info!("Documentation requested");
            // Open documentation URL
            if let Err(e) =
                open::that("https://github.com/kubernetes-sigs/kui/tree/master/docs/api")
            {
                error!("Failed to open documentation: {}", e);
            }
        }
        "about" => {
            info!("About requested");
            // Emit event to frontend to show about dialog
            if let Some(window) = app.get_webview_window("main-1") {
                window
                    .emit("menu-about", ())
                    .unwrap_or_else(|e| error!("Failed to emit about event: {}", e));
            }
        }
        _ => {
            debug!("Unhandled menu event: {}", menu_id);
        }
    }
}

/// Initialize menu subsystem
pub fn init() {
    debug!("Menu module initialized");
}
