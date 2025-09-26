'use client';

export default function StarRating({ rating }) {
  // Math.roundで四捨五入して、最も近い星の数にします (例: 4.8 -> 5)
  const roundedRating = Math.round(rating);

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`text-xl ${star <= roundedRating ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </span>
      ))}
    </div>
  );
}