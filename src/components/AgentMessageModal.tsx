import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Send, User, X, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AgentMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  agentEmail: string;
  buyerName: string;
  buyerEmail: string;
}

export const AgentMessageModal: React.FC<AgentMessageModalProps> = ({
  isOpen,
  onClose,
  agentName,
  agentEmail,
  buyerName,
  buyerEmail
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Please enter a message",
        description: "Message content is required.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await sendMessageToAgent();

      toast({
        title: "Message Sent!",
        description: `Your message has been sent to ${agentName}.`,
      });

      // Reset form
      setSubject('');
      setMessage('');
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendMessageToAgent = async () => {
    try {
      const emailData = {
        to: agentEmail,
        buyerName,
        buyerEmail,
        agentName,
        subject: subject.trim() || undefined,
        message: message.trim()
      };

      const response = await fetch('/api/send-agent-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const result = await response.json();
      console.log('Message sent successfully:', result);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const handleReset = () => {
    setSubject('');
    setMessage('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border border-border rounded-2xl shadow-modern">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-slate-900">
            <Mail className="h-5 w-5 text-blue-600" />
            <span className="text-xl">Message Your Agent</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Information */}
          <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-slate-800">
                <User className="h-4 w-4 text-blue-600" />
                <span>Sending to</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-semibold text-xl">
                    {agentName?.charAt(0) || 'A'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{agentName}</p>
                  <p className="text-sm text-gray-600">{agentEmail}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Form */}
          <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-800">Compose Message</CardTitle>
              <p className="text-sm text-slate-600">Send a message directly to your agent</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Subject (Optional)
                </label>
                <Input
                  placeholder="e.g., Question about properties, Schedule a call..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-white/80 border border-border rounded-xl"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {subject.length}/200 characters
                </p>
              </div>

              {/* Message Field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Message <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Type your message here... Ask questions, share preferences, or request a consultation."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[150px] bg-white/80 border border-border rounded-xl"
                  maxLength={2000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {message.length}/2000 characters
                </p>
              </div>

              {/* Quick Message Templates */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Quick Templates</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage("Hi! I'd like to schedule a call to discuss my property search. When would be a good time for you?")}
                    className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    Schedule Call
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage("I have some questions about the current market conditions in my area of interest. Could we discuss this?")}
                    className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    Market Questions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage("I'd like to update my property preferences. Can we review what I'm looking for?")}
                    className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    Update Preferences
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* From Information */}
          <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-slate-800">From</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span><strong>Name:</strong> {buyerName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span><strong>Email:</strong> {buyerEmail}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Your agent will be able to reply directly to your email address.
                </p>
              </div>
            </CardContent>
          </Card>

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
              variant="outline"
              onClick={handleReset}
              className="border-border text-slate-700 hover:bg-slate-50"
              disabled={isSubmitting || (!subject && !message)}
            >
              Clear
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={!message.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};