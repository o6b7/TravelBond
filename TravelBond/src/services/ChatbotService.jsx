import axios from 'axios';

class ChatbotService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    this.client = axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async getTravelResponse(messages) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
        max_tokens: 600
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("API Error:", error);
      return "**Error**: I can't process your request right now. Please try again later.";
    }
  }

  async generateTitle(content) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an assistant that generates short, catchy titles for travel-related chats. Limit to under 10 words."
          },
          {
            role: "user",
            content: content
          }
        ],
        temperature: 0.5,
        max_tokens: 20
      });

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("Error generating title:", error);
      return "Travel conversation";
    }
  }
}

export default new ChatbotService();
