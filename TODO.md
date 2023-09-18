All image sources: https://github.com/yiotro/Antiyoy/tree/master/assets/field_elements

## Gameplay:

- [ ] click on tower -> show shields (client side only)
- [ ] killing units in provinces with no money

## World Generation

- [ ] single continent (merge blobs)
- [ ] tree spreading

## Optimization

- [ ] separate canvas for rendering tiles, units, highlight, shading ...

## Player HUD

- [ ] rethink UI interaction with purchase button
- [ ] show player ready icon next to player name
- [ ] prevent rerender from dropping out of name edit mode
- [ ] highlight current player
- [ ] show player provinces and incomes in top right
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
