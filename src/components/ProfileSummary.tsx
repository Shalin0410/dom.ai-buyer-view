import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, MapPin, Sparkles } from 'lucide-react';
import type { ExtractedPreferences } from './VoiceRecorder';

interface ProfileSummaryProps {
  preferences: ExtractedPreferences;
  onContinue: () => void;
  onEdit?: () => void;
}

export const ProfileSummary = ({
  preferences,
  onContinue,
  onEdit
}: ProfileSummaryProps) => {
  const formatCurrency = (value: number | null) => {
    if (!value) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number | null) => {
    if (value === null || value === undefined) return 'Not specified';
    return value.toString();
  };

  const formatArray = (arr: string[] | null | undefined) => {
    if (!arr || arr.length === 0) return 'Not specified';
    return arr.join(', ');
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
      <Card className="p-6 sm:p-8 lg:p-10 shadow-2xl border border-gray-200 rounded-2xl sm:rounded-3xl">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 mb-3 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Your Profile
          </h2>
          <p className="text-base sm:text-lg text-gray-600">
            Here's what we know about your home search
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Property Requirements */}
          <Card className="p-4 sm:p-6 border border-gray-200 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Property Requirements
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div>
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Bedrooms</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {formatNumber(preferences.bedrooms)}
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Bathrooms</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {formatNumber(preferences.bathrooms)}
                </div>
              </div>
            </div>
          </Card>

          {/* Location & Budget */}
          <Card className="p-4 sm:p-6 border border-gray-200 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Location & Budget
              </h3>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <div className="text-xs sm:text-sm text-gray-600 mb-1">
                  Preferred Location
                </div>
                <div className="text-base sm:text-lg font-bold text-gray-900">
                  {formatArray(preferences.preferred_areas)}
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Price Range</div>
                <div className="text-base sm:text-lg font-bold text-gray-900">
                  {preferences.price_min && preferences.price_max
                    ? `${formatCurrency(preferences.price_min)} - ${formatCurrency(preferences.price_max)}`
                    : preferences.price_max
                      ? `Max ${formatCurrency(preferences.price_max)}`
                      : preferences.price_min
                        ? `Min ${formatCurrency(preferences.price_min)}`
                        : 'Not specified'}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Preferences Section */}
        {((preferences.property_type_preferences && preferences.property_type_preferences.length > 0) ||
          (preferences.must_have_features && preferences.must_have_features.length > 0) ||
          (preferences.nice_to_have_features && preferences.nice_to_have_features.length > 0)) && (
          <Card className="p-4 sm:p-6 border border-gray-200 rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-shadow mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
              Additional Preferences
            </h3>

            <div className="space-y-3 sm:space-y-4">
              {preferences.property_type_preferences && preferences.property_type_preferences.length > 0 && (
                <div>
                  <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Property Types
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {preferences.property_type_preferences.map((type, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs sm:text-sm font-medium border border-indigo-200"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {preferences.must_have_features && preferences.must_have_features.length > 0 && (
                <div>
                  <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Must-Have Features
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {preferences.must_have_features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-green-50 text-green-700 rounded-lg text-xs sm:text-sm font-medium border border-green-200"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {preferences.nice_to_have_features && preferences.nice_to_have_features.length > 0 && (
                <div>
                  <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Nice-to-Have Features
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {preferences.nice_to_have_features.map((feature, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium border border-gray-300"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {onEdit && (
            <Button
              onClick={onEdit}
              variant="outline"
              className="flex-1 h-12 sm:h-14 text-sm sm:text-base font-semibold"
            >
              Edit Preferences
            </Button>
          )}
          <Button
            onClick={onContinue}
            className="flex-1 h-12 sm:h-14 text-sm sm:text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
          >
            Go to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};
