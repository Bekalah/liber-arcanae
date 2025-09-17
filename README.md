# Cathedral of Circuits Modular Foundation

## Structure
- `index.html`: Main entry point, loads nodes from `/data/nodes.json`.
- `/data/nodes.json`: All "nodes" (cards, labs, lore) as modular JSON objects.
- `/img/`: Art and icons for each node.
- `/labs/`: Each node's interactive lab (HTML mini-apps).
- `/js/loadNodes.js`: Loads nodes and builds the UI.
- `style.css`: Styles the site.

## How to Add Content
- Add a new node to `/data/nodes.json`.
- (Optional) Add art to `/img/`.
- (Optional) Add a lab to `/labs/`.
- All logic is modular - just update JSON, no code changes needed!

## Safety
- Commit often and push to GitHub to avoid data loss.
- Keep everything modular for easy recovery and expansion.
