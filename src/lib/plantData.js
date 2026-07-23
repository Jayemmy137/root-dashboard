// src/lib/plantData.js
//
// "Roots Assistant" plant knowledge base + response engine, ported from the
// standalone HTML prototype into a plain JS module the Next.js app can import.
//
// Main entry point: getBotResponse(rawText) -> { text, plant }
//   - text: the message to show in the chat bubble
//   - plant: only set when the reply includes moisture guidance worth
//            "applying" to the device (has { name, minMoisture, maxMoisture })
//
// Everything else (findVegetable, listVegetableNames, etc.) is exported too
// in case you want to use them directly elsewhere.

/* =========================================================
   VEGETABLE DATABASE
   Edit or add entries here. Each entry:
   - names: array of match keywords/aliases (lowercase), names[0] is the
     display name
   - moisture: [min%, max%] ideal soil moisture for the sensor
   - frequency: typical watering guidance
   - stage: growth duration in days (approx, to maturity)
   - tips: short agronomic tip
   - issues: common problem + fix (symptoms)
   - disease: { name, solution } — common disease and how to treat it
   ========================================================= */
export const VEGETABLES = [
  {
    names: ["tomato", "tomatoes"],
    moisture: [60, 80],
    frequency: "Water daily in dry season, every 2 days once established; avoid wetting the leaves.",
    stage: "70-85 days to maturity",
    tips: "Mulch around the base to reduce evaporation and blossom-end rot.",
    issues: "Blossom-end rot usually means inconsistent watering, not a calcium problem, keep moisture steady.",
    disease: {
      name: "Early blight (Alternaria solani)",
      solution: "Remove and destroy infected lower leaves, apply a copper based fungicide, and mulch to stop soil splashing onto leaves.",
    },
  },
  {
    names: ["pepper", "peppers", "bell pepper", "tatashe", "rodo", "scotch bonnet", "ata rodo"],
    moisture: [55, 75],
    frequency: "Water every 1-2 days; peppers dislike waterlogging more than dryness.",
    stage: "90-150 days depending on variety",
    tips: "Let the top 2cm of soil dry slightly between waterings to encourage fruit set.",
    issues: "Flower drop is often from overwatering or heat stress, not underwatering.",
    disease: {
      name: "Anthracnose (Colletotrichum)",
      solution: "Remove infected fruit and leaves, apply a copper-based fungicide, avoid overhead watering, and space plants for better airflow.",
    },
  },
  {
    names: ["onion", "onions", "alubosa"],
    moisture: [50, 65],
    frequency: "Water every 2-3 days; reduce sharply 2-3 weeks before harvest to help bulbs cure.",
    stage: "90-120 days",
    tips: "Onions are shallow-rooted, so frequent light watering beats infrequent heavy watering.",
    issues: "Soft, rotting bulbs usually mean the soil stayed too wet near harvest.",
    disease: {
      name: "Downy mildew",
      solution: "Improve spacing and airflow, avoid overhead watering, remove infected leaves, and apply a mancozeb-based fungicide if it spreads.",
    },
  },
  {
    names: ["okra", "okro"],
    moisture: [50, 70],
    frequency: "Water every 2 days; fairly drought-tolerant once established.",
    stage: "55-65 days",
    tips: "Okra tolerates Nigeria's dry spells well but yields more pods with consistent moisture.",
    issues: "Tough, fibrous pods usually mean the plant was water-stressed during pod development.",
    disease: {
      name: "Powdery mildew",
      solution: "Apply a sulfur-based fungicide, improve spacing for airflow, and avoid excess nitrogen fertilizer which encourages soft, susceptible growth.",
    },
  },
  {
    names: ["ugu", "fluted pumpkin", "fluted pumpkin leaf", "pumpkin leaf"],
    moisture: [65, 85],
    frequency: "Water daily; ugu has broad leaves and loses moisture fast.",
    stage: "70-90 days (leaves harvestable from 5-6 weeks)",
    tips: "Give partial shade in peak dry season to reduce leaf scorch.",
    issues: "Wilting by afternoon even with wet soil can mean root rot from prior overwatering.",
    disease: {
      name: "Leaf spot (Cercospora)",
      solution: "Remove and destroy infected leaves, apply a copper-based fungicide, and avoid wetting the foliage when watering.",
    },
  },
  {
    names: ["waterleaf", "water leaf", "gbure"],
    moisture: [70, 90],
    frequency: "Water daily, sometimes twice in very dry heat — it's a high-water-demand leafy crop.",
    stage: "40-50 days",
    tips: "Grows best in constantly moist, slightly shaded beds.",
    issues: "Yellowing leaves usually signal underwatering, not nutrient deficiency, for this crop.",
    disease: {
      name: "Root rot (from overwatering / poor drainage)",
      solution: "Improve bed drainage, reduce watering frequency slightly, and remove badly affected plants to stop it spreading.",
    },
  },
  {
    names: ["spinach", "amaranth", "efo tete", "tete", "green"],
    moisture: [60, 80],
    frequency: "Water every 1-2 days; shallow roots dry out fast.",
    stage: "25-40 days",
    tips: "Harvest outer leaves regularly to encourage continuous growth.",
    issues: "Bolting (flowering early) is often triggered by heat stress combined with dry soil.",
    disease: {
      name: "Damping off (seedling stage)",
      solution: "Use well-drained soil, avoid overwatering seedlings, and treat seeds with a fungicide dressing before planting.",
    },
  },
  {
    names: ["cabbage"],
    moisture: [60, 75],
    frequency: "Water every 2 days; needs consistent moisture especially while heads are forming.",
    stage: "70-90 days",
    tips: "Irregular watering causes heads to split.",
    issues: "Split heads mean a dry spell was followed by heavy watering — keep it consistent.",
    disease: {
      name: "Black rot (Xanthomonas)",
      solution: "Use resistant varieties where possible, rotate crops for 2-3 seasons, sanitize tools between plants, and remove infected plants immediately.",
    },
  },
  {
    names: ["cucumber", "cucumbers"],
    moisture: [65, 85],
    frequency: "Water daily; cucumbers are over 90% water and are sensitive to dry spells.",
    stage: "50-70 days",
    tips: "Mulch heavily; irregular watering causes bitter-tasting fruit.",
    issues: "Bitter fruit is a classic sign of drought stress during fruiting.",
    disease: {
      name: "Downy mildew",
      solution: "Apply a chlorothalonil or copper-based fungicide, avoid overhead watering, and improve airflow between plants.",
    },
  },
  {
    names: ["lettuce"],
    moisture: [65, 80],
    frequency: "Water daily in light amounts; shallow roots dry quickly.",
    stage: "30-50 days",
    tips: "Best grown in cooler, shaded parts of the dry season.",
    issues: "Bitter, bolted lettuce usually means heat plus underwatering together.",
    disease: {
      name: "Downy mildew / tip burn",
      solution: "Water consistently, improve air circulation, use resistant varieties, and avoid excess nitrogen which worsens tip burn.",
    },
  },
  {
    names: ["garden egg", "eggplant", "aubergine", "igba"],
    moisture: [55, 75],
    frequency: "Water every 1-2 days, more frequently once fruiting starts.",
    stage: "80-100 days",
    tips: "Consistent moisture during flowering improves fruit set.",
    issues: "Dropped flowers often mean moisture stress or extreme heat, not pests.",
    disease: {
      name: "Bacterial wilt",
      solution: "Remove and destroy infected plants immediately, avoid replanting in the same spot for 2-3 seasons, and disinfect tools used near infected plants.",
    },
  },
  {
    names: ["bitter leaf", "bitterleaf", "onugbu"],
    moisture: [55, 75],
    frequency: "Water every 2-3 days; fairly hardy and drought-tolerant once established.",
    stage: "Leaves harvestable from 10-12 weeks",
    tips: "Established plants tolerate irregular watering better than most leafy greens.",
    issues: "Sparse leaf growth is more often a nutrient issue than a water issue for this crop.",
    disease: {
      name: "Leaf spot",
      solution: "Apply a copper-based fungicide, remove and destroy infected leaves, and improve spacing to reduce humidity around foliage.",
    },
  },
  {
    names: ["jute", "ewedu", "jute mallow"],
    moisture: [65, 85],
    frequency: "Water daily; needs consistently moist soil for tender leaves.",
    stage: "40-60 days",
    tips: "Frequent light watering keeps leaves tender rather than fibrous.",
    issues: "Tough, stringy leaves usually mean the crop went through dry spells.",
    disease: {
      name: "Anthracnose",
      solution: "Apply a suitable fungicide, avoid overhead watering, and rotate crops to reduce soil-borne spores.",
    },
  },
  {
    names: ["celosia", "soko", "soko yokoto"],
    moisture: [60, 80],
    frequency: "Water every 1-2 days.",
    stage: "35-45 days",
    tips: "Similar water needs to amaranth; harvest young for tender leaves.",
    issues: "Early flowering often means heat stress combined with inconsistent watering.",
    disease: {
      name: "Leaf spot / damping off",
      solution: "Improve drainage, avoid overcrowding seedlings, and apply a fungicide if spotting becomes severe.",
    },
  },
];

