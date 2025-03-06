import express from "express";
import {sendMessageToTelegram} from "../services/telegramService.js";

const router = express.Router();

router.post("/contact", async (req, res) => {
  try {
    const {name, phone} = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Ism va telefon raqam kiritilishi shart",
      });
    }

    const sent = await sendMessageToTelegram(name, phone);

    if (!sent) {
      return res.status(500).json({
        success: false,
        message: "Xabar yuborishda xatolik yuz berdi",
      });
    }

    res.status(200).json({
      success: true,
      message: "So'rov muvaffaqiyatli yuborildi",
    });
  } catch (error) {
    console.error("Contact route xatolik:", error);
    res.status(500).json({
      success: false,
      message: "Serverda xatolik yuz berdi",
    });
  }
});

export default router;
