import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin, Mail, User, X, CalendarDays, Send } from 'lucide-react';
import { Property } from '@/services/api/types';
import { toast } from '@/hooks/use-toast';

interface ViewingScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  buyerName: string;
  buyerEmail: string;
  agentEmail: string;
  onScheduleConfirm: (schedulingData: {
    propertyId: string;
    selectedDates: Date[];
    additionalInfo: string;
  }) => Promise<boolean>;
}

interface TimeSlot {
  id: string;
  time: string;
  period: 'AM' | 'PM';
}

const timeSlots: TimeSlot[] = [
  { id: '09:00', time: '9:00', period: 'AM' },
  { id: '10:00', time: '10:00', period: 'AM' },
  { id: '11:00', time: '11:00', period: 'AM' },
  { id: '12:00', time: '12:00', period: 'PM' },
  { id: '13:00', time: '1:00', period: 'PM' },
  { id: '14:00', time: '2:00', period: 'PM' },
  { id: '15:00', time: '3:00', period: 'PM' },
  { id: '16:00', time: '4:00', period: 'PM' },
  { id: '17:00', time: '5:00', period: 'PM' },
];

export const ViewingScheduleModal: React.FC<ViewingScheduleModalProps> = ({
  isOpen,
  onClose,
  property,
  buyerName,
  buyerEmail,
  agentEmail,
  onScheduleConfirm
}) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<{ [key: string]: string[] }>({});
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateKey = date.toDateString();
    const isSelected = selectedDates.some(d => d.toDateString() === dateKey);
    
    if (isSelected) {
      // Remove date and its associated times
      setSelectedDates(prev => prev.filter(d => d.toDateString() !== dateKey));
      setSelectedTimes(prev => {
        const newTimes = { ...prev };
        delete newTimes[dateKey];
        return newTimes;
      });
    } else {
      // Add date
      setSelectedDates(prev => [...prev, date]);
      setSelectedTimes(prev => ({ ...prev, [dateKey]: [] }));
    }
  };

  const handleTimeToggle = (dateKey: string, timeId: string) => {
    setSelectedTimes(prev => {
      const currentTimes = prev[dateKey] || [];
      const isSelected = currentTimes.includes(timeId);
      
      if (isSelected) {
        return {
          ...prev,
          [dateKey]: currentTimes.filter(t => t !== timeId)
        };
      } else {
        return {
          ...prev,
          [dateKey]: [...currentTimes, timeId]
        };
      }
    });
  };

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      toast({
        title: "Please select dates",
        description: "Choose at least one preferred date for viewing.",
        variant: "destructive"
      });
      return;
    }

    // Check if at least one date has time slots selected
    const hasTimeSlots = Object.values(selectedTimes).some(times => times.length > 0);
    if (!hasTimeSlots) {
      toast({
        title: "Please select time slots",
        description: "Choose at least one time slot for your selected dates.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onScheduleConfirm({
        propertyId: property.id,
        selectedDates,
        additionalInfo
      });

      if (success) {
        // Send email notification
        await sendViewingRequestEmail();
        
        toast({
          title: "Viewing Scheduled!",
          description: "Your viewing request has been sent to your agent.",
        });
        
        // Reset form
        setSelectedDates([]);
        setSelectedTimes({});
        setAdditionalInfo('');
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule viewing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendViewingRequestEmail = async () => {
    try {
      const emailData = {
        to: agentEmail,
        buyerEmail, // This will be used for CC in the API
        from: 'dom.ai@gmail.com',
        subject: `Viewing Request - ${property.address}`,
        buyerName,
        property: {
          address: property.address,
          city: property.city,
          state: property.state,
          zipCode: property.zip_code,
          price: property.listing_price,
          mlsNumber: property.mls_number
        },
        selectedDatesAndTimes: selectedDates.map(date => ({
          date: date.toDateString(),
          times: selectedTimes[date.toDateString()]?.map(timeId => {
            const slot = timeSlots.find(s => s.id === timeId);
            return slot ? `${slot.time} ${slot.period}` : timeId;
          }) || []
        })),
        additionalInfo
      };

      const response = await fetch('/api/send-viewing-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      // Don't throw here to avoid blocking the main flow
    }
  };

  const formatSelectedDates = () => {
    return selectedDates.map(date => {
      const dateKey = date.toDateString();
      const times = selectedTimes[dateKey] || [];
      const timeLabels = times.map(timeId => {
        const slot = timeSlots.find(s => s.id === timeId);
        return slot ? `${slot.time} ${slot.period}` : timeId;
      });
      
      return {
        date: date.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric',
          year: 'numeric' 
        }),
        times: timeLabels
      };
    });
  };

  const disabledDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border border-border rounded-2xl shadow-modern">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-slate-900">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <span className="text-xl">Schedule Property Viewing</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Information */}
          <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-slate-800">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>Property Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-semibold">{property.address}</p>
                <p className="text-slate-600">{property.city}, {property.state} {property.zip_code}</p>
                <p className="font-semibold text-blue-600">${property.listing_price?.toLocaleString()}</p>
                {property.mls_number && (
                  <p className="text-sm text-slate-500">MLS: {property.mls_number}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Date Selection */}
          <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-800">Select Preferred Dates</CardTitle>
              <p className="text-sm text-slate-600">Choose multiple dates that work for you</p>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => {
                  if (Array.isArray(dates)) {
                    setSelectedDates(dates);
                    // Reset time selections for new dates
                    const newSelectedTimes: { [key: string]: string[] } = {};
                    dates.forEach(date => {
                      const dateKey = date.toDateString();
                      newSelectedTimes[dateKey] = selectedTimes[dateKey] || [];
                    });
                    setSelectedTimes(newSelectedTimes);
                  }
                }}
                disabled={disabledDates}
                className="rounded-md border border-border bg-white"
                classNames={{
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
                  day_today: "bg-blue-50 text-blue-700 font-semibold border border-blue-200",
                }}
              />
            </CardContent>
          </Card>

          {/* Time Slot Selection */}
          {selectedDates.length > 0 && (
            <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-800">Select Time Slots</CardTitle>
                <p className="text-sm text-slate-600">Choose preferred times for each selected date</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDates.map(date => {
                  const dateKey = date.toDateString();
                  const selectedTimesForDate = selectedTimes[dateKey] || [];
                  
                  return (
                    <div key={dateKey} className="border rounded-lg p-4 bg-blue-50/40 border-blue-100">
                      <h4 className="font-medium mb-3 flex items-center space-x-2 text-slate-800">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>{date.toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map(slot => (
                          <Button
                            key={slot.id}
                            variant={selectedTimesForDate.includes(slot.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTimeToggle(dateKey, slot.id)}
                            className={`text-xs transition-all ${
                              selectedTimesForDate.includes(slot.id) 
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground border-blue-600" 
                                : "border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
                            }`}
                          >
                            {slot.time} {slot.period}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-800">Additional Information</CardTitle>
              <p className="text-sm text-slate-600">Any special requests or questions? (Optional)</p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., I'm particularly interested in the kitchen renovations, or I'd like to see the backyard..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="min-h-[100px] bg-white/80 border border-border rounded-xl"
              />
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedDates.length > 0 && (
            <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-800">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-700">Buyer: {buyerName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-700">Email: {buyerEmail}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-800">Selected dates and times:</p>
                    {formatSelectedDates().map((item, index) => (
                      <div key={index} className="ml-4 text-sm">
                        <p className="font-medium">{item.date}</p>
                        {item.times.length > 0 ? (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.times.map((time, timeIndex) => (
                              <Badge key={timeIndex} variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                                {time}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 italic">No times selected</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border text-slate-700 hover:bg-slate-50"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={selectedDates.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Viewing Request
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};