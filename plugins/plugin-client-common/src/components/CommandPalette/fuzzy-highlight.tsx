/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react'

/**
 * Match information for highlighting
 */
export interface FuzzyMatch {
  text: string
  isMatch: boolean
}

/**
 * Split text into match and non-match segments for highlighting
 *
 * @param text - Text to highlight
 * @param query - Search query
 * @returns Array of segments with match information
 */
export function getFuzzyMatches(text: string, query: string): FuzzyMatch[] {
  if (!query || !text) {
    return [{ text, isMatch: false }]
  }

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const result: FuzzyMatch[] = []

  let textIndex = 0
  let queryIndex = 0
  let currentSegment = ''
  let isCurrentMatch = false

  while (textIndex < text.length && queryIndex < lowerQuery.length) {
    const char = text[textIndex]
    const lowerChar = lowerText[textIndex]

    if (lowerChar === lowerQuery[queryIndex]) {
      // Match found
      if (isCurrentMatch) {
        // Continue current match segment
        currentSegment += char
      } else {
        // Start new match segment
        if (currentSegment) {
          result.push({ text: currentSegment, isMatch: false })
        }
        currentSegment = char
        isCurrentMatch = true
      }
      queryIndex++
    } else {
      // No match
      if (!isCurrentMatch) {
        // Continue current non-match segment
        currentSegment += char
      } else {
        // Start new non-match segment
        if (currentSegment) {
          result.push({ text: currentSegment, isMatch: true })
        }
        currentSegment = char
        isCurrentMatch = false
      }
    }

    textIndex++
  }

  // Add remaining text as non-match
  if (textIndex < text.length) {
    if (isCurrentMatch) {
      result.push({ text: currentSegment, isMatch: true })
      currentSegment = text.slice(textIndex)
      isCurrentMatch = false
    } else {
      currentSegment += text.slice(textIndex)
    }
  }

  // Push final segment
  if (currentSegment) {
    result.push({ text: currentSegment, isMatch: isCurrentMatch })
  }

  return result
}

/**
 * Highlight component for fuzzy matches
 *
 * Renders text with highlighted characters that match the query.
 * Matched characters are wrapped in <mark> tags with custom styling.
 *
 * @param text - Text to highlight
 * @param query - Search query
 */
export function FuzzyHighlight({ text, query }: { text: string; query: string }) {
  const matches = getFuzzyMatches(text, query)

  return (
    <span className="fuzzy-highlight">
      {matches.map((segment, index) =>
        segment.isMatch ? (
          <mark key={index} className="fuzzy-match">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </span>
  )
}
