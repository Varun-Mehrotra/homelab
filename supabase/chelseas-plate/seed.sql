-- Curated McDonald's Canada subset for incremental data entry.
-- Source reference: https://www.mcdonalds.com/ca/en-ca/full-menu.html
truncate table item_component_allergens, item_components, ingredient_allergens, menu_item_ingredients, menu_items, ingredients, allergens, restaurants restart identity cascade;

insert into restaurants (id, slug, name, description, cuisine_hint, sort_order) values
  ('mcdonalds-canada', 'mcdonalds-canada', 'McDonald''s Canada', 'A small curated McDonald''s Canada menu used while items are being added incrementally.', 'Burgers and chicken sandwiches', 1);

insert into allergens (id, name) values
  ('egg', 'egg'),
  ('garlic', 'garlic'),
  ('msg', 'msg'),
  ('mustard', 'mustard'),
  ('onion', 'onion'),
  ('sesame-seeds', 'sesame seeds'),
  ('soy', 'soy'),
  ('wheat', 'wheat')
;

insert into menu_items (id, restaurant_id, name, category, description, sort_order) values
  ('hamburger', 'mcdonalds-canada', 'Hamburger', 'Beef', 'The comforting taste of the juicy and delicious 100% Canadian beef burger, topped with tangy pickles, ketchup, mustard and the sweet bite of onion, all on a freshly toasted bun. Just like you remember.', 1),
  ('mcchicken', 'mcdonalds-canada', 'McChicken', 'Chicken', 'Breaded seasoned chicken and crisp lettuce, topped with our Mayo-Style Sauce. Some ingredients are just meant to be together.', 2)
;

insert into item_components (id, menu_item_id, name, ingredient_statement, sort_order) values
  ('hamburger-regular-bun', 'hamburger', 'Regular Bun', 'Enriched wheat flour, Water, Sugars (sugar, corn dextrose, corn maltodextrin), Yeast, Vegetable oil (canola and/or soy), Vegetable proteins (pea, potato, faba bean), Sunflower oil, Corn starch, Salt, May contain and or all of the following in varying proportions: Wheat gluten, Dough conditioners (monoglycerides, datem, ascorbic acid, enzymes), Vinegar.', 1),
  ('hamburger-beef-patty', 'hamburger', 'Beef Patty', '100% pure beef.', 2),
  ('hamburger-ketchup', 'hamburger', 'Ketchup', 'Tomato paste, Sugars (sugar/glucose-fructose), Water, Vinegar, Salt, Natural flavour.', 3),
  ('hamburger-pickle-slices', 'hamburger', 'Pickle Slices', 'Cucumbers, Water, Distilled vinegar, Salt, Calcium chloride, Potassium sorbate (preservative), Aluminum sulphate, Natural flavour (plant source), Polysorbate 80, Extractives of tumeric (colour).', 4),
  ('hamburger-onions-dehydrated', 'hamburger', 'Onions (dehydrated)', '100% onions.', 5),
  ('hamburger-mustard', 'hamburger', 'Mustard', 'Water, Vinegar, Mustard seed, Salt, Turmeric, Natural flavour (plant source), Spice.', 6),
  ('hamburger-grill-seasoning', 'hamburger', 'Grill Seasoning', 'Salt, Spice (pepper), Sunflower oil (used as a processing aid).', 7),
  ('mcchicken-portion', 'mcchicken', 'McChicken Portion', 'Chicken, Wheat flour, Water, Chicken skin, Toasted wheat crumbs with spice extractives, Corn starch, Modified corn starch, Salt, Yellow corn flour, Canola oil, Spices, Baking soda, Sodium aluminum phosphate, Potassium chloride, Flavour (hydrolyzed corn, soy and wheat gluten protein, flavour, disodium inosinate, disodium guanylate), Wheat starch. Cooked in vegetable oil (high oleic low linoleic canola oil and/or canola oil, corn oil, soybean oil, hydrogenated soybean oil, citric acid, dimethylpolysiloxane).', 1),
  ('mcchicken-sesame-seed-bun', 'mcchicken', 'Sesame Seed Bun', 'Enriched wheat flour, Water, Sugars (sugar, corn dextrose, corn maltodextrin), Yeast, Vegetable oil (canola and/or soy), Sesame seeds, Vegetable proteins (pea, potato, fava bean), Sunflower oil, Corn starch, Salt, May contain any or all of the following in varying proportions: Wheat gluten, Guar gum, Dough conditioner (monoglycerides, DATEM, ascorbic acid, enzymes), Tricalcium phosphate, Natural flavour, Corn starch, Soybean oil, Vinegar.', 2),
  ('mcchicken-lettuce', 'mcchicken', 'Lettuce', 'Shredded iceberg lettuce.', 3),
  ('mcchicken-mayonnaise-style-sauce', 'mcchicken', 'Mayonnaise-Style Sauce', 'Soybean oil, Water, Liquid egg yolk, Vinegar, Sugar, Salt, Mustard seeds, Mustard bran, Xanthan gum, Potassium sorbate, Calcium disodium EDTA.', 4)
;

insert into item_component_allergens (item_component_id, allergen_id, relation_type) values
  ('hamburger-regular-bun', 'wheat', 'contains'),
  ('hamburger-regular-bun', 'sesame-seeds', 'may_contain'),
  ('hamburger-mustard', 'mustard', 'contains'),
  ('mcchicken-portion', 'soy', 'contains'),
  ('mcchicken-portion', 'wheat', 'contains'),
  ('mcchicken-sesame-seed-bun', 'sesame-seeds', 'contains'),
  ('mcchicken-sesame-seed-bun', 'wheat', 'contains'),
  ('mcchicken-mayonnaise-style-sauce', 'egg', 'contains'),
  ('mcchicken-mayonnaise-style-sauce', 'mustard', 'contains')
;
