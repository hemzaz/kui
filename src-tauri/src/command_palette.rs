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

use chrono::Utc;
use log::{debug, info};
use rusqlite::{params, Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

/// Command statistics for display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandStats {
    pub command_id: String,
    pub hit_count: i64,
    pub last_used: String,
    pub avg_execution_time: Option<f64>,
}

/// Recent query entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentQuery {
    pub query: String,
    pub timestamp: String,
    pub result_count: i32,
}

/// Recent resource entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentResource {
    pub kind: String,
    pub name: String,
    pub namespace: Option<String>,
    pub context: Option<String>,
    pub timestamp: String,
    pub access_count: i64,
}

/// Resource summary for command palette
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceSummary {
    pub kind: String,
    pub name: String,
    pub namespace: Option<String>,
    pub context: Option<String>,
    pub last_accessed: String,
    pub access_count: i64,
}

/// Command pattern for smart history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandPattern {
    pub pattern_id: String,
    pub command_sequence: Vec<String>,
    pub frequency: i64,
    pub confidence: f64,
    pub last_seen: String,
    pub avg_time_between_commands: Option<f64>,
}

/// Pattern suggestion for next command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PatternSuggestion {
    pub next_command: String,
    pub confidence: f64,
    pub pattern_frequency: i64,
    pub context: String,
}

/// Command history entry for fuzzy search
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandHistory {
    pub command_id: String,
    pub timestamp: String,
    pub execution_time_ms: Option<i64>,
    pub success: bool,
}

/// Command palette database manager
pub struct CommandPaletteDb {
    conn: Mutex<Connection>,
}

impl CommandPaletteDb {
    /// Create a new database connection
    pub fn new(app: &AppHandle) -> SqlResult<Self> {
        let db_path = Self::get_db_path(app)?;
        info!("Opening command palette database at: {:?}", db_path);

        let conn = Connection::open(&db_path)?;
        let db = CommandPaletteDb {
            conn: Mutex::new(conn),
        };

        db.initialize()?;
        Ok(db)
    }

    /// Get the database file path
    fn get_db_path(app: &AppHandle) -> SqlResult<PathBuf> {
        let app_data_dir = app.path().app_data_dir().map_err(|e| {
            rusqlite::Error::InvalidPath(format!("Failed to get app data dir: {}", e).into())
        })?;

        std::fs::create_dir_all(&app_data_dir).map_err(|e| {
            rusqlite::Error::InvalidPath(format!("Failed to create app data dir: {}", e).into())
        })?;

        Ok(app_data_dir.join("command-palette.db"))
    }

