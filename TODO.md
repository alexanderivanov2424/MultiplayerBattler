All image sources: https://github.com/yiotro/Antiyoy/tree/master/assets/field_elements

## Gameplay:

- [ ] debug provinces having wrong income, and split provinces getting wrong money
- [ ] click on tower -> show shields (client side only)
- [ ] combining units
- [ ] killing provinces with no money

- [ ] buying units
- [ ] draw province outlines on selection
- [ ] clickable provinces

## World Generation

- [ ] single continent (merge blobs)
- [ ] tree spreading

## Optimization

- [ ] separate canvas for rendering tiles, units, highlight, shading ...

## Player HUD

- [ ] display player name and color in top left
- [ ] display all players in top left (durring start up too)
- [ ] income, money, provinces
- [ ] display province names
- [ ] purchase buttons for units

## House Keeping

- [ ] tiles should have a unit in them
- [ ] tiles should know their coordinate (but not replicate it) (makes neighboring / adjancency cleaner)
- [ ] make provinces id-able across all players (use unique ids for provinces)
- [ ] delete 1 tile provinces and handle correctly in merging
- [ ] use schema types on client side (e.g. not replicating unitName, use polymorphism / check instanceof)
- [ ] hex coord / tilecoord conversions??? Make less ugly
- [ ] pull out rendering functions
- [ ] pull out game logic from schema classes