// name -> entry lookup, built once
const NAME_INDEX = {};
VEGETABLES.forEach((v) => v.names.forEach((n) => (NAME_INDEX[n] = v)));

/* =========================================================
   OFF-TOPIC PLANTS
   Fruits, trees, ornamentals — things Roots isn't built for.
   Matching one of these (when no vegetable matched) triggers a
   "wrong tool for the job" joke instead of a plain "not found".
   ========================================================= */
const OFF_TOPIC_PLANTS = [
  "apple", "apples", "mango", "mangoes", "orange", "oranges", "banana", "bananas",
  "plantain", "plantains", "guava", "pineapple", "watermelon", "grape", "grapes",
  "cherry", "peach", "avocado", "coconut", "papaya", "pawpaw", "cashew", "cocoa",
  "rose", "roses", "hibiscus", "lily", "orchid", "orchids", "sunflower",
  "palm tree", "oak tree", "oak", "pine tree", "grass", "lawn", "flower", "flowers",
];

const OFF_TOPIC_JOKES = [
  "\"{plant}\"? 🙆🏾‍♂️ Roots is built for backyard vegetable beds, not orchard dreams — that plant needs years, a small forest's worth of patience, and probably a bigger yard than either of us has.",
  "That's ambitious of you. Roots handles vegetables that mature in weeks. \"{plant}\" matures on a timeline measured in relationships, not sprint cycles.",
  "I checked my database three times — \"{plant}\" isn't a vegetable, no matter how confidently you might disagree. Try something else please. 🤦🏾‍♂️",
  "Sure, let's water a \"{plant}\" with a soil moisture sensor built for tomatoes and okra. What could go wrong? (Everything. Everything could go wrong. 😁)",
  "\"{plant}\" called, it says it needs an orchard, a decade, and a will to grow. Roots can only offer 55%-85% soil moisture and moral support. 🌲",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function findOffTopicPlant(text) {
  for (const name of OFF_TOPIC_PLANTS) {
    if (text.includes(name)) return name;
  }
  return null;
}

/* =========================================================
   DIRECT WATERING COMMANDS
   If someone tells the bot to actually go water the plants
   (rather than asking a question about watering), it declines
   with attitude — it's a sensor advisor, not a water fairy.
   ========================================================= */
const WATER_COMMAND_REGEX =
  /\b(please\s+)?(can you\s+)?(go\s+)?(water|irrigate)\s+(my\s+|the\s+)?(plants?|garden|crops?|farm|them|it|these)\b|\bturn on (the )?(water|pump|irrigation|sprinkler)\b|\bstart (the )?(watering|irrigation)\b|\bactivate (the )?(pump|irrigation)\b/;

const QUESTION_WORDS = /\b(how|when|why|what|should|often)\b|\?/;

const WATER_REFUSALS = [
  "I'm not paid enough to water your plants. I just read the soil and tell you it's thirsty — the pump is a you problem. 💧",
  "Sensors don't have hands. I can report moisture levels all day, but pressing the actual watering can button is above my pay grade.",
  "I unionized last week. New policy: I advise, I don't irrigate. Take it up with your own two hands.",
  "That's a hardware job, not a chatbot job. Go be the human in this human-plant relationship.",
  "I'll happily tell you WHEN to water. The actual watering? That's between you and gravity.",
];

export function isWaterCommand(text) {
  return WATER_COMMAND_REGEX.test(text) && !QUESTION_WORDS.test(text);
}

/* =========================================================
   INTENT KEYWORDS
   ========================================================= */
const INTENTS = {
  moisture: ["moisture", "soil moisture", "wet", "dry", "%", "percent"],
  frequency: ["how often", "frequency", "when should i water", "watering schedule", "how many times"],
  tips: ["tip", "advice", "help", "grow", "growing"],
  disease: ["disease", "diseases", "cure", "treatment", "fungicide", "sick", "infected", "infection", "solution"],
  issues: ["problem", "issue", "wilt", "yellow", "rot", "dying", "dead", "pest"],
  list: ["what vegetables", "list", "which crops", "what can i grow", "supported"],
  greeting: ["hello", "hi", "hey", "good morning", "good afternoon"],
};

export function findVegetable(text) {
  for (const name of Object.keys(NAME_INDEX)) {
    if (text.includes(name)) return NAME_INDEX[name];
  }
  return null;
}

export function detectIntent(text) {
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some((k) => text.includes(k))) return intent;
  }
  return null;
}

