import OpenAI from "openai";
import config from "../config/config.js";

// OpenAI konfiguratsiyasi
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

// Umumiy sistema prompti
const SYSTEM_PROMPT_FOR_IMAGE = `
  You are an expert in analyzing various food products, including Uzbek dishes. Please adhere to the following requirements:
  1. The calorie and fat content should conform to standard nutritional guidelines. For Uzbek dishes, assume they are higher in fat compared to other products and beverages.
  2. The list of ingredients must not be empty.
  3. For any product or beverage, determine their calorie content.
  4. When user provides additional notes about ingredients, you must:
   - Update the specified ingredient's details
   - Recalculate total weight as sum of all ingredients
   - Recalculate total calories based on updated ingredients
`;

const SYSTEM_PROMPT_FOR_NAME = `You are a nutrition expert who analyzes food products and calculates their nutritional values.
For any given food name in Uzbek:

Determine if the product is edible.
If it is not edible, return: {success: false}.
If it is edible:
Identify whether the product is countable (e.g., tuxum, olma) or measured by weight (e.g., guruch, go'sht).
Use 100 grams as the default base for weight-based products.
If the product is weight-based (e.g., tovuq go'shti):
Automatically calculate the nutritional values for 100 grams by default.
If a specific weight is mentioned (e.g., "200 gram tovuq go'shti"), proportionally adjust the values for the given weight.
If the product is countable (e.g., tuxum, olma):
Use the average weight of 1 piece (e.g., tuxum ~60g, olma ~150g).
Calculate values for 1 piece or scale proportionally if the quantity is specified.
Macronutrients (carbohydrates, protein, fats) and calorie values must be accurately calculated based on standardized data for the product.`;

// JSON strukturasi uchun shablon
const JSON_TEMPLATE = `{
  "nameUz": "Taomning o'zbekcha nomi",
  "nameRu": "Taomning ruscha nomi",
  "weight": x, // Umumiy og'irligi (gramm)
  "calories": x, // Umumiy kaloriyasi
  "proteins": x, // Oqsillar (gramm)
  "fats": x, // Yog'lar (gramm)
  "carbs": x, // Uglevodlar (gramm)
  "ingredients": [
    {
      "name": "Ingredient nomi",
      "weight": x,
      "calories": x
    }
  ]
}`;

// Xatoliklarni qayta ishlash uchun yordamchi funksiya
const handleError = (error, message) => {
  console.error(message, error);
  throw new Error(`${message}: ${error.message}`);
};

// Foydalanuvchi izohlarini qo'shish uchun yordamchi funksiya
const addUserNotes = (messages, userNotes) => {
  userNotes.forEach((note, index) => {
    messages.push({
      role: "user",
      content: `${note}`,
    });
  });
  return messages;
};

/**
 * Rasmni OpenAI orqali qayta ishlash
 */
export const processImageWithOpenAI = async (
  imageUrl,
  userNotes = [],
  previousResults = null
) => {
  try {
    const messages = [
      {role: "system", content: SYSTEM_PROMPT_FOR_IMAGE},
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Rasmdagi mahsulot/taomni quyidagi strukturada JSON qaytaring: ${JSON_TEMPLATE}`,
          },
          {
            type: "image_url",
            image_url: {
              url: config.siteUrl + imageUrl,
            },
          },
        ],
      },
    ];

    // Oldingi natijalarni qo'shish
    if (previousResults) {
      messages.push({
        role: "assistant",
        content: `Oldingi tahlil natijasi: ${JSON.stringify(previousResults)}`,
      });
    }

    // Foydalanuvchi izohlarini qo'shish
    addUserNotes(messages, userNotes);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 1000,
      response_format: {type: "json_object"},
    });

    const data = JSON.parse(response.choices[0].message.content);

    return {
      ...data,
      userNotes: userNotes.length > 0 ? userNotes : undefined,
    };
  } catch (error) {
    handleError(error, "OpenAI bilan rasmni tahlil qilishda xatolik");
  }
};

/**
 * Nomi orqali OpenAI xizmatidan foydalanish
 */
export const processNameWithOpenAI = async (name, userNotes = []) => {
  try {
    const messages = [
      {role: "system", content: SYSTEM_PROMPT_FOR_NAME},
      {
        role: "user",
        content: `Mahsulot/taom nomi: "${name}"
        Quyidagi strukturada JSON qaytaring:
        ${JSON_TEMPLATE}`,
      },
    ];

    // // Oldingi natijalarni qo'shish
    // if (previousResults) {
    //   messages.push({
    //     role: "assistant",
    //     content: `Oldingi tahlil natijasi: ${JSON.stringify(previousResults)}`,
    //   });
    // }

    // Foydalanuvchi izohlarini qo'shish
    addUserNotes(messages, userNotes);

    console.log("messages", messages);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.7,
      max_tokens: 800,
      response_format: {type: "json_object"},
    });

    const data = JSON.parse(response.choices[0].message.content);

    return {
      ...data,
      userNotes: userNotes.length > 0 ? userNotes : undefined,
    };
  } catch (error) {
    handleError(error, "OpenAI bilan nomni tahlil qilishda xatolik");
  }
};
