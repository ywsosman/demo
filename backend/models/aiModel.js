const nlp = require('compromise');

// Simple medical knowledge base for demo purposes
const MEDICAL_KNOWLEDGE = {
  // Symptom patterns and associated conditions
  conditions: {
    'common_cold': {
      name: 'Common Cold',
      symptoms: ['runny nose', 'sneezing', 'cough', 'congestion', 'sore throat', 'fatigue'],
      severity: [1, 2, 3, 4],
      description: 'A viral infection of the upper respiratory tract',
      recommendations: [
        'Get plenty of rest',
        'Stay hydrated',
        'Use over-the-counter medications for symptom relief',
        'Consult a doctor if symptoms worsen or persist beyond 10 days'
      ]
    },
    'flu': {
      name: 'Influenza (Flu)',
      symptoms: ['fever', 'chills', 'muscle aches', 'fatigue', 'headache', 'cough', 'sore throat'],
      severity: [3, 4, 5, 6, 7],
      description: 'A respiratory illness caused by influenza viruses',
      recommendations: [
        'Rest and stay hydrated',
        'Consider antiviral medications if within 48 hours of symptom onset',
        'Monitor fever and seek medical attention if it exceeds 103°F',
        'Isolate to prevent spreading to others'
      ]
    },
    'migraine': {
      name: 'Migraine Headache',
      symptoms: ['severe headache', 'nausea', 'vomiting', 'sensitivity to light', 'sensitivity to sound'],
      severity: [5, 6, 7, 8, 9],
      description: 'A neurological condition characterized by intense headaches',
      recommendations: [
        'Rest in a dark, quiet room',
        'Apply cold or warm compress to head/neck',
        'Stay hydrated',
        'Consider prescription migraine medications'
      ]
    },
    'gastroenteritis': {
      name: 'Gastroenteritis (Stomach Flu)',
      symptoms: ['nausea', 'vomiting', 'diarrhea', 'stomach cramps', 'fever', 'dehydration'],
      severity: [3, 4, 5, 6],
      description: 'Inflammation of the stomach and intestines',
      recommendations: [
        'Stay hydrated with clear fluids',
        'Follow the BRAT diet (bananas, rice, applesauce, toast)',
        'Rest and avoid dairy products',
        'Seek medical attention if severe dehydration occurs'
      ]
    },
    'hypertension': {
      name: 'High Blood Pressure',
      symptoms: ['headaches', 'dizziness', 'blurred vision', 'chest pain', 'fatigue'],
      severity: [4, 5, 6, 7, 8],
      description: 'Elevated blood pressure that can lead to serious health complications',
      recommendations: [
        'Monitor blood pressure regularly',
        'Maintain a healthy diet low in sodium',
        'Exercise regularly',
        'Take prescribed medications as directed'
      ]
    },
    'anxiety': {
      name: 'Anxiety Disorder',
      symptoms: ['excessive worry', 'restlessness', 'fatigue', 'difficulty concentrating', 'irritability', 'sleep problems'],
      severity: [3, 4, 5, 6, 7, 8],
      description: 'A mental health condition characterized by excessive worry and fear',
      recommendations: [
        'Practice relaxation techniques',
        'Regular exercise and healthy lifestyle',
        'Consider therapy or counseling',
        'Discuss medication options with healthcare provider'
      ]
    },
    'allergic_reaction': {
      name: 'Allergic Reaction',
      symptoms: ['itching', 'hives', 'swelling', 'runny nose', 'watery eyes', 'difficulty breathing'],
      severity: [2, 3, 4, 5, 6, 7, 8, 9],
      description: 'An immune system response to an allergen',
      recommendations: [
        'Identify and avoid the allergen',
        'Use antihistamines for mild reactions',
        'Seek immediate medical attention for severe reactions',
        'Consider carrying an epinephrine auto-injector if prescribed'
      ]
    }
  }
};

class AIModel {
  constructor() {
    this.initialized = true;
  }

  async predictDiagnosis(patientData) {
    try {
      const { symptoms, severity, duration, additionalInfo } = patientData;
      
      // Normalize and process symptoms text
      const normalizedSymptoms = this.normalizeSymptoms(symptoms);
      
      // Calculate match scores for each condition
      const conditionScores = this.calculateConditionScores(
        normalizedSymptoms, 
        severity, 
        duration, 
        additionalInfo
      );
      
      // Sort by confidence score
      const sortedPredictions = conditionScores
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3); // Top 3 predictions
      
      // Calculate overall confidence
      const overallConfidence = sortedPredictions.length > 0 ? 
        sortedPredictions[0].confidence : 0;
      
      return {
        predictions: sortedPredictions,
        confidence: overallConfidence,
        explanation: this.generateExplanation(sortedPredictions, normalizedSymptoms),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('AI Model prediction error:', error);
      return {
        predictions: [],
        confidence: 0,
        explanation: 'Unable to generate prediction due to processing error',
        timestamp: new Date().toISOString()
      };
    }
  }