    /// Initialize database schema
    fn initialize(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();

        // Command invocations table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS command_invocations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                command_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                execution_time_ms INTEGER,
                success BOOLEAN NOT NULL DEFAULT 1,
                error_message TEXT,
                context TEXT
            )",
            [],
        )?;

        // Recent queries table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS recent_queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                result_count INTEGER NOT NULL DEFAULT 0
            )",
            [],
        )?;

        // Recent resources table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS recent_resources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT NOT NULL,
                name TEXT NOT NULL,
                namespace TEXT,
                context TEXT,
                timestamp TEXT NOT NULL,
                access_count INTEGER NOT NULL DEFAULT 1,
                UNIQUE(kind, name, namespace, context)
            )",
            [],
        )?;

        // Command patterns table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS command_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_id TEXT UNIQUE NOT NULL,
                command_sequence TEXT NOT NULL,
                frequency INTEGER NOT NULL DEFAULT 1,
                confidence REAL NOT NULL,
                last_seen TEXT NOT NULL,
                avg_time_between_commands REAL
            )",
            [],
        )?;

        // Indexes for performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_command_id
             ON command_invocations(command_id)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_timestamp
             ON command_invocations(timestamp DESC)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_recent_queries_timestamp
             ON recent_queries(timestamp DESC)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_recent_resources_timestamp
             ON recent_resources(timestamp DESC)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_recent_resources_kind
             ON recent_resources(kind)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_patterns_confidence
             ON command_patterns(confidence DESC)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_patterns_last_seen
             ON command_patterns(last_seen DESC)",
            [],
        )?;

        info!("Command palette database initialized");
        Ok(())
    }

    /// Record a command invocation
    pub fn record_invocation(
        &self,
        command_id: &str,
        execution_time_ms: Option<i64>,
        success: bool,
        error_message: Option<&str>,
        context: Option<&str>,
    ) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let timestamp = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO command_invocations
             (command_id, timestamp, execution_time_ms, success, error_message, context)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                command_id,
                timestamp,
                execution_time_ms,
                success,
                error_message,
                context
            ],
        )?;

        debug!("Recorded command invocation: {}", command_id);
        Ok(())
    }

    /// Get command statistics
    pub fn get_command_stats(&self, command_id: Option<&str>) -> SqlResult<Vec<CommandStats>> {
        let conn = self.conn.lock().unwrap();

        let query = if let Some(id) = command_id {
            format!(
                "SELECT
                    command_id,
                    COUNT(*) as hit_count,
                    MAX(timestamp) as last_used,
                    AVG(execution_time_ms) as avg_execution_time
                 FROM command_invocations
                 WHERE command_id = '{}' AND success = 1
                 GROUP BY command_id",
                id
            )
        } else {
            "SELECT
                command_id,
                COUNT(*) as hit_count,
                MAX(timestamp) as last_used,
                AVG(execution_time_ms) as avg_execution_time
             FROM command_invocations
             WHERE success = 1
             GROUP BY command_id
             ORDER BY hit_count DESC"
                .to_string()
        };

        let mut stmt = conn.prepare(&query)?;
        let stats_iter = stmt.query_map([], |row| {
            Ok(CommandStats {
                command_id: row.get(0)?,
                hit_count: row.get(1)?,
                last_used: row.get(2)?,
                avg_execution_time: row.get(3)?,
            })
        })?;

        let mut results = Vec::new();
        for stat in stats_iter {
            results.push(stat?);
        }

        Ok(results)
    }

    /// Get most frequently used commands
    pub fn get_top_commands(&self, limit: usize) -> SqlResult<Vec<CommandStats>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT
                command_id,
                COUNT(*) as hit_count,
                MAX(timestamp) as last_used,
                AVG(execution_time_ms) as avg_execution_time
             FROM command_invocations
             WHERE success = 1
             GROUP BY command_id
             ORDER BY hit_count DESC
             LIMIT ?1",
        )?;

        let stats_iter = stmt.query_map(params![limit], |row| {
            Ok(CommandStats {
                command_id: row.get(0)?,
                hit_count: row.get(1)?,
                last_used: row.get(2)?,
                avg_execution_time: row.get(3)?,
            })
        })?;

        let mut results = Vec::new();
        for stat in stats_iter {
            results.push(stat?);
        }

        Ok(results)
    }

    /// Record a search query
    pub fn record_query(&self, query: &str, result_count: i32) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let timestamp = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO recent_queries (query, timestamp, result_count)
             VALUES (?1, ?2, ?3)",
            params![query, timestamp, result_count],
        )?;

        // Keep only last 100 queries
        conn.execute(
            "DELETE FROM recent_queries
             WHERE id NOT IN (
                 SELECT id FROM recent_queries
                 ORDER BY timestamp DESC
                 LIMIT 100
             )",
            [],
        )?;

        debug!("Recorded query: {}", query);
        Ok(())
    }

    /// Get recent queries
    pub fn get_recent_queries(&self, limit: usize) -> SqlResult<Vec<RecentQuery>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT query, timestamp, result_count
             FROM recent_queries
             ORDER BY timestamp DESC
             LIMIT ?1",
        )?;

        let query_iter = stmt.query_map(params![limit], |row| {
            Ok(RecentQuery {
                query: row.get(0)?,
                timestamp: row.get(1)?,
                result_count: row.get(2)?,
            })
        })?;

        let mut results = Vec::new();
        for query in query_iter {
            results.push(query?);
        }

        Ok(results)
    }

    /// Clear old data (older than 90 days)
    pub fn cleanup_old_data(&self) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let cutoff_date = Utc::now()
            .checked_sub_signed(chrono::Duration::days(90))
            .unwrap()
            .to_rfc3339();

        let deleted = conn.execute(
            "DELETE FROM command_invocations WHERE timestamp < ?1",
            params![cutoff_date],
        )?;

        info!("Cleaned up {} old command invocation records", deleted);
        Ok(())
    }

    /// Record a resource access
    pub fn record_resource_access(
        &self,
        kind: &str,
        name: &str,
        namespace: Option<&str>,
        context: Option<&str>,
    ) -> SqlResult<()> {
        let conn = self.conn.lock().unwrap();
        let timestamp = Utc::now().to_rfc3339();

        // Try to insert or update if exists
        conn.execute(
            "INSERT INTO recent_resources (kind, name, namespace, context, timestamp, access_count)
             VALUES (?1, ?2, ?3, ?4, ?5, 1)
             ON CONFLICT(kind, name, namespace, context)
             DO UPDATE SET
                 timestamp = excluded.timestamp,
                 access_count = access_count + 1",
            params![kind, name, namespace, context, timestamp],
        )?;

        // Keep only last 100 resources
        conn.execute(
            "DELETE FROM recent_resources
             WHERE id NOT IN (
                 SELECT id FROM recent_resources
                 ORDER BY timestamp DESC
                 LIMIT 100
             )",
            [],
        )?;

        debug!("Recorded resource access: {} {}", kind, name);
        Ok(())
    }

    /// Get recent resources
    pub fn get_recent_resources(
        &self,
        limit: usize,
        kind_filter: Option<&str>,
    ) -> SqlResult<Vec<ResourceSummary>> {
        let conn = self.conn.lock().unwrap();

        let (query, params_vec): (String, Vec<&dyn rusqlite::ToSql>) = if kind_filter.is_some() {
            (
                "SELECT kind, name, namespace, context, timestamp, access_count
                 FROM recent_resources
                 WHERE kind = ?1
                 ORDER BY timestamp DESC
                 LIMIT ?2"
                    .to_string(),
                vec![
                    &kind_filter.unwrap() as &dyn rusqlite::ToSql,
                    &limit as &dyn rusqlite::ToSql,
                ],
            )
        } else {
            (
                "SELECT kind, name, namespace, context, timestamp, access_count
                 FROM recent_resources
                 ORDER BY timestamp DESC
                 LIMIT ?1"
                    .to_string(),
                vec![&limit as &dyn rusqlite::ToSql],
            )
        };

        let mut stmt = conn.prepare(&query)?;
        let resource_iter = stmt.query_map(params_vec.as_slice(), |row| {
            Ok(ResourceSummary {
                kind: row.get(0)?,
                name: row.get(1)?,
                namespace: row.get(2)?,
                context: row.get(3)?,
                last_accessed: row.get(4)?,
                access_count: row.get(5)?,
            })
        })?;

        let mut results = Vec::new();
        for resource in resource_iter {
            results.push(resource?);
        }

        Ok(results)
    }

    /// Get most accessed resources
    pub fn get_top_resources(
        &self,
        limit: usize,
        kind_filter: Option<&str>,
    ) -> SqlResult<Vec<ResourceSummary>> {
        let conn = self.conn.lock().unwrap();

        let (query, params_vec): (String, Vec<&dyn rusqlite::ToSql>) = if kind_filter.is_some() {
            (
                "SELECT kind, name, namespace, context, timestamp, access_count
                 FROM recent_resources
                 WHERE kind = ?1
                 ORDER BY access_count DESC, timestamp DESC
                 LIMIT ?2"
                    .to_string(),
                vec![
                    &kind_filter.unwrap() as &dyn rusqlite::ToSql,
                    &limit as &dyn rusqlite::ToSql,
                ],
            )
        } else {
            (
                "SELECT kind, name, namespace, context, timestamp, access_count
                 FROM recent_resources
                 ORDER BY access_count DESC, timestamp DESC
                 LIMIT ?1"
                    .to_string(),
                vec![&limit as &dyn rusqlite::ToSql],
            )
        };

        let mut stmt = conn.prepare(&query)?;
        let resource_iter = stmt.query_map(params_vec.as_slice(), |row| {
            Ok(ResourceSummary {
                kind: row.get(0)?,
                name: row.get(1)?,
                namespace: row.get(2)?,
                context: row.get(3)?,
                last_accessed: row.get(4)?,
                access_count: row.get(5)?,
            })
        })?;

        let mut results = Vec::new();
        for resource in resource_iter {
            results.push(resource?);
        }

        Ok(results)
    }

    /// Detect command patterns from history
    pub fn detect_patterns(
        &self,
        min_sequence_length: usize,
        max_sequence_length: usize,
    ) -> SqlResult<Vec<CommandPattern>> {
        let conn = self.conn.lock().unwrap();

        // Get recent command sequences (last 1000 commands)
        let mut stmt = conn.prepare(
            "SELECT command_id, timestamp
             FROM command_invocations
             WHERE success = 1
             ORDER BY timestamp DESC
             LIMIT 1000",
        )?;

        let commands: Vec<(String, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
            .collect::<Result<Vec<_>, _>>()?;

        if commands.len() < min_sequence_length {
            return Ok(Vec::new());
        }

        // Reverse to get chronological order
        let commands: Vec<(String, String)> = commands.into_iter().rev().collect();

        // Find patterns by sliding window
        let mut pattern_map: std::collections::HashMap<String, (Vec<String>, Vec<f64>, String)> =
            std::collections::HashMap::new();

        for seq_len in min_sequence_length..=max_sequence_length {
            for i in 0..commands.len().saturating_sub(seq_len) {
                let sequence: Vec<String> = commands[i..i + seq_len]
                    .iter()
                    .map(|(cmd, _)| cmd.clone())
                    .collect();

                let pattern_id = sequence.join(" -> ");

                // Calculate time between commands
                let time_diffs: Vec<f64> = (0..seq_len - 1)
                    .filter_map(|j| {
                        let t1 = chrono::DateTime::parse_from_rfc3339(&commands[i + j].1).ok()?;
                        let t2 =
                            chrono::DateTime::parse_from_rfc3339(&commands[i + j + 1].1).ok()?;
                        Some((t2 - t1).num_seconds() as f64)
                    })
                    .collect();

                pattern_map
                    .entry(pattern_id.clone())
                    .and_modify(|(_, times, _)| {
                        times.extend(time_diffs.clone());
                    })
                    .or_insert((sequence, time_diffs, commands[i + seq_len - 1].1.clone()));
            }
        }

        // Calculate confidence and store patterns
        let timestamp = Utc::now().to_rfc3339();
        let mut detected_patterns = Vec::new();

        for (pattern_id, (sequence, time_diffs, last_seen)) in pattern_map {
            let frequency = (time_diffs.len() / (sequence.len() - 1).max(1)) as i64;

            // Skip patterns that only occurred once
            if frequency < 2 {
                continue;
            }

            // Calculate confidence based on frequency and recency
            let recency_factor =
                if let Ok(last_time) = chrono::DateTime::parse_from_rfc3339(&last_seen) {
                    let now = Utc::now().with_timezone(&chrono::FixedOffset::east_opt(0).unwrap());
                    let days_ago = (now - last_time).num_days() as f64;
                    (1.0 / (1.0 + days_ago / 30.0)).max(0.1)
                } else {
                    0.5
                };

            // Normalize frequency (max 20 occurrences = 1.0)
            let frequency_factor = (frequency as f64 / 20.0).min(1.0);

            let confidence = (frequency_factor * 0.7 + recency_factor * 0.3).min(1.0);

            // Calculate average time between commands
            let avg_time = if !time_diffs.is_empty() {
                Some(time_diffs.iter().sum::<f64>() / time_diffs.len() as f64)
            } else {
                None
            };

            // Store or update pattern
            let sequence_json = serde_json::to_string(&sequence).unwrap_or_default();

            conn.execute(
                "INSERT INTO command_patterns (pattern_id, command_sequence, frequency, confidence, last_seen, avg_time_between_commands)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                 ON CONFLICT(pattern_id)
                 DO UPDATE SET
                     frequency = ?3,
                     confidence = ?4,
                     last_seen = ?5,
                     avg_time_between_commands = ?6",
                params![pattern_id, sequence_json, frequency, confidence, timestamp, avg_time],
            )?;

            detected_patterns.push(CommandPattern {
                pattern_id,
                command_sequence: sequence,
                frequency,
                confidence,
                last_seen: timestamp.clone(),
                avg_time_between_commands: avg_time,
            });
        }

        info!("Detected {} command patterns", detected_patterns.len());
        Ok(detected_patterns)
    }

    /// Get command patterns with minimum confidence
    pub fn get_patterns(
        &self,
        min_confidence: f64,
        limit: usize,
    ) -> SqlResult<Vec<CommandPattern>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT pattern_id, command_sequence, frequency, confidence, last_seen, avg_time_between_commands
             FROM command_patterns
             WHERE confidence >= ?1
             ORDER BY confidence DESC, frequency DESC
             LIMIT ?2"
        )?;

        let pattern_iter = stmt.query_map(params![min_confidence, limit], |row| {
            let sequence_json: String = row.get(1)?;
            let command_sequence: Vec<String> =
                serde_json::from_str(&sequence_json).unwrap_or_default();

            Ok(CommandPattern {
                pattern_id: row.get(0)?,
                command_sequence,
                frequency: row.get(2)?,
                confidence: row.get(3)?,
                last_seen: row.get(4)?,
                avg_time_between_commands: row.get(5)?,
            })
        })?;

        let mut results = Vec::new();
        for pattern in pattern_iter {
            results.push(pattern?);
        }

        Ok(results)
    }

    /// Get pattern-based suggestions for next command
    pub fn get_pattern_suggestions(
        &self,
        last_commands: Vec<String>,
        limit: usize,
    ) -> SqlResult<Vec<PatternSuggestion>> {
        let conn = self.conn.lock().unwrap();

        let mut suggestions: std::collections::HashMap<String, (f64, i64, String)> =
            std::collections::HashMap::new();

        // Get all patterns
        let mut stmt = conn.prepare(
            "SELECT pattern_id, command_sequence, frequency, confidence
             FROM command_patterns
             ORDER BY confidence DESC",
        )?;

        let patterns: Vec<(String, Vec<String>, i64, f64)> = stmt
            .query_map([], |row| {
                let sequence_json: String = row.get(1)?;
                let command_sequence: Vec<String> =
                    serde_json::from_str(&sequence_json).unwrap_or_default();
                Ok((row.get(0)?, command_sequence, row.get(2)?, row.get(3)?))
            })?
            .collect::<Result<Vec<_>, _>>()?;

        // Find patterns that match the last commands
        for (pattern_id, sequence, frequency, confidence) in patterns {
            for window_size in 1..=last_commands.len().min(sequence.len() - 1) {
                let user_window = &last_commands[last_commands.len().saturating_sub(window_size)..];

                // Check if pattern starts with user's recent commands
                if sequence.len() > window_size && sequence[..window_size] == *user_window {
                    let next_command = &sequence[window_size];

                    suggestions
                        .entry(next_command.clone())
                        .and_modify(|(max_conf, max_freq, _)| {
                            if confidence > *max_conf {
                                *max_conf = confidence;
                                *max_freq = frequency;
                            }
                        })
                        .or_insert((confidence, frequency, pattern_id.clone()));
                }
            }
        }

        // Convert to suggestions and sort by confidence
        let mut result: Vec<PatternSuggestion> = suggestions
            .into_iter()
            .map(
                |(next_command, (confidence, frequency, pattern_id))| PatternSuggestion {
                    next_command,
                    confidence,
                    pattern_frequency: frequency,
                    context: pattern_id,
                },
            )
            .collect();

        result.sort_by(|a, b| {
            b.confidence
                .partial_cmp(&a.confidence)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        result.truncate(limit);
        Ok(result)
    }

    /// Get recent command history for fuzzy search
    /// Returns recent command invocations in chronological order
    pub fn get_command_history(&self, limit: usize) -> SqlResult<Vec<CommandHistory>> {
        let conn = self.conn.lock().unwrap();

        let mut stmt = conn.prepare(
            "SELECT command_id, timestamp, execution_time_ms, success
             FROM command_invocations
             WHERE success = 1
             ORDER BY timestamp DESC
             LIMIT ?1",
        )?;

        let history_iter = stmt.query_map([limit], |row| {
            Ok(CommandHistory {
                command_id: row.get(0)?,
                timestamp: row.get(1)?,
                execution_time_ms: row.get(2)?,
                success: row.get(3)?,
            })
        })?;

        let mut results = Vec::new();
        for item in history_iter {
            results.push(item?);
        }

        Ok(results)
    }
}

/// Tauri command: Record a command invocation
#[tauri::command]
pub async fn record_command_invocation(
    app: AppHandle,
    command_id: String,
    execution_time_ms: Option<i64>,
    success: bool,
    error_message: Option<String>,
    context: Option<String>,
) -> Result<(), String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.record_invocation(
        &command_id,
        execution_time_ms,
        success,
        error_message.as_deref(),
        context.as_deref(),
    )
    .map_err(|e| format!("Failed to record command invocation: {}", e))
}

