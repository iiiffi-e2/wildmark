# Wildmark Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first branded Wildmark loop with durable local state and mock identification.

**Architecture:** Presentation / application / domain / data / platform. Identification engines and occurrence services sit behind interfaces. UI receives `DiscoveryResult` and never decides New Wildmark vs Another Sighting.

**Tech Stack:** Expo 57, Expo Router, TypeScript strict, Jest, expo-sqlite, expo-camera

## Global Constraints

- TypeScript strict, no `any`
- No hardcoded brand colors in screens
- No XP / confetti / “AI analysis complete” copy
- Never claim edibility from an image

### Task 1: Domain discovery transaction

- [x] Tests for New Wildmark, Another Sighting, failed photo keep, unconfirmed save, correction
- [x] Implementation in `src/domain/discovery/record-discovery.ts`

### Task 2: Seed, persistence, design system, core screens

- [x] 35 taxa, collections, quests
- [x] Tokens and branded components
- [x] Discover, Scan, Identify, Wildmark, Collection, Journal, Explore, Settings, Debug
