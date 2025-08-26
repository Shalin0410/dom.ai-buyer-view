// src/components/CategoryQuestions.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { QuestionCategory } from './QuestionSelection';

interface CategoryQuestionsProps {
  category: QuestionCategory;
  onQuestionSelect: (question: string) => void;
  onBack: () => void;
}

export function CategoryQuestions({ category, onQuestionSelect, onBack }: CategoryQuestionsProps) {
  return (
    <div className="space-y-6">
      {/* Questions */}
      <div className="space-y-3">
        {category.questions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start text-left h-auto p-4 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300"
            onClick={() => onQuestionSelect(question)}
          >
            <span className="text-gray-800 font-medium">{question}</span>
          </Button>
        ))}
      </div>

      {/* Welcome Message */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-semibold text-blue-800">Dom AI</span>
            </div>
            <p className="text-blue-700 text-sm">
              Hi! I'm Dom AI, your home buying assistant. I can help you understand the home buying process, 
              from getting pre-approved for a mortgage to closing on your new home. What questions do you have about buying a home?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