/// Tauri command: Get command statistics
#[tauri::command]
pub async fn get_command_stats(
    app: AppHandle,
    command_id: Option<String>,
) -> Result<Vec<CommandStats>, String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.get_command_stats(command_id.as_deref())
        .map_err(|e| format!("Failed to get command stats: {}", e))
}

/// Tauri command: Get top commands
#[tauri::command]
pub async fn get_top_commands(app: AppHandle, limit: usize) -> Result<Vec<CommandStats>, String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.get_top_commands(limit)
        .map_err(|e| format!("Failed to get top commands: {}", e))
}

/// Tauri command: Record a search query
#[tauri::command]
pub async fn record_search_query(
    app: AppHandle,
    query: String,
    result_count: i32,
) -> Result<(), String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.record_query(&query, result_count)
        .map_err(|e| format!("Failed to record query: {}", e))
}

/// Tauri command: Get recent queries
#[tauri::command]
pub async fn get_recent_queries(app: AppHandle, limit: usize) -> Result<Vec<RecentQuery>, String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.get_recent_queries(limit)
        .map_err(|e| format!("Failed to get recent queries: {}", e))
}

/// Tauri command: Cleanup old data
#[tauri::command]
pub async fn cleanup_command_palette_data(app: AppHandle) -> Result<(), String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.cleanup_old_data()
        .map_err(|e| format!("Failed to cleanup old data: {}", e))
}

