import React, { useState } from 'react';
import { CreditCard, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface CardItem {
  id: string;
  cardName: string;
  bankName: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  balance: number;
  limit: number;
  type: 'platinum' | 'infinite' | 'gold' | 'black';
}

interface CardStackProps {
  cards?: CardItem[];
  onAddCard?: () => void;
}

export const CardStack: React.FC<CardStackProps> = ({ cards = [], onAddCard }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const defaultCards: CardItem[] = cards.length > 0 ? cards : [
    {
      id: 'c1',
      cardName: 'Visa Platinum',
      bankName: 'HDFC Bank',
      cardNumber: '4532 •••• •••• 8890',
      cardHolder: 'Porulalar VIP',
      expiry: '08/28',
      balance: 42500,
      limit: 250000,
      type: 'platinum'
    },
    {
      id: 'c2',
      cardName: 'Visa Infinite',
      bankName: 'ICICI Bank',
      cardNumber: '4210 •••• •••• 3291',
      cardHolder: 'Porulalar VIP',
      expiry: '11/29',
      balance: 18900,
      limit: 500000,
      type: 'infinite'
    }
  ];

  const currentCard = defaultCards[activeIndex % defaultCards.length];

  return (
    <div className="bg-white border-2 border-teal-300 rounded-3xl p-6 flex flex-col justify-between shadow-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-teal-100 border border-teal-300 flex items-center justify-center text-teal-800">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-teal-950 uppercase tracking-wider">Credit Cards</h3>
            <p className="text-xs text-teal-800 font-semibold">{defaultCards.length} linked accounts</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveIndex((prev) => (prev > 0 ? prev - 1 : defaultCards.length - 1))}
            className="p-1.5 rounded-xl bg-teal-100 border border-teal-300 text-teal-900 hover:bg-teal-200 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setActiveIndex((prev) => (prev + 1) % defaultCards.length)}
            className="p-1.5 rounded-xl bg-teal-100 border border-teal-300 text-teal-900 hover:bg-teal-200 transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Credit Card Display */}
      <div className="relative h-44 rounded-2xl bg-teal-900 border border-teal-700 p-5 flex flex-col justify-between shadow-md text-white">
        <div className="flex items-center justify-between z-10">
          <span className="text-xs font-black tracking-wider uppercase">{currentCard.bankName}</span>
          <span className="text-xs font-black italic tracking-widest text-teal-200">VISA</span>
        </div>

        <div className="flex items-center gap-3 z-10">
          <div className="w-9 h-7 rounded-md bg-amber-400 border border-amber-300 shadow-xs flex items-center justify-center">
            <div className="w-5 h-4 border border-amber-700/50 rounded-xs" />
          </div>
        </div>

        <div className="z-10 space-y-1">
          <div className="text-sm font-mono tracking-widest font-black text-white">{currentCard.cardNumber}</div>
          <div className="flex items-center justify-between text-[10px] text-teal-200 font-bold">
            <span>HOLDER: <strong className="text-white">{currentCard.cardHolder}</strong></span>
            <span>EXPIRES: <strong className="text-white">{currentCard.expiry}</strong></span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="text-xs text-teal-900 font-bold">
          Outstanding: <strong className="text-rose-700 font-black">₹{currentCard.balance.toLocaleString()}</strong>
        </div>
        {onAddCard && (
          <button
            onClick={onAddCard}
            className="inline-flex items-center gap-1.5 text-xs font-black text-teal-900 hover:underline cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Card
          </button>
        )}
      </div>
    </div>
  );
};
