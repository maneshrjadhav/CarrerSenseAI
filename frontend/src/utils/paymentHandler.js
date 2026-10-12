/**
 * CareerSense AI - Razorpay Checkout Helper
 * Handles Razorpay checkout modal, UPI & Debit Card selection,
 * cryptographic verification callback, and seamless sandbox testing.
 */

import subscriptionService from '../services/subscriptionService';

/**
 * Ensure Razorpay checkout script is loaded
 */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Renders an interactive, student-friendly test payment modal when running
 * in test/sandbox mode without active live merchant credentials.
 */
function renderSandboxPaymentModal(orderData, { paymentMethod = 'upi', onSuccess, onError, onDismiss }) {
  const modalId = 'careersense-sandbox-modal-container';
  const existing = document.getElementById(modalId);
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = modalId;
  container.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(15, 23, 42, 0.78);
    backdrop-filter: blur(6px);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    padding: 16px;
    box-sizing: border-box;
  `;

  let currentMethod = paymentMethod;

  container.innerHTML = `
    <div style="
      background: var(--bg-card, #ffffff);
      color: var(--text-main, #0f172a);
      border-radius: 16px;
      max-width: 460px;
      width: 100%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid var(--border-color, #e2e8f0);
      overflow: hidden;
      animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    ">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); color: white; padding: 20px 24px; position: relative;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <div style="font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; opacity: 0.85;">
            Razorpay Secure • Test Mode
          </div>
          <span style="background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;">
            SANDBOX
          </span>
        </div>
        <div style="font-size: 20px; font-weight: 800;">CareerSense AI</div>
        <div style="font-size: 13px; opacity: 0.9; margin-top: 4px;">${orderData.plan?.plan_name || 'Premium Subscription'}</div>
      </div>

      <!-- Body -->
      <div style="padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; margin-bottom: 20px;">
          <span style="font-size: 14px; color: #64748b; font-weight: 500;">Amount Payable</span>
          <span style="font-size: 28px; font-weight: 800; color: #2563eb;">₹${orderData.amount_inr || (orderData.amount / 100)}</span>
        </div>

        <div style="margin-bottom: 18px;">
          <label style="display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">
            Select Payment Method (Test Simulation)
          </label>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <button type="button" id="btn-method-upi" style="
              padding: 10px 12px;
              border-radius: 8px;
              border: 2px solid ${currentMethod === 'upi' ? '#2563eb' : '#e2e8f0'};
              background: ${currentMethod === 'upi' ? '#eff6ff' : '#ffffff'};
              color: ${currentMethod === 'upi' ? '#1d4ed8' : '#334155'};
              font-weight: 600;
              font-size: 13px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            ">
              ⚡ UPI / QR
            </button>
            <button type="button" id="btn-method-card" style="
              padding: 10px 12px;
              border-radius: 8px;
              border: 2px solid ${currentMethod === 'debit_card' ? '#2563eb' : '#e2e8f0'};
              background: ${currentMethod === 'debit_card' ? '#eff6ff' : '#ffffff'};
              color: ${currentMethod === 'debit_card' ? '#1d4ed8' : '#334155'};
              font-weight: 600;
              font-size: 13px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            ">
              💳 Debit / Card
            </button>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 20px; font-size: 13px; color: #475569;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #64748b;">Candidate:</span>
            <span style="font-weight: 600; color: #0f172a;">${orderData.user?.name || 'Candidate'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: #64748b;">Email:</span>
            <span style="font-weight: 600; color: #0f172a;">${orderData.user?.email || ''}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Order Ref:</span>
            <span style="font-family: monospace; font-size: 11px; color: #64748b;">${orderData.order_id}</span>
          </div>
        </div>

        <div id="sim-error-box" style="display: none; background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 10px; border-radius: 8px; font-size: 13px; margin-bottom: 16px;"></div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button type="button" id="btn-confirm-payment" style="
            width: 100%;
            background: #16a34a;
            color: #ffffff;
            border: none;
            border-radius: 10px;
            padding: 13px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3);
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          ">
            <span>✓</span> Simulate Successful Payment (₹${orderData.amount_inr || (orderData.amount / 100)})
          </button>
          <button type="button" id="btn-cancel-payment" style="
            width: 100%;
            background: transparent;
            color: #64748b;
            border: 1px solid #cbd5e1;
            border-radius: 10px;
            padding: 10px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          ">
            Cancel Transaction
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  const btnUpi = container.querySelector('#btn-method-upi');
  const btnCard = container.querySelector('#btn-method-card');
  const btnConfirm = container.querySelector('#btn-confirm-payment');
  const btnCancel = container.querySelector('#btn-cancel-payment');
  const errorBox = container.querySelector('#sim-error-box');

  btnUpi.addEventListener('click', () => {
    currentMethod = 'upi';
    btnUpi.style.border = '2px solid #2563eb';
    btnUpi.style.background = '#eff6ff';
    btnUpi.style.color = '#1d4ed8';
    btnCard.style.border = '2px solid #e2e8f0';
    btnCard.style.background = '#ffffff';
    btnCard.style.color = '#334155';
  });

  btnCard.addEventListener('click', () => {
    currentMethod = 'debit_card';
    btnCard.style.border = '2px solid #2563eb';
    btnCard.style.background = '#eff6ff';
    btnCard.style.color = '#1d4ed8';
    btnUpi.style.border = '2px solid #e2e8f0';
    btnUpi.style.background = '#ffffff';
    btnUpi.style.color = '#334155';
  });

  btnCancel.addEventListener('click', () => {
    container.remove();
    if (onDismiss) onDismiss();
  });

  btnConfirm.addEventListener('click', async () => {
    try {
      btnConfirm.disabled = true;
      btnConfirm.innerHTML = 'Verifying Transaction with Backend...';
      btnConfirm.style.opacity = '0.75';

      const simulatedPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const verificationPayload = {
        razorpay_order_id: orderData.order_id,
        razorpay_payment_id: simulatedPaymentId,
        razorpay_signature: `sim_sig_${simulatedPaymentId}`,
        plan_id: orderData.plan?.id,
        payment_method: currentMethod,
      };

      const verifyResult = await subscriptionService.verifyPayment(verificationPayload);
      container.remove();

      if (verifyResult.success) {
        if (onSuccess) onSuccess(verifyResult);
      } else {
        if (onError) onError(new Error(verifyResult.message || 'Payment verification failed.'));
      }
    } catch (verErr) {
      btnConfirm.disabled = false;
      btnConfirm.innerHTML = 'Simulate Successful Payment';
      btnConfirm.style.opacity = '1';
      errorBox.style.display = 'block';
      errorBox.innerText = verErr.message || 'Error communicating with verification service.';
      if (onError) onError(verErr);
    }
  });
}

/**
 * Launch Razorpay checkout modal or fallback test flow
 *
 * @param {Object} orderData - Response from /api/subscription/create-order
 * @param {Object} options - Callbacks: onSuccess, onError, onDismiss
 */
export async function launchRazorpayPayment(orderData, { onSuccess, onError, onDismiss, paymentMethod = 'upi' } = {}) {
  try {
    const isRealLiveOrder = (
      !orderData.is_sandbox &&
      orderData.order_id &&
      !orderData.order_id.startsWith('order_test_') &&
      orderData.key_id &&
      !orderData.key_id.startsWith('rzp_test_CareerSenseAI') &&
      !orderData.key_id.startsWith('rzp_test_placeholder')
    );

    if (isRealLiveOrder) {
      const isScriptLoaded = await loadRazorpayScript();
      if (isScriptLoaded && window.Razorpay) {
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'CareerSense AI',
          description: `${orderData.plan?.plan_name || 'Premium Plan'} Subscription`,
          image: '/favicon.ico',
          order_id: orderData.order_id,
          prefill: {
            name: orderData.user?.name || '',
            email: orderData.user?.email || '',
            contact: orderData.user?.phone || '',
          },
          notes: {
            plan_id: orderData.plan?.id,
            plan_name: orderData.plan?.plan_name,
          },
          theme: {
            color: '#2563eb', // Royal CareerSense Blue
          },
          modal: {
            ondismiss: () => {
              if (onDismiss) onDismiss();
            },
          },
          handler: async function (response) {
            try {
              const verificationPayload = {
                razorpay_order_id: response.razorpay_order_id || orderData.order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan_id: orderData.plan?.id,
                payment_method: paymentMethod,
              };

              const verifyResult = await subscriptionService.verifyPayment(verificationPayload);
              if (verifyResult.success) {
                if (onSuccess) onSuccess(verifyResult);
              } else {
                if (onError) onError(new Error(verifyResult.message || 'Payment verification failed.'));
              }
            } catch (verErr) {
              if (onError) onError(verErr);
            }
          },
        };

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.on('payment.failed', function (response) {
          if (onError) {
            onError(new Error(response.error?.description || 'Payment failed. Please try again.'));
          }
        });
        rzpInstance.open();
        return;
      }
    }

    // Render interactive student test payment simulation modal
    renderSandboxPaymentModal(orderData, { paymentMethod, onSuccess, onError, onDismiss });
  } catch (err) {
    if (onError) onError(err);
  }
}


