import axios from 'axios';
import ChatbotService from '../services/ChatbotService';

class ChatbotController {
  static conversationContext = null;
  static previousMessages = null;

  static getUserData() {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error retrieving user data:", error);
      return null;
    }
  }

  static async getTravelAdvice(query) {
    if (!query || query.trim().length === 0) {
      return "**Please ask a travel-related question.**";
    }
    
    const userData = this.getUserData();
    const userName = userData?.name ? `, ${userData.name}` : '';
    
    const isContinuation = ChatbotController.previousMessages !== null;
    const isFollowUp = this.isFollowUpQuestion(query);
    
    try {
      let messagesToSend = [];

      // System instructions with personalized greeting if user data exists
      let systemMessage = `You are a professional travel consultant. Follow these rules:
                  1. Maintain conversation context for follow-up questions
                  2. Format responses clearly:
                    - **Bold** for important info
                    - Numbered lists: 1. Point - Explanation
                    - Bullet points for details
                  3. For follow-ups, reference previous topics naturally`;
      
      if (userName) {
        systemMessage += `\n4. Address the user by their name${userName} when appropriate`;
      }

      messagesToSend.push({
        role: "system",
        content: systemMessage
      });

      if (isContinuation) {
        ChatbotController.previousMessages.forEach(msg => {
          messagesToSend.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        });
        ChatbotController.previousMessages = null;
      } else if (isFollowUp && ChatbotController.conversationContext) {
        messagesToSend.push(
          { role: 'user', content: ChatbotController.conversationContext.lastQuestion },
          { role: 'assistant', content: ChatbotController.conversationContext.lastResponse }
        );
      }
      
      messagesToSend.push({ role: 'user', content: query });
      const botResponse = await ChatbotService.getTravelResponse(messagesToSend);
      
      ChatbotController.conversationContext = {
        lastQuestion: query,
        lastResponse: botResponse
      };
      
      return botResponse;
    } catch (error) {
      console.error("Error getting travel advice:", error);
      return "**Error**: I'm having trouble helping right now. Please try again.";
    }
  }

  static async generateConversationTitle(messages) {
    try {
      const firstUserMessage = messages.find(m => m.sender === 'user')?.content || "Travel conversation";

      if (firstUserMessage.length <= 30) {
        return firstUserMessage;
      }

      const title = await ChatbotService.generateTitle(firstUserMessage);
      return title.length > 40 ? title.substring(0, 40) + "..." : title;
    } catch (error) {
      console.error("Error generating title:", error);
      return "Travel conversation";
    }
  }

  static isFollowUpQuestion(query) {
    if (!ChatbotController.conversationContext) return false;

    const followUpKeywords = [
      'more', 'details', 'about', 'that', 'this', 'those',
      'follow up', 'follow-up', 'another', 'other',
      'what else', 'and', 'also', 'too', '?',
      'explain', 'elaborate', 'how about', 'what about'
    ];

    const isShortQuestion = query.split(' ').length < 5;
    const containsFollowUpWord = followUpKeywords.some(word =>
      query.toLowerCase().includes(word)
    );

    return isShortQuestion || containsFollowUpWord;
  }

  static calculateCompatibilityScore = async (viewedUser, currentUser) => {
    try {
      // Prepare the data to send to OpenAI
      const prompt = `
          Calculate a compatibility score (0-100%) between these two users based on their profiles.
          Consider these factors with weights:
          - Common languages (20%)
          - Similar education background (15%)
          - Similar hometown/country (10%)
          - Similar accommodation type (10%)
          - Similar occupation (10%)
          - Common groups (15%)
          - Age proximity (10%)
          - References from mutual connections (10%)

          User 1 (Current User):
          ${JSON.stringify(currentUser, null, 2)}

          User 2 (Viewed User):
          ${JSON.stringify(viewedUser, null, 2)}

          Return ONLY a JSON object with this structure:
          {
          score: number,
          explanation: string
          }
      `;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-3.5-turbo",
          messages: [
          {
              role: "system",
              content: "You are a compatibility calculator. Analyze user profiles and return a compatibility score with explanation."
          },
          {
              role: "user",
              content: prompt
          }
          ],
          temperature: 0.7,
          max_tokens: 200
      }, {
          headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
          }
      });

      const result = response.data.choices[0].message.content;

      const jsonStart = result.indexOf('{');
      const jsonEnd = result.lastIndexOf('}');
      const jsonString = result.slice(jsonStart, jsonEnd + 1);

      try {
        return JSON.parse(jsonString);
      } catch (parseError) {
        console.error("Failed to parse JSON from OpenAI response:", parseError, "Raw content:", result);
        return {
          score: 0,
          explanation: "Could not parse compatibility data"
        };
      }
      } catch (error) {
      console.error("Error calculating compatibility:", error);
      return {
          score: 0,
          explanation: "Could not calculate compatibility"
      };
      }
  };

  static setPreviousMessages(messages) {
    ChatbotController.previousMessages = messages;
  }

  static clearContext() {
    ChatbotController.conversationContext = null;
  }
}

export default ChatbotController;