  normalizeSymptoms(symptomsText) {
    // Use compromise.js for basic NLP processing
    const doc = nlp(symptomsText.toLowerCase());
    
    // Extract potential symptoms
    const symptoms = [];
    
    // Simple keyword matching for demo purposes
    const text = symptomsText.toLowerCase();
    const words = text.split(/[\s,]+/);
    
    // Common medical terms and their variations
    const symptomMappings = {
      'headache': ['headache', 'head pain', 'head ache'],
      'fever': ['fever', 'temperature', 'hot', 'feverish'],
      'cough': ['cough', 'coughing'],
      'fatigue': ['tired', 'fatigue', 'exhausted', 'weakness', 'weak'],
      'nausea': ['nausea', 'sick', 'queasy'],
      'vomiting': ['vomiting', 'throwing up', 'vomit'],
      'diarrhea': ['diarrhea', 'loose stool', 'loose stools'],
      'runny nose': ['runny nose', 'nasal congestion', 'congestion'],
      'sore throat': ['sore throat', 'throat pain'],
      'muscle aches': ['muscle pain', 'body aches', 'aches', 'muscle aches'],
      'difficulty breathing': ['breathing problems', 'shortness of breath', 'difficulty breathing'],
      'chest pain': ['chest pain', 'chest discomfort'],
      'dizziness': ['dizzy', 'dizziness', 'lightheaded'],
      'itching': ['itchy', 'itching', 'itch'],
      'swelling': ['swelling', 'swollen'],
      'blurred vision': ['blurred vision', 'vision problems'],
      'anxiety': ['anxious', 'worried', 'nervous', 'panic'],
      'stomach cramps': ['stomach pain', 'abdominal pain', 'cramps']
    };
    
    // Check for symptom matches
    for (const [symptom, variations] of Object.entries(symptomMappings)) {
      for (const variation of variations) {
        if (text.includes(variation)) {
          symptoms.push(symptom);
          break;
        }
      }
    }
    
    return [...new Set(symptoms)]; // Remove duplicates
  }

  calculateConditionScores(symptoms, severity, duration, additionalInfo) {
    const scores = [];
    
    for (const [conditionKey, condition] of Object.entries(MEDICAL_KNOWLEDGE.conditions)) {
      let matchScore = 0;
      let totalPossible = condition.symptoms.length;
      
      // Calculate symptom matching score
      for (const symptom of symptoms) {
        if (condition.symptoms.includes(symptom)) {
          matchScore += 1;
        }
      }
      
      // Normalize symptom score (0-1)
      const symptomScore = totalPossible > 0 ? matchScore / totalPossible : 0;
      
      // Severity matching
      let severityScore = 0;
      if (condition.severity.includes(severity)) {
        severityScore = 1;
      } else {
        // Calculate distance from closest severity
        const distances = condition.severity.map(s => Math.abs(s - severity));
        const minDistance = Math.min(...distances);
        severityScore = Math.max(0, 1 - (minDistance / 5)); // Normalize by max severity range
      }
      
      // Duration consideration (simple heuristic)
      let durationScore = 0.5; // Default neutral score
      if (duration) {
        const durationLower = duration.toLowerCase();
        if (durationLower.includes('acute') || durationLower.includes('sudden')) {
          durationScore = conditionKey === 'migraine' || conditionKey === 'allergic_reaction' ? 0.8 : 0.6;
        } else if (durationLower.includes('chronic') || durationLower.includes('weeks')) {
          durationScore = conditionKey === 'hypertension' || conditionKey === 'anxiety' ? 0.8 : 0.4;
        }
      }
      
      // Calculate overall confidence (weighted average)
      const confidence = (
        symptomScore * 0.6 +           // 60% weight on symptoms
        severityScore * 0.3 +          // 30% weight on severity
        durationScore * 0.1            // 10% weight on duration
      );
      
      // Only include conditions with reasonable confidence
      if (confidence > 0.1) {
        scores.push({
          condition: condition.name,
          confidence: Math.round(confidence * 100) / 100,
          description: condition.description,
          recommendations: condition.recommendations,
          matchedSymptoms: symptoms.filter(s => condition.symptoms.includes(s))
        });
      }
    }
    
    return scores;
  }

  generateExplanation(predictions, symptoms) {
    if (predictions.length === 0) {
      return 'No clear diagnosis pattern found. Please consult with a healthcare professional for proper evaluation.';
    }
    
    const topPrediction = predictions[0];
    const symptomsText = symptoms.length > 0 ? symptoms.join(', ') : 'reported symptoms';
    
    let explanation = `Based on the symptoms (${symptomsText}), `;
    
    if (topPrediction.confidence > 0.7) {
      explanation += `there is a strong indication of ${topPrediction.condition}.`;
    } else if (topPrediction.confidence > 0.4) {
      explanation += `${topPrediction.condition} is a possible diagnosis.`;
    } else {
      explanation += `${topPrediction.condition} is one potential consideration among others.`;
    }
    
    explanation += ` This assessment is based on AI analysis and should be confirmed by a healthcare professional.`;
    
    return explanation;
  }

  // Method to get detailed information about a specific condition
  getConditionInfo(conditionName) {
    for (const condition of Object.values(MEDICAL_KNOWLEDGE.conditions)) {
      if (condition.name.toLowerCase() === conditionName.toLowerCase()) {
        return condition;
      }
    }
    return null;
  }
}

module.exports = new AIModel();