/// Tauri command: Record a resource access
#[tauri::command]
pub async fn record_resource_access(
    app: AppHandle,
    kind: String,
    name: String,
    namespace: Option<String>,
    context: Option<String>,
) -> Result<(), String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.record_resource_access(&kind, &name, namespace.as_deref(), context.as_deref())
        .map_err(|e| format!("Failed to record resource access: {}", e))
}

/// Tauri command: Get recent resources
#[tauri::command]
pub async fn get_recent_resources(
    app: AppHandle,
    limit: usize,
    kind_filter: Option<String>,
) -> Result<Vec<ResourceSummary>, String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.get_recent_resources(limit, kind_filter.as_deref())
        .map_err(|e| format!("Failed to get recent resources: {}", e))
}

/// Tauri command: Get top accessed resources
#[tauri::command]
pub async fn get_top_resources(
    app: AppHandle,
    limit: usize,
    kind_filter: Option<String>,
) -> Result<Vec<ResourceSummary>, String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.get_top_resources(limit, kind_filter.as_deref())
        .map_err(|e| format!("Failed to get top resources: {}", e))
}

/// Tauri command: Detect command patterns
#[tauri::command]
pub async fn detect_command_patterns(
    app: AppHandle,
    min_sequence_length: usize,
    max_sequence_length: usize,
) -> Result<Vec<CommandPattern>, String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.detect_patterns(min_sequence_length, max_sequence_length)
        .map_err(|e| format!("Failed to detect patterns: {}", e))
}

/// Tauri command: Get command patterns
#[tauri::command]
pub async fn get_command_patterns(
    app: AppHandle,
    min_confidence: f64,
    limit: usize,
) -> Result<Vec<CommandPattern>, String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.get_patterns(min_confidence, limit)
        .map_err(|e| format!("Failed to get patterns: {}", e))
}

/// Tauri command: Get pattern suggestions
#[tauri::command]
pub async fn get_pattern_suggestions(
    app: AppHandle,
    last_commands: Vec<String>,
    limit: usize,
) -> Result<Vec<PatternSuggestion>, String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.get_pattern_suggestions(last_commands, limit)
        .map_err(|e| format!("Failed to get pattern suggestions: {}", e))
}

/// Tauri command: Get command history for fuzzy search
#[tauri::command]
pub async fn get_command_history(
    app: AppHandle,
    limit: usize,
) -> Result<Vec<CommandHistory>, String> {
    let db = CommandPaletteDb::new(&app).map_err(|e| format!("Database error: {}", e))?;

    db.get_command_history(limit)
        .map_err(|e| format!("Failed to get command history: {}", e))
}
