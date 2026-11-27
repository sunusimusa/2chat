# 2Chat One-to-One Voice Calls

## Required server environment variables

The call client always uses Google's public STUN server as a baseline. For reliable audio connections across restrictive mobile networks and carrier-grade NAT, configure a managed TURN service in the production server environment:

- `TURN_URL`: TURN endpoint URL(s), comma-separated if the provider gives more than one. Example format: `turn:turn.example.com:3478?transport=udp,turns:turn.example.com:5349?transport=tcp`
- `TURN_USERNAME`: TURN username supplied by the provider.
- `TURN_CREDENTIAL`: TURN credential supplied by the provider.

These values are read only by the server and delivered to authenticated Socket.IO clients when they request call ICE configuration. Do not commit real TURN credentials to this repository or put them in browser JavaScript.

If these variables are not configured, the app falls back to STUN only. Calls may work on some networks but cannot be guaranteed on all mobile carriers or Wi-Fi networks.

## Call behavior

- Calls are one-to-one audio calls.
- The callee rings only while the 2Chat app is in the foreground.
- The Android app reports foreground/background transitions to the server.
- A ringing call becomes a missed call if the recipient is unavailable, leaves the foreground, or does not answer within 30 seconds.
- Call history is available at `/call-history.html`.

## Production verification

Before announcing the feature as production-ready, verify:
1. Set the three TURN environment variables using credentials from a managed TURN provider.
2. Restart/redeploy the backend after setting them.
3. Test Android-to-Android calls on different mobile networks.
4. Test Android-to-Wi-Fi and Wi-Fi-to-Wi-Fi calls.
5. Test accept, decline, cancel, no-answer, app backgrounding, app foregrounding, and call history.
6. Confirm microphone permission and two-way audio on physical devices.
