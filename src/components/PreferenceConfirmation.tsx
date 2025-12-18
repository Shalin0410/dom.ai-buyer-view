import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CheckCircle, Edit, AlertTriangle, Loader2, RefreshCw, History } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ExtractedPreferences } from './VoiceRecorder';

interface PreferenceChange {
  field: string;
  old: any;
  new: any;
  recording: number;
}

interface PreferenceConfirmationProps {
  preferences: ExtractedPreferences;
  transcript: string;
  confidence: number;
  mandatoryFieldsCaptured: number;
  totalMandatoryFields: number;
  recordingNumber?: number;
  isFirstRecording?: boolean;
  changesDetected?: number;
  changes?: PreferenceChange[];
  onConfirm: (edited: ExtractedPreferences) => Promise<void>;
  onReRecord: () => void;
}

export const PreferenceConfirmation = ({
  preferences,
  transcript,
  confidence,
  mandatoryFieldsCaptured,
  totalMandatoryFields,
  recordingNumber,
  isFirstRecording,
  changesDetected,
  changes,
  onConfirm,
  onReRecord
}: PreferenceConfirmationProps) => {
  const [edited, setEdited] = useState(preferences);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      await onConfirm(edited);
    } finally {
      setIsSaving(false);
    }
  };

  // Check which mandatory fields are missing
  const missingFields: string[] = [];
  if (!edited.bedrooms) missingFields.push('bedrooms');
  if (!edited.bathrooms) missingFields.push('bathrooms');
  if (!edited.price_max) missingFields.push('maximum budget');
  if (!edited.preferred_areas || edited.preferred_areas.length === 0) {
    missingFields.push('preferred areas');
  }

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatChangeValue = (field: string, value: any) => {
    if (value === null || value === undefined) return 'none';

    if (field.includes('price') || field.includes('budget')) {
      return formatCurrency(value) || 'none';
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (Array.isArray(value)) {
      return value.join(', ') || 'none';
    }

    return value;
  };

  const confidenceColor = confidence >= 0.75 ? 'text-green-600' : confidence >= 0.5 ? 'text-yellow-600' : 'text-orange-600';
  const confidenceText = confidence >= 0.75 ? 'High' : confidence >= 0.5 ? 'Medium' : 'Low';

  return (
    <div className="space-y-6 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <div className="text-left">
            <h2 className="text-2xl font-bold">
              {isFirstRecording ? 'Great! Here\'s what we understood' : 'Preferences Updated!'}
            </h2>
            <p className="text-sm text-gray-500">
              Confidence: <span className={`font-semibold ${confidenceColor}`}>{confidenceText}</span>
              {' '}({mandatoryFieldsCaptured}/{totalMandatoryFields} key fields captured)
              {recordingNumber && (
                <span className="ml-2">
                  • Recording #{recordingNumber}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Changes Detected */}
      {!isFirstRecording && changesDetected && changesDetected > 0 && changes && changes.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-2">
            <History className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-2">
                We detected {changesDetected} change{changesDetected > 1 ? 's' : ''} from your previous preferences:
              </p>
              <ul className="space-y-1">
                {changes.map((change, idx) => (
                  <li key={idx} className="text-sm text-blue-800">
                    <span className="font-medium capitalize">{change.field}:</span>{' '}
                    <span className="line-through opacity-70">{formatChangeValue(change.field, change.old)}</span>{' '}
                    → <span className="font-semibold">{formatChangeValue(change.field, change.new)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Transcript */}
      <Card className="p-4 bg-gray-50 border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-2">Your message:</p>
        <p className="text-sm text-gray-600 italic leading-relaxed">
          "{transcript}"
        </p>
      </Card>

      {/* Missing Fields Warning */}
      {missingFields.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Missing required information:</strong> {missingFields.join(', ')}.
            {' '}Please edit below or re-record to provide these details.
          </AlertDescription>
        </Alert>
      )}

      {/* Extracted Preferences */}
      <div className="space-y-5">
        <h3 className="text-lg font-semibold flex items-center">
          Extracted Preferences
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="ml-auto"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Bedrooms */}
          <Card className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedrooms (minimum) <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <Input
                type="number"
                min="1"
                max="10"
                value={edited.bedrooms || ''}
                onChange={(e) => setEdited({ ...edited, bedrooms: parseInt(e.target.value) || null })}
                placeholder="e.g., 3"
                className={!edited.bedrooms ? 'border-red-300' : ''}
              />
            ) : (
              <p className="text-2xl font-semibold">
                {edited.bedrooms ? `${edited.bedrooms} BR` : <span className="text-gray-400">Not specified</span>}
              </p>
            )}
          </Card>

          {/* Bathrooms */}
          <Card className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bathrooms (minimum) <span className="text-red-500">*</span>
            </label>
            {isEditing ? (
              <Input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={edited.bathrooms || ''}
                onChange={(e) => setEdited({ ...edited, bathrooms: parseFloat(e.target.value) || null })}
                placeholder="e.g., 2.5"
                className={!edited.bathrooms ? 'border-red-300' : ''}
              />
            ) : (
              <p className="text-2xl font-semibold">
                {edited.bathrooms ? `${edited.bathrooms} BA` : <span className="text-gray-400">Not specified</span>}
              </p>
            )}
          </Card>
        </div>

        {/* Budget Range */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget Range <span className="text-red-500">* (at least max)</span>
          </label>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Minimum</label>
                <Input
                  type="number"
                  min="0"
                  step="10000"
                  value={edited.price_min || ''}
                  onChange={(e) => setEdited({ ...edited, price_min: parseInt(e.target.value) || null })}
                  placeholder="$500,000"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Maximum</label>
                <Input
                  type="number"
                  min="0"
                  step="10000"
                  value={edited.price_max || ''}
                  onChange={(e) => setEdited({ ...edited, price_max: parseInt(e.target.value) || null })}
                  placeholder="$750,000"
                  className={!edited.price_max ? 'border-red-300' : ''}
                />
              </div>
            </div>
          ) : (
            <p className="text-2xl font-semibold">
              {edited.price_min && edited.price_max ? (
                `${formatCurrency(edited.price_min)} - ${formatCurrency(edited.price_max)}`
              ) : edited.price_max ? (
                `Up to ${formatCurrency(edited.price_max)}`
              ) : (
                <span className="text-gray-400">Not specified</span>
              )}
            </p>
          )}
        </Card>

        {/* Preferred Areas */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Areas <span className="text-red-500">*</span>
          </label>
          {isEditing ? (
            <Input
              type="text"
              value={edited.preferred_areas?.join(', ') || ''}
              onChange={(e) => setEdited({
                ...edited,
                preferred_areas: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
              placeholder="e.g., Saratoga Springs, Campbell, Los Gatos"
              className={!edited.preferred_areas || edited.preferred_areas.length === 0 ? 'border-red-300' : ''}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {edited.preferred_areas && edited.preferred_areas.length > 0 ? (
                edited.preferred_areas.map((area, i) => (
                  <Badge key={i} variant="secondary" className="text-sm px-3 py-1">
                    📍 {area}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">No areas specified</span>
              )}
            </div>
          )}
        </Card>

        {/* Property Types */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Types
          </label>
          <div className="flex flex-wrap gap-2">
            {edited.property_type_preferences && edited.property_type_preferences.length > 0 ? (
              edited.property_type_preferences.map((type, i) => (
                <Badge key={i} variant="outline" className="text-sm px-3 py-1">
                  🏠 {type.replace('_', ' ')}
                </Badge>
              ))
            ) : (
              <span className="text-gray-400 text-sm">No preference specified</span>
            )}
          </div>
        </Card>

        {/* Must-Have Features */}
        <Card className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Must-Have Features
          </label>
          <div className="flex flex-wrap gap-2">
            {edited.must_have_features && edited.must_have_features.length > 0 ? (
              edited.must_have_features.map((feature, i) => (
                <Badge key={i} variant="default" className="text-sm px-3 py-1">
                  ✓ {feature}
                </Badge>
              ))
            ) : (
              <span className="text-gray-400 text-sm">No must-haves specified</span>
            )}
          </div>
        </Card>

        {/* Nice-to-Have Features */}
        {edited.nice_to_have_features && edited.nice_to_have_features.length > 0 && (
          <Card className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nice-to-Have Features
            </label>
            <div className="flex flex-wrap gap-2">
              {edited.nice_to_have_features.map((feature, i) => (
                <Badge key={i} variant="secondary" className="text-sm px-3 py-1">
                  {feature}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* Urgency & Move-in Date */}
        {(edited.urgency_level || edited.ideal_move_in_date) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {edited.urgency_level && (
              <Card className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level
                </label>
                <Badge
                  variant={edited.urgency_level === 'high' ? 'destructive' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {edited.urgency_level}
                </Badge>
              </Card>
            )}
            {edited.ideal_move_in_date && (
              <Card className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ideal Move-in Date
                </label>
                <p className="text-lg font-medium">
                  {new Date(edited.ideal_move_in_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        {isEditing ? (
          <>
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={onReRecord}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Record Again
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSaving || missingFields.length > 0}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Looks Good!
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {missingFields.length > 0 && (
        <p className="text-sm text-center text-gray-500">
          Please provide all required fields before confirming
        </p>
      )}
    </div>
  );
};
