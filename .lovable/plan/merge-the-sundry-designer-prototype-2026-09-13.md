# Merge the Sundry Designer Prototype

## Goal
Bring the in-house Figma direction into the existing clickable signage console without losing the operational depth already built.

## Changes
- Make the Figma-inspired sign-in screen the prototype entry at `/`, with the supplied Sundry Foods logo, balanced white space, thin controls, password visibility, account recovery affordance, and a clickable sign-in that opens the dashboard.
- Move the existing fleet dashboard to `/dashboard` and update all home/dashboard navigation so the sign-in remains the clear entry point.
- Refine the shared console shell using the designer’s visual cues: compact branding, flatter 1.5px outline icons, tighter navigation, restrained corner radii, thin borders, vivid Sundry orange actions, and lighter neutral surfaces.
- Standardize buttons and filter controls through the shared design components, replacing one-off raw controls where they affect the core screens, media, schedules, announcements, and publishing flows.
- Preserve the current sample data, brand switching, filters, expandable playlists, screen details, publishing actions, and responsive navigation.

## Technical details
- Keep sign-in as a frontend-only prototype interaction; no real accounts, backend, or stored credentials will be introduced.
- Add route-specific metadata for the new sign-in entry and retain unique dashboard metadata at `/dashboard`.
- Use semantic theme tokens for all color changes and existing icon assets with consistent thin strokes.
- Verify sign-in-to-dashboard flow, navigation, one operational workflow, desktop layout, compact layout, and the latest build status.
