# JSAxVillage Prototype

Lightweight browser prototype implementing the first-pass Axolotto auto-clicker village loop.

## Run

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

### Windows quick launch

- Double-click `Start-Game.bat` to launch the PowerShell helper.
- The helper script (`Start-Game.ps1`) starts `py -m http.server 8000` and opens your browser automatically.

## Included mechanics

- Clicking Axolotto grants bubbles.
- Food increases click value.
- Toys add auto-clicking over time.
- Up to six Axolotto in village space.
- Axolotto rarity affects slots and base value.
- Store supports food, toys, extra Axolotto, and wood.
- Wood enables purchasing rarity-based houses that buff all Axolotto.
- Fallback shape rendering with optional sprite preference toggle.
