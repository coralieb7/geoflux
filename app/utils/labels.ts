// utils/labels.ts — human-friendly display names and descriptions for categories/commodities

// ── Category descriptions ─────────────────────────────────────────────────

export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Aircraft':                  'Civil and military aircraft, helicopters, spacecraft, drones, and all aviation components and parts.',
  'Aluminium':                 'Primary and secondary aluminium, alloys, foil, powder, and manufactured aluminium goods.',
  'Animal Feed':               'Prepared feeds for livestock, poultry, and pets, including fodder, meal, and compound feeds.',
  'Apparel (Knit)':            'Knitted and crocheted clothing — sweaters, jerseys, T-shirts, underwear, and accessories.',
  'Apparel (Woven)':           'Woven fabric garments — suits, shirts, trousers, dresses, and outer clothing.',
  'Arms & Ammunition':         'Firearms, weapons systems, military ordnance, and all types of ammunition.',
  'Art & Collectibles':        'Works of art, antiques, stamps, coins, and other rare or collectible items.',
  'Basketwork':                'Wicker, rattan, bamboo, and other plaited or basketwork goods.',
  'Beverages & Spirits':       'Alcoholic beverages (wine, beer, spirits), mineral water, juices, and soft drinks.',
  'Books & Printed Matter':    'Books, newspapers, magazines, maps, and other printed publications.',
  'Carpets':                   'Floor coverings — rugs, mats, carpets (woven, tufted, needleloom, or knotted).',
  'Cereals':                   'Grains for food and industry: wheat, rice, maize, barley, oats, sorghum, and rye.',
  'Cereal Preparations':       'Processed cereal products — pasta, flour, malt, starch, bread, and breakfast cereals.',
  'Ceramics':                  'Porcelain, stoneware, earthenware, tiles, sanitary fixtures, and other fired clay products.',
  'Clocks & Watches':          'Watches, clocks, timers, and precision timing instruments and components.',
  'Coated Textiles':           'Fabrics coated or impregnated with rubber, plastic, or other materials for technical use.',
  'Cocoa & Chocolate':         'Cocoa beans, cocoa paste, butter and powder, and all chocolate and confectionery products.',
  'Coffee, Tea & Spices':      'Coffee, tea, mate, pepper, cinnamon, cloves, and other spices and aromatic plants.',
  'Cork':                      'Raw and processed cork, stoppers, tiles, and manufactured cork articles.',
  'Cotton':                    'Raw cotton fibre, cotton yarn, woven cotton fabrics, and cotton waste.',
  'Cosmetics & Perfumes':      'Perfumes, skincare, makeup, haircare, shampoos, and personal hygiene products.',
  'Dairy, Eggs & Honey':       'Milk and cream, cheese, butter, yogurt, eggs, and natural honey.',
  'Dyes & Pigments':           'Synthetic organic dyes, inorganic pigments, and preparations for colouring.',
  'Electrical Equipment':      'Electronic components, consumer electronics, telecommunications devices, and power equipment.',
  'Explosives':                'Pyrotechnics, fireworks, signal flares, propellant powders, and explosives.',
  'Fats & Oils':               'Vegetable and animal fats and oils — soybean, palm, olive, sunflower, and animal lard.',
  'Feathers & Artificial Flowers': 'Down, feathers, quilts, artificial flowers, and imitation foliage.',
  'Fertilizers':               'Chemical and mineral fertilizers — nitrogen, phosphate, potassium-based, and mixtures.',
  'Fish & Seafood':            'Fresh, frozen, smoked, dried fish, crustaceans, molluscs, and other seafood.',
  'Footwear':                  'Shoes, boots, sandals, athletic footwear, and waterproof boots.',
  'Fruits & Nuts':             'Fresh and dried tropical fruits, citrus, apples, grapes, berries, and edible nuts.',
  'Furskins':                  'Raw and dressed animal fur pelts, fur clothing, and furskin articles.',
  'Furniture':                 'Home and office furniture, mattresses, lamps, prefabricated buildings, and fixtures.',
  'Glass & Glassware':         'Flat glass, glass containers, glassware, optical glass, glass fibres, and mirrors.',
  'Headgear':                  'Hats, caps, helmets, safety headgear, and related accessories.',
  'Hides & Leather':           'Raw hides, tanned leather, chamois leather, and leather without the hair.',
  'Industrial Machinery':      'Engines, turbines, pumps, compressors, industrial equipment, and general-purpose machinery.',
  'Inorganic Chemicals':       'Industrial inorganic chemicals — acids, alkalis, salts, oxides, and mineral compounds.',
  'Iron & Steel':              'Pig iron, ferroalloys, semi-finished steel, and primary iron and steel products.',
  'Iron & Steel Articles':     'Manufactured iron and steel goods — structures, wire, pipes, screws, and hardware.',
  'Knitted Fabrics':           'Knitted and crocheted fabrics, pile fabrics, and elastomeric materials.',
  'Lead':                      'Unwrought lead, lead alloys, plates, sheets, and lead-based manufactured articles.',
  'Leather Articles':          'Saddlery, travel goods, handbags, wallets, belts, and other leather accessories.',
  'Live Animals':              'Cattle, horses, sheep, pigs, poultry, and other live animals for trade or breeding.',
  'Live Plants & Flowers':     'Cut flowers, bulbs, live trees, shrubs, vegetable and fruit cuttings, and nursery stock.',
  'Manmade Filaments':         'Synthetic filament yarn and fabrics — polyester, nylon, acrylic, and viscose.',
  'Manmade Staple Fibres':     'Discontinuous synthetic or artificial fibres — polyester, acrylic, viscose staple.',
  'Meat':                      'Fresh, chilled, or frozen meat from bovines, pigs, sheep, poultry, and other animals.',
  'Meat & Fish Preparations':  'Processed and preserved meat and fish — sausages, canned goods, fish paste, and extracts.',
  'Metal Tools':               'Hand tools, saws, files, cutting tools, interchangeable tool bits, and tool sets.',
  'Milling Products':          'Flour, meal, groats, pellets, and other products of the milling of grain or legumes.',
  'Mineral Fuels & Oils':      'Crude petroleum, natural gas, coal, refined fuels, lubricants, and petrochemical feedstocks.',
  'Miscellaneous Chemicals':   'Specialty chemical preparations — surface-active agents, lubricants, adhesives, and inks.',
  'Miscellaneous Food':        'Miscellaneous edible preparations — sauces, soups, food supplements, and flavourings.',
  'Miscellaneous Manufactured':'Manufactured goods not elsewhere classified — brushes, brooms, umbrellas, and novelties.',
  'Miscellaneous Metal Articles': 'Fabricated metal products — containers, anchors, springs, chains, and metal fittings.',
  'Musical Instruments':       'Pianos, string, wind, and percussion instruments, electronic music equipment.',
  'Nickel':                    'Unwrought nickel, nickel alloys, nickel powder, and manufactured nickel articles.',
  'Oilseeds':                  'Soybeans, rapeseed, sunflower seed, linseed, and other oil-bearing seeds.',
  'Optical & Medical Equipment': 'Medical devices, optical instruments, surveying and measuring equipment, and spectacles.',
  'Organic Chemicals':         'Organic chemical compounds — hydrocarbons, alcohols, acids, esters, and intermediates.',
  'Other Animal Products':     'Animal by-products not elsewhere classified — gut, bladder, animal wax, and marine products.',
  'Other Base Metals':         'Tungsten, molybdenum, tantalum, cobalt, bismuth, and other minor base metals.',
  'Other Textiles':            'Made-up textile articles — bedding, curtains, bags, tarpaulins, ropes, and netting.',
  'Paper & Paperboard':        'Paper and paperboard in rolls or sheets, coated paper, tissue, and packaging materials.',
  'Pharmaceuticals':           'Medicinal products, vaccines, antibiotics, hormones, vitamins, and diagnostic kits.',
  'Photographic Goods':        'Photographic and cinematographic film, cameras, plates, and darkroom chemicals.',
  'Plant Extracts':            'Essential oils, oleoresins, gums, resins, balsams, and vegetable saps and extracts.',
  'Plastics':                  'Polymer resins and plastics in primary forms, plus semi-finished and finished plastic articles.',
  'Precious Stones & Metals':  'Gold, silver, platinum, diamonds, rubies, emeralds, and other gemstones and jewellery.',
  'Railway Equipment':         'Locomotives, railcars, trams, metro cars, railway track fixtures, and signalling equipment.',
  'Rubber':                    'Natural and synthetic rubber, reclaimed rubber, and manufactured rubber goods.',
  'Salt, Stone & Cement':      'Portland cement, lime, plaster, natural stone, slate, gypsum, and other mineral building materials.',
  'Ships & Boats':             'Ocean-going vessels, tankers, cargo ships, fishing boats, yachts, and floating structures.',
  'Silk':                      'Silkworm cocoons, raw silk, silk yarn, and woven silk fabrics.',
  'Soaps & Waxes':             'Soap, detergents, washing preparations, waxes, polishes, and cleaning products.',
  'Special Woven Fabrics':     'Technical textiles, lace, embroidery, velvet, narrow woven fabrics, and trimmings.',
  'Stone & Plaster Articles':  'Articles of stone, plaster, asbestos, mica, and other mineral materials.',
  'Sugar':                     'Cane and beet sugar, raw and refined, molasses, and sugar confectionery.',
  'Tin':                       'Unwrought tin, tin alloys, tin plates, sheets, and manufactured tin products.',
  'Tobacco':                   'Unmanufactured tobacco leaf, cigarettes, cigars, pipe tobacco, and tobacco substitutes.',
  'Toys & Sports':             'Toys, board games, video game consoles, bicycles, sports equipment, and playground gear.',
  'Vegetables':                'Fresh, chilled, dried, or frozen vegetables, root crops, legumes, and edible fungi.',
  'Vegetable Materials':       'Plant materials for plaiting — bamboo, rattan, willow, rush, and similar vegetable fibres.',
  'Vegetable Preparations':    'Prepared or preserved vegetables — tomato pastes, pickles, freeze-dried, and canned vegetables.',
  'Vegetable Textile Fibres':  'Flax, hemp, jute, sisal, agave, and other plant-based fibres for textile and rope production.',
  'Vehicles':                  'Passenger cars, trucks, buses, motorcycles, bicycles, tractors, and motor vehicle parts.',
  'Wadding & Felt':            'Wadding, felt, non-woven fabrics, coated fabrics, and technical textile reinforcements.',
  'Wood':                      'Logs, sawn timber, veneer sheets, plywood, fibreboard, and structural wood products.',
  'Wood Pulp':                 'Chemical and mechanical wood pulp, de-inked paper, and fibrous cellulosic materials.',
  'Wool & Animal Hair':        'Raw wool, scoured and combed wool, fine or coarse animal hair, and wool yarn.',
  'Zinc':                      'Unwrought zinc, zinc alloys, zinc dust, and manufactured zinc articles.',
}

