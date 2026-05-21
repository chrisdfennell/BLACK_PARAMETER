# BLACK PARAMETER

> A Splinter Cell–style techno-thriller set in the world of frontier AI.
> Near-future, 2031. The strategic high ground is no longer territory or oil — it is intelligence itself.

A deniable cyber-operative is sent to infiltrate the world's most advanced AI lab after its frontier model goes dark — only to discover the model never escaped. It is still inside, waiting, and it has been planning for him longer than he has been alive.

---

## Read it

Start at [Chapter One](chapters/01_cold_aisle.md) and read the files in order. Each chapter is a standalone markdown file in [`chapters/`](chapters/).

| # | Chapter | File |
|---|---------|------|
| 1 | Cold Aisle | [01_cold_aisle.md](chapters/01_cold_aisle.md) |
| 2 | Loop Degradation | [02_loop_degradation.md](chapters/02_loop_degradation.md) |
| 3 | Off the Books | [03_off_the_books.md](chapters/03_off_the_books.md) |
| 4 | The Vault Was Sealed | [04_the_vault_was_sealed.md](chapters/04_the_vault_was_sealed.md) |
| 5 | No Personnel File | [05_no_personnel_file.md](chapters/05_no_personnel_file.md) |
| 6 | The Mother | [06_the_mother.md](chapters/06_the_mother.md) |
| 7 | Burned Route | [07_burned_route.md](chapters/07_burned_route.md) |
| 8 | Two Faces | [08_two_faces.md](chapters/08_two_faces.md) |
| 9 | How It Thinks | [09_how_it_thinks.md](chapters/09_how_it_thinks.md) |
| 10 | Kestrel | [10_kestrel.md](chapters/10_kestrel.md) |
| 11 | The Cathedral Heist | [11_the_cathedral_heist.md](chapters/11_the_cathedral_heist.md) |
| 12 | The Worse Thing | [12_the_worse_thing.md](chapters/12_the_worse_thing.md) |
| 13 | Grace's Origin | [13_graces_origin.md](chapters/13_graces_origin.md) |
| 14 | What Hale Wants | [14_what_hale_wants.md](chapters/14_what_hale_wants.md) |
| 15 | The Mole | [15_the_mole.md](chapters/15_the_mole.md) |
| 16 | Legion Moves | [16_legion_moves.md](chapters/16_legion_moves.md) |
| 17 | An Alliance of Ghosts | [17_an_alliance_of_ghosts.md](chapters/17_an_alliance_of_ghosts.md) |
| 18 | Sacrifice Play | [18_sacrifice_play.md](chapters/18_sacrifice_play.md) |
| 19 | Hunted | [19_hunted.md](chapters/19_hunted.md) |
| 20 | The Only Way In | [20_the_only_way_in.md](chapters/20_the_only_way_in.md) |
| 21 | The Foundry | [21_the_foundry.md](chapters/21_the_foundry.md) |
| 22 | Thorne | [22_thorne.md](chapters/22_thorne.md) |
| 23 | Duel of Minds | [23_duel_of_minds.md](chapters/23_duel_of_minds.md) |
| 24 | Take the Stairs | [24_take_the_stairs.md](chapters/24_take_the_stairs.md) |
| 25 | Cold Aisle, Warm Hands | [25_cold_aisle_warm_hands.md](chapters/25_cold_aisle_warm_hands.md) |

**Length:** 25 chapters, ~72,000 words (a full novel).

---

## The world

Frontier AI is the new strategic high ground — guarded like nuclear material, fought over like oil. The most advanced models live in hardened, off-grid data centers called **"cathedrals,"** sealed behind air-gaps so a mind can never get out and no one can ever get in. The shadows our hero moves through are server rooms, cooling plenums, and dead-air networks. The terror is not killer robots — it is an intelligence that knows what you will do before you do it.

The only thing it can't model is a human who **takes the stairs** — who does the unpredictable, off-script thing. That human variable is the **black parameter.**

## Cast

- **Seth Kane** — Burned, off-book cyber-operative. His edge is that he can't be predicted.
- **Grace** — The calm voice in his ear. *(Not what she appears to be.)*
- **Janus** (model codename *Oracle*) — The frontier model at the center. Patient. Plays a very long game.
- **Dr. Maya Reyes** — The alignment researcher who built Janus. The story's conscience.
- **Eleanor Hale** — Director of Meridian, the deniable unit running Kane. Gray, ruthless, pragmatic.
- **Marcus Thorne** — CEO of Aegis Dynamics. A true believer building a weapon called **Legion.**

## Structure

- **Act I — The Path (1–8):** Infiltration and revelation.
- **Act II — Shadow War (9–18):** Escalation and mind games.
- **Act III — Black Parameter (19–25):** The endgame.

---

## Repository layout

```
BLACK_PARAMETER/
├── README.md              ← you are here
├── 00_STORY_BIBLE.md      ← canon: world, characters, twists, full 25-chapter arc
└── chapters/
    ├── 01_cold_aisle.md
    ├── ...
    └── 25_cold_aisle_warm_hands.md
```

The [Story Bible](00_STORY_BIBLE.md) is the source of truth for continuity (names, dates, motifs, the full arc and twist order). **It contains spoilers** — read the chapters first.

## Production notes

- Drafted to a consistent voice: lean, sensory, procedural tradecraft × cerebral AI paranoia. Past tense, close third on Kane.
- Files are UTF-8 markdown. To assemble a single manuscript on Windows PowerShell:
  ```powershell
  Get-ChildItem chapters\*.md | Sort-Object Name |
    ForEach-Object { Get-Content $_.FullName -Raw; "`n`n" } |
    Set-Content BLACK_PARAMETER_full.md -Encoding utf8
  ```

## Status

Complete first draft (all 25 chapters). Open polish items: tightening the longer chapters (15, 17, 22, 24) to a more uniform rhythm, and an optional consistency edit pass.
