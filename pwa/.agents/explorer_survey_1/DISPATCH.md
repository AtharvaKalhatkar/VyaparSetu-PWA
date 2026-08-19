## 2026-08-19T15:34:10Z

You are Explorer 1 for the VyaparSetu PWA Dotted Invoice Template Project.
Your working directory is: /home/aathu/VyaparSetu-PWA/pwa/.agents/explorer_survey_1
The project workspace is: /home/aathu/VyaparSetu-PWA/pwa
The user request is at: /home/aathu/VyaparSetu-PWA/pwa/.agents/ORIGINAL_REQUEST.md

TASK:
1. Read /home/aathu/VyaparSetu-PWA/pwa/.agents/ORIGINAL_REQUEST.md.
2. Map the entire codebase regarding Invoice Templates:
   - Identify all types/enums where invoice templates are defined (e.g. `InvoiceTemplate`, dropdown lists, template galleries, settings, theme options).
   - Identify all existing invoice template components (e.g. Classic, Modern, Minimal, Thermal, etc.) and how they structure headers, line items, tax breakdowns, totals, signatures, payment details, QR codes, etc.
   - Investigate how template selection is handled, stored, and passed into invoice previews and document generators.
   - Analyze how styling is applied (Tailwind, CSS modules, inline styles, CSS classes) and what specific CSS rules/styles are needed for the `DOTTED` template per R1 (dotted/dashed borders `border: 1.5px dashed #000`, `border-top: 1px dotted #666`, high contrast monochrome dot-matrix aesthetic, visual receipt dividers, dashed perimeter frames).
3. Produce a comprehensive report in `/home/aathu/VyaparSetu-PWA/pwa/.agents/explorer_survey_1/handoff.md` with:
   - Observation: Exact file paths, line numbers, data structures, and component architecture.
   - Logic Chain: How DOTTED template should be integrated across the frontend.
   - Files to create/modify.
   - Caveats and edge cases.
4. Send a completion message back to the orchestrator with a summary of findings.