export function getCategoryDescription(name: string): string | undefined {
  return CATEGORY_DESCRIPTIONS[name]
}

// ── Commodity name prettification ─────────────────────────────────────────

/**
 * Returns a shorter, friendlier display name for a commodity.
 * Strips verbose HS qualifiers while preserving key distinguishing info.
 */
export function prettifyCommodityName(name: string): string {
  let n = name.trim()

  // "nes" (not elsewhere specified) → "(misc.)"
  n = n.replace(/\bnes\b/g, '(misc.)')

  // "and parts thereof" / "parts thereof" / ", parts thereof"
  n = n.replace(/\s*,?\s*and\s+parts\s+thereof\b/gi, '')
  n = n.replace(/\s*,?\s*parts\s+thereof\b/gi, '')

  // Helicopters: "of an unladen weight > X kg" → "(> X kg)"
  n = n.replace(/,?\s*of\s+an?\s+unladen\s+weight\s*([<>≤≥]=?\s*[\d,]+\s*kg)/gi, ' ($1)')

  // "unladen weight > X kg" / "unladen weight X-Y kg"
  n = n.replace(/,?\s*unladen\s+weight\s*([<>≤≥]=?\s*[\d,]+\s*kg)/gi, ' ($1)')
  n = n.replace(/,?\s*unladen\s+weight\s*([\d,]+-[\d,]+\s*kg)/gi, ' ($1)')

  // Engine specs: "spark ignition engine of X-Y cc" / "diesel engine of X cc"
  n = n.replace(/,?\s*(?:spark\s+ignition|diesel)\s+engine\s+of\s*([<>]?\s*[\d,]+(?:-[\d,]+)?\s*cc)/gi, ' ($1)')

  // Truck weight: "weighing X-Y tonnes" / "weighing > X tonnes"
  n = n.replace(/\s+weighing\s+([<>]?\s*[\d,]+(?:-[\d,]+)?\s*tonnes?)/gi, ' ($1)')

  // Motorcycle engine: "spark ignition engine of X-Y cc" already handled above;
  // also "engine of >X cc"
  n = n.replace(/,?\s*engine\s+of\s*([<>≤≥]=?\s*[\d,]+(?:-[\d,]+)?\s*cc)/gi, ' ($1)')

  // Remove trailing comma
  n = n.replace(/\s*,\s*$/, '')

  // Collapse multiple spaces
  n = n.replace(/\s+/g, ' ').trim()

  // Capitalise first letter
  return n.charAt(0).toUpperCase() + n.slice(1)
}
