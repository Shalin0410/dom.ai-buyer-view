import React from 'react';
import { usePropertySummary } from '@/hooks/useProperties';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Home, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react';

interface PropertySummaryProps {
  buyerId: string;
}

export const PropertySummary: React.FC<PropertySummaryProps> = ({ buyerId }) => {
  const { summary, loading, error } = usePropertySummary(buyerId);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading summary...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !summary) {
    return null; // Don't show error state for summary, just hide it
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'researching': return 'bg-blue-100 text-blue-800';
      case 'viewing': return 'bg-blue-100 text-blue-800';
      case 'offer_submitted': return 'bg-orange-100 text-orange-800';
      case 'under_contract': return 'bg-purple-100 text-purple-800';
      case 'in_escrow': return 'bg-indigo-100 text-indigo-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'initial_research': return 'bg-blue-50 text-blue-700';
      case 'active_search': return 'bg-blue-50 text-blue-700';
      case 'offer_negotiation': return 'bg-orange-50 text-orange-700';
      case 'under_contract': return 'bg-purple-50 text-purple-700';
      case 'closing': return 'bg-green-50 text-green-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatStageLabel = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Properties */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Home className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{summary.total_properties}</p>
              <p className="text-sm text-gray-600">Total Properties</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Required */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{summary.requiring_action}</p>
              <p className="text-sm text-gray-600">Need Action</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Properties */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {summary.by_status.researching + summary.by_status.viewing + summary.by_status.offer_submitted}
              </p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Closed Properties */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{summary.by_status.closed}</p>
              <p className="text-sm text-gray-600">Closed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Breakdown */}
      {summary.total_properties > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.by_status).map(([status, count]) => (
                count > 0 && (
                  <Badge key={status} className={getStatusColor(status)}>
                    {formatStatusLabel(status)}: {count}
                  </Badge>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage Breakdown */}
      {summary.total_properties > 0 && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">By Buying Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.by_stage).map(([stage, count]) => (
                count > 0 && (
                  <Badge key={stage} className={getStageColor(stage)}>
                    {formatStageLabel(stage)}: {count}
                  </Badge>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
