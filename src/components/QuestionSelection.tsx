// src/components/QuestionSelection.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Home, FileText } from 'lucide-react';

interface QuestionCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  questionCount: number;
  questions: string[];
}

const questionCategories: QuestionCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started & Finances',
    icon: <DollarSign className="w-6 h-6" />,
    questionCount: 6,
    questions: [
      'How do I get pre-approved for a mortgage?',
      "What's the difference between pre-qualification and pre-approval?",
      'How much should I save for a down payment?',
      'What are closing costs and how much should I expect?',
      'What credit score do I need to buy a home?',
      'How do I calculate my home buying budget?'
    ]
  },
  {
    id: 'finding-home',
    title: 'Finding Your Home',
    icon: <Home className="w-6 h-6" />,
    questionCount: 6,
    questions: [
      'How do I find the right neighborhood?',
      'What should I look for during a home inspection?',
      'How do I determine if a home is a good investment?',
      'What are the pros and cons of different property types?',
      'How do I work with a real estate agent?',
      'What should I consider when comparing homes?'
    ]
  },
  {
    id: 'offers-closing',
    title: 'Offers & Closing Process',
    icon: <FileText className="w-6 h-6" />,
    questionCount: 6,
    questions: [
      'How do I make a competitive offer?',
      'What contingencies should I include in my offer?',
      'What happens during the closing process?',
      'How long does the home buying process typically take?',
      'What is earnest money and how much should I put down?',
      'What documents do I need for closing?'
    ]
  }
];

interface QuestionSelectionProps {
  onQuestionSelect: (question: string) => void;
  onCategorySelect: (category: QuestionCategory) => void;
}

export function QuestionSelection({ onQuestionSelect, onCategorySelect }: QuestionSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          What can I help you with?
        </h2>
        <p className="text-gray-600">
          Choose a category or specific question to get started
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {questionCategories.map((category) => (
          <Card 
            key={category.id}
            className="cursor-pointer hover:shadow-lg transition-shadow bg-yellow-50 border-yellow-200"
            onClick={() => onCategorySelect(category)}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{category.title}</h3>
                  <p className="text-sm text-gray-600">{category.questionCount} questions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { questionCategories };
export type { QuestionCategory };
