# Sundry Foods Brand Refresh

## Goal
Restyle the existing clickable signage console to match the supplied Sundry Foods identity and prototype references, while preserving all current screens and interactions.

## Changes
- Replace the temporary “SS” mark with the supplied Sundry Foods logo in the navigation and create a correctly sized favicon from it.
- Move the console from the current dark frosted palette to the reference direction: white canvas, soft neutral panels, charcoal text, fine gray borders, and Sundry orange for active navigation and primary actions.
- Simplify the decorative treatment to match the clean prototype, removing dark ambient blobs while retaining restrained transitions and clear status colors.
- Improve the compact view with a visible mobile header and horizontal navigation so every prototype page remains reachable on smaller screens.
- Apply the refreshed tokens consistently across dashboard cards, tables, filters, screen details, schedules, media, playlists, announcements, empty states, and error pages.
- Keep the current sample data, page structure, and clickable behavior unchanged.

## Technical details
- Store the uploaded logo through the project asset flow and import its URL in the console shell.
- Produce a padded 64px PNG favicon in `public/` from the supplied logo and update the root icon reference.
- Update semantic color tokens in the global stylesheet so existing route styling inherits the new brand direction.
- Add any focused class changes needed for legibility, mobile navigation, and the light visual system.
- Verify the refreshed dashboard and one secondary page at desktop and compact widths, then confirm the latest build is clean.