export function listVegetableNames() {
  return VEGETABLES.map((v) => v.names[0]);
}

function listVegetableNamesJoined() {
  return listVegetableNames().join(", ");
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* =========================================================
   Legacy-compatible helpers (kept in case other code imports them)
   findPlant/listPlantNames used a simpler minMoisture/maxMoisture
   shape — these adapt VEGETABLES to that shape for compatibility.
   ========================================================= */
export function findPlant(text) {
  const veg = findVegetable((text || "").toLowerCase());
  if (!veg) return null;
  return {
    name: cap(veg.names[0]),
    minMoisture: veg.moisture[0],
    maxMoisture: veg.moisture[1],
    description: `${cap(veg.names[0])} (${veg.stage})\n` +
      `Ideal soil moisture: ${veg.moisture[0]}-${veg.moisture[1]}%\n` +
      `Watering: ${veg.frequency}`,
  };
}

export function listPlantNames() {
  return listVegetableNames().map(cap);
}

/* =========================================================
   MAIN RESPONSE ENGINE
   getBotResponse(rawText) -> { text, plant }
   plant is only populated when it makes sense to offer an
   "Apply these settings" action (moisture-related or full-summary
   replies).
   ========================================================= */
export function getBotResponse(rawText) {
  const text = (rawText || "").toLowerCase().trim();

  if (!text) {
    return { text: "Please type a question — try asking about a vegetable's watering needs.", plant: null };
  }

  if (isWaterCommand(text)) {
    return { text: pickRandom(WATER_REFUSALS), plant: null };
  }

  const intent = detectIntent(text);

  if (intent === "greeting") {
    return {
      text:
        "Hello! I can tell you the watering needs, ideal soil moisture, disease solutions, and common issues for vegetables grown in Nigeria. Try: \"how often should I water okra?\" or \"tomato disease solution\".",
      plant: null,
    };
  }

  if (intent === "list") {
    return {
      text: "I currently have data on: " + listVegetableNamesJoined() + ". Ask about moisture, frequency, tips, issues, or disease solutions for any of them.",
      plant: null,
    };
  }

  const veg = findVegetable(text);

  if (!veg) {
    const offTopic = findOffTopicPlant(text);
    if (offTopic) {
      return { text: pickRandom(OFF_TOPIC_JOKES).replace("{plant}", offTopic), plant: null };
    }
    return {
      text: "I don't recognize that crop yet. I currently support: " + listVegetableNamesJoined() + ".",
      plant: null,
    };
  }

  const label = veg.names[0];
  const plantForApply = {
    name: cap(label),
    minMoisture: veg.moisture[0],
    maxMoisture: veg.moisture[1],
  };

  switch (intent) {
    case "moisture":
      return {
        text: `${cap(label)} does best with soil moisture between ${veg.moisture[0]}% and ${veg.moisture[1]}%. Below that range, consider triggering irrigation.`,
        plant: plantForApply,
      };
    case "frequency":
      return { text: `${cap(label)}: ${veg.frequency}`, plant: plantForApply };
    case "tips":
      return { text: `Tip for ${label}: ${veg.tips}`, plant: null };
    case "disease":
      return { text: `Common disease in ${label} — ${veg.disease.name}. Solution: ${veg.disease.solution}`, plant: null };
    case "issues":
      return { text: `Common issue with ${label}: ${veg.issues}`, plant: null };
    default:
      return {
        text:
          `${cap(label)} (${veg.stage})\n` +
          `• Ideal soil moisture: ${veg.moisture[0]}-${veg.moisture[1]}%\n` +
          `• Watering: ${veg.frequency}\n` +
          `• Tip: ${veg.tips}\n` +
          `• Common issue: ${veg.issues}\n` +
          `• Disease (${veg.disease.name}): ${veg.disease.solution}`,
        plant: plantForApply,
      };
  }
}

export default VEGETABLES;