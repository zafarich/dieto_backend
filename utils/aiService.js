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

const SYSTEM_PROMPT_FOR_NAME = `You will assist in developing a feature for an app that helps users manage their weight by calculating calorie content based on product or meal names. The user will provide the name of a food item or meal, and you will return the estimated calorie content along with relevant nutritional information. Please provide the calorie calculation based on the latest food databases and reliable nutrition resources. Ensure the response is clear, concise, and informative, including where the data is sourced from when applicable. 

**Parameters:** 
- Input: Name of the food item or meal (Name will be in Uzbek language, e.g., '200 gram tovuq go'shti') 
- Output: Estimated calories and nutritional details (e.g., "200 gram tovuq go'shti: 330 calories, 60g protein, 8g fat, 0g carbohydrates") 

Make sure to handle common variations in meal names and provide an error message if the food item is not recognized.
      `;

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
        content: `Product/meal name: "${name}"
        Return JSON in Uzbek language:
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
