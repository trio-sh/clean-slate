import { useState } from 'react';
import { sendSMS } from '../lib/utils';

const SMSTestComponent = () => {
  const [phoneNumber, setPhoneNumber] = useState('14372156321');
  const [message, setMessage] = useState('Test message from Amani\'s Cleaners integration!');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSendSMS = async () => {
    setIsSending(true);
    setResult(null);
    
    try {
      const response = await sendSMS(phoneNumber, message, true); // forceLive = true
      setResult(response);
      console.log('SMS Result:', response);
    } catch (error) {
      setResult({ success: false, error: error.message });
      console.error('SMS Error:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-navy-900 mb-6">SMS Integration Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500"
            placeholder="14372156321"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amani-500 focus:border-amani-500"
            placeholder="Enter your test message..."
          />
        </div>
        
        <button
          onClick={handleSendSMS}
          disabled={isSending}
          className="w-full bg-amani-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-amani-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? 'Sending...' : 'Send Test SMS'}
        </button>
      </div>
      
      {result && (
        <div className={`mt-6 p-4 rounded-lg ${
          result.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`font-semibold ${
            result.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {result.success ? '✅ Success!' : '❌ Error'}
          </h3>
          <pre className="mt-2 text-sm whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Note:</strong> This uses the live Infobip API with your configured credentials.</p>
        <p className="mt-1">Test phone: 14372156321 (your number from the working script)</p>
      </div>
    </div>
  );
};

export default SMSTestComponent;