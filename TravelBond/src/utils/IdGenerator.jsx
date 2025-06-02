import { db } from "../utils/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

class IdGenerator {
static prefixes = {
  event: 'E',
  group: 'G',
  reply: 'RE',
  comment: 'C',
  discussion: 'D',
  report: 'REP',
  post: 'P',
  conversation: 'CONV',  
  message: 'MES',
  reference: 'REF',
  user: 'U',
  conv: 'CONV'
};

  /**
   * @param {string} type - The type of entity (e.g., "event", "user")
   * @returns {Promise<string>} - The generated ID
   */
  static async generateId(type) {
    try {
      if (!this.prefixes[type]) {
        throw new Error(`Invalid ID type: ${type}`);
      }

      const idGeneratorRef = doc(db, "IdGenerator", type);
      
      let idGeneratorDoc = await getDoc(idGeneratorRef);
      
      if (!idGeneratorDoc.exists()) {
        await setDoc(idGeneratorRef, { previousId: 0 });
        idGeneratorDoc = await getDoc(idGeneratorRef);
      }
      
      const currentId = idGeneratorDoc.data().previousId || 0;
      const newId = currentId + 1;
      
      await updateDoc(idGeneratorRef, { previousId: newId });
      
      const prefix = this.prefixes[type];
      let paddedId;
      
      switch(type) {
        case 'user':
          paddedId = newId.toString().padStart(8, '0'); // U00000001
          break;
        case 'message':
          paddedId = newId.toString().padStart(10, '0'); // MES0000000001
          break;
        default:
          paddedId = newId.toString().padStart(6, '0'); // Most types use 6 digits
      }
      
      return `${prefix}${paddedId}`;
    } catch (error) {
      console.error(`Error generating ${type} ID:`, error);
      throw error;
    }
  }

  /**
   * @param {string} type - The type of entity
   * @param {number} count - Number of IDs to generate
   * @returns {Promise<string[]>} - Array of generated IDs
   */
  static async generateMultipleIds(type, count) {
    if (!this.prefixes[type]) {
      throw new Error(`Invalid ID type: ${type}`);
    }
    if (count <= 0) {
      throw new Error('Count must be positive');
    }

    const idGeneratorRef = doc(db, "IdGenerator", type);
    const ids = [];
    
    await runTransaction(db, async (transaction) => {
      const docSnapshot = await transaction.get(idGeneratorRef);
      let currentId = 0;
      
      if (docSnapshot.exists()) {
        currentId = docSnapshot.data().previousId || 0;
      } else {
        transaction.set(idGeneratorRef, { previousId: 0 });
      }
      
      const prefix = this.prefixes[type];
      const newCurrentId = currentId + count;
      
      for (let i = 1; i <= count; i++) {
        const newId = currentId + i;
        let paddedId;
        
        switch(type) {
          case 'user':
            paddedId = newId.toString().padStart(8, '0');
            break;
          case 'message':
            paddedId = newId.toString().padStart(10, '0');
            break;
          default:
            paddedId = newId.toString().padStart(6, '0');
        }
        
        ids.push(`${prefix}${paddedId}`);
      }
      
      transaction.update(idGeneratorRef, { previousId: newCurrentId });
    });
    
    return ids;
  }
}

export default IdGenerator;