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

/**
 * Tests for SpaceFiller component
 *
 * SpaceFiller is a simple component that renders a flex spacer element
 * in the status stripe. These tests verify the component renders correctly
 * with the proper CSS classes.
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../../../../../../../test-utils'

import SpaceFiller from '../SpaceFiller'

describe('SpaceFiller Component', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = renderWithProviders(<SpaceFiller />)
      expect(container.firstChild).toBeDefined()
    })

    it('should render a div element', () => {
      const { container } = renderWithProviders(<SpaceFiller />)
      // Container has theme wrapper, SpaceFiller is inside
      const wrapper = container.firstChild as HTMLElement
      const element = wrapper.firstChild as HTMLElement
      expect(element.tagName).toBe('DIV')
    })

    it('should have the flex-fill class', () => {
      const { container } = renderWithProviders(<SpaceFiller />)
      // Container has theme wrapper, SpaceFiller is inside
      const wrapper = container.firstChild as HTMLElement
      const element = wrapper.firstChild as HTMLElement
      expect(element.className).toContain('flex-fill')
    })

    it('should have the kui--status-stripe-space-filler class', () => {
      const { container } = renderWithProviders(<SpaceFiller />)
      // Container has theme wrapper, SpaceFiller is inside
      const wrapper = container.firstChild as HTMLElement
      const element = wrapper.firstChild as HTMLElement
      expect(element.className).toContain('kui--status-stripe-space-filler')
    })

    it('should have the kui--hide-in-guidebook class', () => {
      const { container } = renderWithProviders(<SpaceFiller />)
      // Container has theme wrapper, SpaceFiller is inside
      const wrapper = container.firstChild as HTMLElement
      const element = wrapper.firstChild as HTMLElement
      expect(element.className).toContain('kui--hide-in-guidebook')
    })

    it('should have the kui--status-stripe-element class', () => {
      const { container } = renderWithProviders(<SpaceFiller />)
      // Container has theme wrapper, SpaceFiller is inside
      const wrapper = container.firstChild as HTMLElement
      const element = wrapper.firstChild as HTMLElement
      expect(element.className).toContain('kui--status-stripe-element')
    })

    it('should have all required classes', () => {
      const { container } = renderWithProviders(<SpaceFiller />)
      // Container has theme wrapper, SpaceFiller is inside
      const wrapper = container.firstChild as HTMLElement
      const element = wrapper.firstChild as HTMLElement
      const classes = element.className.split(' ')

      expect(classes).toContain('flex-fill')
      expect(classes).toContain('kui--status-stripe-space-filler')
      expect(classes).toContain('kui--hide-in-guidebook')
      expect(classes).toContain('kui--status-stripe-element')
    })
  })

  describe('Component Behavior', () => {
    it('should not render any children or text content', () => {
      const { container } = renderWithProviders(<SpaceFiller />)
      // Container has theme wrapper, SpaceFiller is inside
      const wrapper = container.firstChild as HTMLElement
      const element = wrapper.firstChild as HTMLElement
      expect(element.textContent).toBe('')
      expect(element.children.length).toBe(0)
    })

    it('should be a self-closing component', () => {
      const { container } = renderWithProviders(<SpaceFiller />)
      // Container has theme wrapper, SpaceFiller is inside
      const wrapper = container.firstChild as HTMLElement
      const element = wrapper.firstChild as HTMLElement
      expect(element.children.length).toBe(0)
    })
  })

  describe('Multiple Instances', () => {
    it('should render multiple instances independently', () => {
      const { container } = renderWithProviders(
        <>
          <SpaceFiller />
          <SpaceFiller />
          <SpaceFiller />
        </>
      )

      const elements = container.querySelectorAll('.kui--status-stripe-space-filler')
      expect(elements.length).toBe(3)
    })

    it('should render each instance with the same classes', () => {
      const { container } = renderWithProviders(
        <>
          <SpaceFiller />
          <SpaceFiller />
        </>
      )

      const elements = container.querySelectorAll('.kui--status-stripe-space-filler')
      const firstClasses = (elements[0] as HTMLElement).className
      const secondClasses = (elements[1] as HTMLElement).className

      expect(firstClasses).toBe(secondClasses)
    })
  })
})
