---
name: Mulligan Pass and Play
description: A warm-paper golf scorebook for a shared-phone card game
colors:
  paper: "#f4f1e8"
  ink: "#183c32"
  muted: "#52675e"
  field: "#214f40"
  accent: "#b94e2d"
  line: "#c9cdbf"
  card: "#fffdf7"
typography:
  display:
    fontFamily: "Georgia, Times New Roman, serif"
    fontSize: "clamp(2.5rem, 5vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "16px"
    lineHeight: 1.6
rounded:
  control: "8px"
  card: "14px"
  field: "6px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
---
# Design System: Mulligan
## Overview
A compact golf scorebook: warm paper, deep evergreen ink, restrained orange flags, large readable card yardages. The game itself is the first screen. No promotional landing page.
## Colors
Paper #f4f1e8, ink #183c32, muted #52675e, field #214f40, accent #b94e2d, line #c9cdbf, white #fffdf7. Georgia display headings; system sans body for zero font downloads. 8px spacing unit, 14px card corners, 48px minimum controls. Max shell width 1080px.
## Typography
Georgia carries headings and card yardages; system sans carries controls and rules. The large numerals identify the usable club distance. Scorecard numerals are tabular. Body measure is capped at 70 characters.

## Layout
Mode: Operate. First viewport: game setup, player names and round length alongside a functional yardage-board motif. On phones everything stacks. During play: hole and positions, shot builder, dual-use hand, sticky commit control. The memorable interaction is the privacy cover opening into a hand, then the shared shot reveal.
The main shell is 1144px wide with 32px horizontal padding, reducing to 20px on phones. The setup uses two columns, stacking below 760px. Hands use four card columns on desktop and two on phones. During private planning, the full course board collapses into a distance summary to bring cards closer to the top.

## Elevation & Depth
Most surfaces use tonal separation and thin borders. The selected player-count segment has a small soft shadow; status messages float above the interface. Card selection uses an outline rather than a shadow.

## Shapes
Controls have gently rounded corners, physical card representations use larger corners, and player numbers are circular badges. The tee motif is geometric, with an upright flag and ball.

## Components
Setup, privacy handoff, planning, public reveal, private reaction, shot results, hole scorecard, round finish. Hidden hands are removed from the rendered DOM. Motion only on shared results and respects reduced motion.
### Accessibility and interaction
Native buttons and labelled inputs; no color-only player identities; visible focus; semantic headings; live status for errors and save problems; no timed input.
### Workflow exception
The design launcher could not initialize its cache. User explicitly requested autonomous minimal-input work. Code-first design followed that brief without a selection interview. No reusable workflow preference was assumed.

## Do's and Don'ts
- Do preserve numbered badges as well as player colors.
- Do remove hidden hands from shared screens, preserve keyboard focus, and wrap long names.
- Do keep the shared result animation optional through reduced-motion preferences.
- Don't turn the game screen into a promotional landing page or require external font downloads.

Documentation was reconciled with source inline after the documenter agent hit its usage limit. Visual screenshots were inspected by the primary agent; the independent finish review was source-only.
