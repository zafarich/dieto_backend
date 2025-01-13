import OpenAI from "openai";
import config from "../config/config.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export const calculateDailyNutrients = async (userData) => {
  try {
    const prompt = `
    Quyidagi ma'lumotlar asosida kunlik kaloriya va makronutrientlarni hisoblang:
    - Jinsi: ${userData.gender}
    - Yoshi: ${calculateAge(userData.birthDate)} yosh
    - Bo'yi: ${userData.height} sm
    - Vazni: ${userData.weight} kg
    - Faollik darajasi: ${userData.activityLevel}
    - Maqsad vazni: ${userData.goalWeight} kg

    Faqat quyidagi JSON formatida javob qaytaring. Hech qanday qo'shimcha matn yozmang:
    {
      "dailyCalories": "1800",
      "dailyProteins": "150",
      "dailyFats": "60",
      "dailyCarbs": "200",
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Siz professional dietolog va fitness murabbiysiz. Faqat so'ralgan JSON formatida javob qaytarishingiz kerak. Qo'shimcha matnlar yozmang.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {type: "json_object"},
    });
    console.log("RESPONSE", response.choices[0].message.content);
    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error("OpenAI xatosi:", error);
    throw new Error("Kunlik me'yorlarni hisoblashda xatolik yuz berdi");
  }
};

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};
