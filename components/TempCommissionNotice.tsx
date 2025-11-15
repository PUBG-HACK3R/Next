'use client';

import { AlertCircle } from 'lucide-react';

export default function TempCommissionNotice() {
  return (
    <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Temporary Notice: Commissions Disabled
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              We're currently performing maintenance on our commission system. 
              All referral commissions (deposit and earnings) are temporarily 
              disabled. We'll restore full functionality as soon as possible.
              Thank you for your patience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
