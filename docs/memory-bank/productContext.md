# Product Context

## The Problem
Voice dictation on the web is fragmented.
-   OS-level dictation often misses context or requires weird shortcuts.
-   Website-specific dictation (like Google Docs) doesn't work on Twitter, Notion, or Slack.
-   Cloud-based extensions (like Otter.ai) require sending your private conversations to a server, introduce latency, and often cost money.

## The Solution: VibeCoding Extension
A "Bring Your Own Model" style extension that runs **locally**.
-   **Universal:** Works on *any* web input.
-   **Private:** Zero data egress.
-   **Fast:** No network round-trips.

## Success Criteria for VibeCoding Session
1.  **It Works:** We can speak and see text appear.
2.  **It's Clean:** Code is modular and understandable.
3.  **It's Safe:** We don't leak memory or crash the browser.

## The "Vibe"
We are building this *fast*, but we aren't hacking. We are "Speed-Running Quality".
We use proven patterns (Offscreen Documents) to avoid debugging weird Chrome bugs for hours.
