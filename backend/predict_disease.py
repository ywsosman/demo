#!/usr/bin/env python3
"""
Disease Prediction Script with SHAP Explanations
This script is called by Node.js backend to perform disease predictions
using a fine-tuned BERT model and generate SHAP explanations.
"""

import sys
import json
import os
from pathlib import Path

try:
    import transformers
    from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
    import shap
    import torch
    import numpy as np
except ImportError as e:
    print(json.dumps({
        'error': f'Missing required Python package: {str(e)}',
        'message': 'Please install required packages: pip install transformers shap torch'
    }))
    sys.exit(1)

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

class DiseasePredictor:
    def __init__(self, model_path):
        """Initialize the model and explainer"""
        self.model_path = model_path
        self.device_id = 0 if torch.cuda.is_available() else -1
        
        # Load model and tokenizer
        try:
            print(f"Loading tokenizer from {model_path}...", file=sys.stderr)
            self.tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
            
            print(f"Loading model from {model_path}...", file=sys.stderr)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_path,
                local_files_only=True,
                trust_remote_code=False
            )
            
            print("Creating pipeline...", file=sys.stderr)
            # Create pipeline
            self.pipeline = pipeline(
                "text-classification",
                model=self.model,
                tokenizer=self.tokenizer,
                device=self.device_id,
                return_all_scores=True
            )
            
            print("Creating SHAP explainer...", file=sys.stderr)
            # Create SHAP explainer
            self.explainer = shap.Explainer(self.pipeline)
            
            print("Model loaded successfully!", file=sys.stderr)
            
        except Exception as e:
            import traceback
            error_details = traceback.format_exc()
            print(f"Error details:\n{error_details}", file=sys.stderr)
            raise Exception(f"Failed to load model from {model_path}: {str(e)}")
    
    def predict(self, symptom_text):
        """
        Predict disease and generate SHAP explanation
        
        Args:
            symptom_text (str): Patient's symptom description
            
        Returns:
            dict: Prediction results with SHAP explanation
        """
        try:
            # Get predictions
            # Note: pipeline with return_all_scores=True returns list of dicts directly
            predictions = self.pipeline(symptom_text)
            
            # Handle different return formats
            if isinstance(predictions, list) and len(predictions) > 0:
                # If it's a list of lists, unwrap it
                if isinstance(predictions[0], list):
                    predictions = predictions[0]
            
            # Find the disease with highest score
            best_prediction = max(predictions, key=lambda x: x['score'])
            predicted_disease = best_prediction['label']
            confidence_score = float(best_prediction['score'])
            
            # Get top 3 predictions
            top_predictions = sorted(predictions, key=lambda x: x['score'], reverse=True)[:3]
            
            # Get SHAP explanation
            shap_values = self.explainer([symptom_text])
            
            # Extract SHAP data for the predicted class
            predicted_class_index = shap_values.output_names.index(predicted_disease)
            
            # Get words and their SHAP values
            words = shap_values.data[0]
            shap_scores = shap_values.values[0][:, predicted_class_index]
            
            # Create explanation data
            explanation_data = {
                'words': [str(w) for w in words],
                'shap_values': [float(v) for v in shap_scores]
            }
            
            # Calculate feature importance (which words contributed most)
            word_importance = []
            for word, shap_val in zip(words, shap_scores):
                if word.strip() and word not in ['[CLS]', '[SEP]', '[PAD]']:
                    word_importance.append({
                        'word': str(word),
                        'importance': float(shap_val),
                        'impact': 'positive' if shap_val > 0 else 'negative'
                    })
            
            # Sort by absolute importance
            word_importance.sort(key=lambda x: abs(x['importance']), reverse=True)
            
            return {
                'success': True,
                'predicted_disease': predicted_disease,
                'confidence': confidence_score,
                'top_predictions': [
                    {
                        'disease': pred['label'],
                        'confidence': float(pred['score'])
                    }
                    for pred in top_predictions
                ],
                'explanation': explanation_data,
                'word_importance': word_importance[:10],  # Top 10 most important words
                'device': 'cuda' if self.device_id == 0 else 'cpu'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to generate prediction'
            }

def main():
    """Main function to handle command line input"""
    
    # Check if symptom text is provided
    if len(sys.argv) < 2:
        print(json.dumps({
            'error': 'No symptom text provided',
            'usage': 'python predict_disease.py "symptom text"'
        }))
        sys.exit(1)
    
    # Get symptom text from command line argument
    symptom_text = sys.argv[1]
    
    # Get model path (default to symptom_disease_model in backend folder)
    script_dir = Path(__file__).parent
    model_path = os.environ.get('MODEL_PATH', str(script_dir / 'symptom_disease_model'))
    
    # Check if model exists
    if not Path(model_path).exists():
        print(json.dumps({
            'error': f'Model not found at {model_path}',
            'message': 'Please ensure the model is saved in the correct location'
        }))
        sys.exit(1)
    
    try:
        # Initialize predictor (this will be slow the first time)
        predictor = DiseasePredictor(model_path)
        
        # Make prediction
        result = predictor.predict(symptom_text)
        
        # Output result as JSON
        print(json.dumps(result))
        
        # Exit with appropriate code
        sys.exit(0 if result.get('success', False) else 1)
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'message': 'Unexpected error during prediction'
        }))
        sys.exit(1)

if __name__ == '__main__':
    main()

