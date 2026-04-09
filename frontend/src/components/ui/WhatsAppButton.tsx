import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  partyName: string;
  amount?: number;
  balanceType?: 'DR' | 'CR';
  label?: string;
}

export function WhatsAppButton({ phone, partyName, amount, balanceType, label }: WhatsAppButtonProps) {
  const handleClick = () => {
    // Clean phone number — remove spaces, dashes, +
    const cleaned = phone.replace(/[\s\-+()\-.]/g, '');
    // Add India country code if not already present
    const intlPhone = cleaned.startsWith('91') ? cleaned : `91${cleaned}`;

    let message = '';
    if (amount !== undefined && balanceType) {
      const typeLabel = balanceType === 'DR' ? 'payable to us' : 'receivable from us';
      message =
        `🙏 Reminder from *Angadia Pedhi*\n\n` +
        `Dear *${partyName}*,\n` +
        `Your current outstanding balance is *₹${amount.toLocaleString('en-IN')}* (${typeLabel}).\n\n` +
        `Kindly arrange settlement at your earliest convenience.\n\n` +
        `Thank you 🙏\n_Angadia Pedhi_`;
    } else {
      message =
        `🙏 Reminder from *Angadia Pedhi*\n\n` +
        `Dear *${partyName}*,\n` +
        `This is a gentle reminder regarding your account with us.\n\n` +
        `Please contact us to discuss your outstanding balance.\n\n` +
        `Thank you 🙏\n_Angadia Pedhi_`;
    }

    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!phone) return null;

  return (
    <button
      onClick={handleClick}
      className="btn-whatsapp"
      title={`Send WhatsApp reminder to ${partyName}`}
    >
      <MessageCircle className="w-3.5 h-3.5" />
      {label || 'WhatsApp'}
    </button>
  );
}
