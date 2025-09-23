These tests use pytest with no third-party HTML/JS runtime dependencies.
They validate the HTML and inline module script for:
- Document metadata and accessibility basics
- Canvas element sizing and ARIA labeling
- ES module import path for renderHelix
- Robustness of loadJSON (fetch no-store, error-null semantics)
- Palette defaults, fallback logic, and status messaging
- Presence of numerology constants and renderHelix invocation shape

Testing library/framework: pytest