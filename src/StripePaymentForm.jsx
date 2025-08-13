import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function StripePaymentForm({ amount, label = 'Pay', onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // 1. Create payment intent on backend
    const res = await fetch('/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'usd' })
    });
    const data = await res.json();
    if (!data.clientSecret) {
      setError(data.error || 'Failed to create payment intent');
      setLoading(false);
      return;
    }

    // 2. Confirm card payment
    const result = await stripe.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)
      }
    });

    if (result.error) {
      setError(result.error.message);
    } else if (result.paymentIntent.status === 'succeeded') {
      setSuccess(true);
      if (onSuccess) onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <CardElement
        className="p-2 bg-gray-900 rounded"
        options={{
          style: {
            base: {
              color: '#fff',
              '::placeholder': { color: '#bbb' },
            },
            invalid: {
              color: '#ff6b6b',
            },
          },
        }}
      />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-yellow-400 text-gray-900 font-bold py-2 px-6 rounded mt-2"
      >
        {loading ? 'Processing...' : label}
      </button>
      {error && <div className="text-red-400 mt-2">{error}</div>}
      {success && <div className="text-green-400 mt-2">Payment successful!</div>}
    </form>
  );
}
