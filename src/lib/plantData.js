// src/lib/plantData.js
//
// Simple local "database" of plants with moisture preferences.
// findPlant(text) does a loose keyword match against plant names/aliases.
// listPlantNames() returns the display names, used when nothing matches.

const PLANTS = [
  {
    name: "Basil",
    aliases: ["basil"],
    minMoisture: 35,
    maxMoisture: 60,
    description:
      "Basil likes consistently moist (but not soggy) soil. I'd keep it between 35% and 60% moisture.",
  },
  {
    name: "Tomato",
    aliases: ["tomato", "tomatoes"],
    minMoisture: 40,
    maxMoisture: 70,
    description:
      "Tomatoes are thirsty and benefit from deep, even watering. I'd target 40% to 70% moisture.",
  },
  {
    name: "Scent leaf",
    aliases: ["scent leaf", "scentleaf", "nchanwu", "african basil", "efirin"],
    minMoisture: 40,
    maxMoisture: 65,
    description:
      "Scent leaf (nchanwu/efirin) prefers steadily damp soil. I'd keep it between 40% and 65% moisture.",
  },
  {
    name: "Pepper",
    aliases: ["pepper", "peppers", "chili", "chilli", "chile"],
    minMoisture: 30,
    maxMoisture: 55,
    description:
      "Peppers prefer slightly drier soil between waterings. I'd set 30% to 55% moisture.",
  },
  {
    name: "Mint",
    aliases: ["mint", "peppermint", "spearmint"],
    minMoisture: 45,
    maxMoisture: 75,
    description:
      "Mint loves consistently damp soil and doesn't mind being on the wetter side. I'd target 45% to 75% moisture.",
  },
  {
    name: "Spinach",
    aliases: ["spinach"],
    minMoisture: 40,
    maxMoisture: 65,
    description:
      "Spinach does best with even moisture and doesn't like drying out. I'd keep it at 40% to 65%.",
  },
  {
    name: "Lettuce",
    aliases: ["lettuce"],
    minMoisture: 40,
    maxMoisture: 65,
    description:
      "Lettuce has shallow roots and needs frequent light moisture. I'd target 40% to 65%.",
  },
  {
    name: "Cucumber",
    aliases: ["cucumber", "cucumbers"],
    minMoisture: 45,
    maxMoisture: 70,
    description:
      "Cucumbers need consistent water to avoid bitterness. I'd set 45% to 70% moisture.",
  },
  {
    name: "Aloe vera",
    aliases: ["aloe", "aloe vera"],
    minMoisture: 10,
    maxMoisture: 30,
    description:
      "Aloe vera is a succulent and prefers to dry out between waterings. I'd keep it low, 10% to 30% moisture.",
  },
  {
    name: "Snake plant",
    aliases: ["snake plant", "sansevieria", "mother-in-law's tongue"],
    minMoisture: 10,
    maxMoisture: 25,
    description:
      "Snake plants are very drought-tolerant. I'd keep moisture low, around 10% to 25%.",
  },
];

/**
 * Finds a plant whose name or alias appears in the given free-text input.
 * Case-insensitive substring match. Returns the plant object or null.
 */
export function findPlant(text) {
  if (!text) return null;
  const normalized = text.toLowerCase();

  for (const plant of PLANTS) {
    for (const alias of plant.aliases) {
      if (normalized.includes(alias.toLowerCase())) {
        return plant;
      }
    }
  }
  return null;
}

/**
 * Returns the list of display names for all known plants.
 */
export function listPlantNames() {
  return PLANTS.map((p) => p.name);
}

export default PLANTS;